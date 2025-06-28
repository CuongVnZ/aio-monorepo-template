import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { v4 as uuidv4 } from "uuid";

import packageJson from "../package.json";
import { McpServer as CustomMcpServer } from "./core/server";
import router from "./router/root";

const server = new CustomMcpServer({
  name: packageJson.name,
  version: packageJson.version,
  router,
});

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports = {
  streamable: {} as Record<string, StreamableHTTPServerTransport>,
  sse: {} as Record<string, SSEServerTransport>,
};

app.post("/mcp", async (req, res) => {
  console.log("Received MCP request:", req.body);
  try {
    // Check for existing session ID
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports.streamable[sessionId]) {
      // Reuse existing transport
      transport = transports.streamable[sessionId];
      console.log(transport.sessionId);
    } else if (
      !sessionId &&
      req.body.jsonrpc === "2.0" &&
      req.body.method === "initialize"
    ) {
      // New initialization request - use JSON response mode
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => uuidv4(),
        onsessioninitialized: (sessionId) => {
          // Store the transport by session ID when session is initialized
          // This avoids race conditions where requests might come in before the session is stored
          console.log(`Session initialized with ID: ${sessionId}`);
          transports.streamable[sessionId] = transport;
        },
      });

      // Connect the transport to the MCP server BEFORE handling the request
      await server.start(transport);
      await transport.handleRequest(req, res, req.body);
      return; // Already handled
    } else {
      // Invalid request - no session ID or not initialization request
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32000,
          message: "Bad Request: No valid session ID provided",
        },
        id: null,
      });
      return;
    }

    // Handle the request with existing transport - no need to reconnect
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (
  req: express.Request,
  res: express.Response,
) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
  return;
};

// Handle GET requests for server-to-client notifications via SSE
app.get("/mcp", handleSessionRequest);

// Handle DELETE requests for session termination
app.delete("/mcp", handleSessionRequest);

// Legacy SSE endpoint for older clients
app.get("/sse", async (req, res) => {
  console.log("SSE request", req.headers);
  const transport = new SSEServerTransport("/messages", res);
  console.log("SSE transport", transport.sessionId);
  transports.sse[transport.sessionId] = transport;

  res.on("close", () => {
    console.log("SSE close", transport.sessionId);
    delete transports.sse[transport.sessionId];
  });

  await server.start(transport);
});

// Legacy message endpoint for older clients
app.post("/messages", async (req, res) => {
  console.log("Messages request", req.headers);
  const sessionId = req.query.sessionId as string;
  const transport = transports.sse[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res, req.body);
  } else {
    res.status(400).send("No transport found for sessionId");
    return;
  }
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  // console.log(ASCII_ART);
  // console.log(`MCP env`, JSON.stringify(process.env, null, 2));
  console.log(`MCP Server is running on port ${PORT}`);
});
