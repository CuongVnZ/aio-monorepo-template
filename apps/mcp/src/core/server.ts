import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  Prompt,
  ReadResourceRequestSchema,
  ResourceTemplate,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { buildURI } from "../helpers/uri";
import { zodKeys } from "../utils";
import {
  promptRouterMcpserverAdapter,
  resourceRouterMcpserverAdapter,
  Router,
  toolRouterMcpserverAdapter,
} from "./routing";

export class McpServer<TContext> {
  #server: Server;
  #router: Router<TContext>;

  #toolHandlerInitialized = false;
  #resourceHandlerInitialized = false;
  #promptHandlerInitialized = false;

  constructor({
    name,
    version,
    router,
  }: {
    name: string;
    version: string;
    router: Router<TContext>;
  }) {
    this.#router = router;

    this.#server = new Server(
      {
        name,
        version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
  }

  public async connect(transport: Transport) {
    console.log("Connecting to MCP server", transport.sessionId);
    return this.#server.connect(transport);
  }

  public async disconnect() {
    return this.#server.close();
  }

  private async setupToolHandlers() {
    console.log("Tool setup");
    if (this.#toolHandlerInitialized) {
      return;
    }

    this.#server.setRequestHandler(ListToolsRequestSchema, (request) => {
      const tools = Object.entries(this.#router.getProcedures())
        .filter(([_, procedure]) => procedure._type === "tool")
        .map(([name, procedure]) => {
          const inputSchema = zodToJsonSchema(procedure._input);
          const outputSchema = procedure._output
            ? zodToJsonSchema(procedure._output)
            : undefined;

          return {
            name: name,
            description: procedure._description,
            inputSchema: inputSchema,
            outputSchema: outputSchema,
          } as Tool;
        });

      return {
        tools,
      };
    });

    this.#server.setRequestHandler(CallToolRequestSchema, async (request) => {
      return await toolRouterMcpserverAdapter(this.#router, request);
    });

    this.#toolHandlerInitialized = true;
  }

  private async setupPromptHandlers() {
    console.log("Prompt setup");
    if (this.#promptHandlerInitialized) {
      return;
    }

    this.#server.setRequestHandler(ListPromptsRequestSchema, (request) => {
      const prompts = Object.entries(this.#router.getProcedures())
        .filter(([_, procedure]) => procedure._type === "prompt")
        .map(([name, procedure]) => {
          const inputSchema = procedure._input;
          const inputDescription = inputSchema.description;
          const inputArguments = zodKeys(inputSchema);

          return {
            name: name,
            description: inputDescription,
            arguments: inputArguments,
          } as Prompt;
        });

      return {
        prompts,
      };
    });

    this.#server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      return await promptRouterMcpserverAdapter(this.#router, request);
    });

    this.#promptHandlerInitialized = true;
  }

  private async setupResourceHandlers() {
    if (this.#resourceHandlerInitialized) {
      return;
    }

    this.#server.setRequestHandler(
      ListResourceTemplatesRequestSchema,
      (request) => {
        const resourceTemplates: ResourceTemplate[] = Object.entries(
          this.#router.getProcedures()
        )
          .filter(([_, procedure]) => procedure._type === "resource")
          .map(([name, procedure]) => {
            const inputSchema = zodToJsonSchema(procedure._input);

            // @ts-ignore -- Output of inputSchema seems to follow zod toJSONSchema so forcing type here
            const params = Object.keys(inputSchema.properties);

            const URI = buildURI(name, params);
            return {
              uriTemplate: URI,
              name: name,
              description: procedure._description,
              mimeType: "application/json",
            };
          });

        return { resourceTemplates };
      }
    );

    this.#server.setRequestHandler(ListResourcesRequestSchema, (_) => {
      return { resources: [] };
    });

    this.#server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        return await resourceRouterMcpserverAdapter(this.#router, request);
      }
    );

    this.#toolHandlerInitialized = true;
  }

  public async start(transport: Transport) {
    await this.setupToolHandlers();
    await this.setupResourceHandlers();
    await this.setupPromptHandlers();

    await this.connect(transport);
  }
}
