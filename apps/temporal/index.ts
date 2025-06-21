import http from "http";
import { join } from "path";
import { NativeConnection, Worker } from "@temporalio/worker";

import { getSampleActivity } from "./activities/sample";
import { Activities } from "./workflows";

export async function runWorker() {
  // @ts-ignore ts fails to infer the type of the injected services
  const workflowActivities: Activities = {
    sampleActivity: getSampleActivity(),
  };
  // Step 1: Establish a connection with Temporal server.
  //
  // Worker code uses `@temporalio/worker.NativeConnection`.
  // (But in your application code it's `@temporalio/client.Connection`.)
  let server: http.Server | undefined;
  try {
    let connection: NativeConnection;
    if (process.env.TEMPORAL_CLIENT_CERT && process.env.TEMPORAL_CLIENT_KEY) {
      console.log("Connecting to Temporal in production mode");
      connection = await NativeConnection.connect({
        address: process.env.TEMPORAL_ADDRESS!,
        tls: {
          clientCertPair: {
            crt: Buffer.from(process.env.TEMPORAL_CLIENT_CERT, "utf-8"),
            key: Buffer.from(process.env.TEMPORAL_CLIENT_KEY, "utf-8"),
          },
        },
      });
    } else {
      console.log("Connecting to Temporal in development mode");
      connection = await NativeConnection.connect({
        address: process.env.TEMPORAL_ADDRESS!,
      });
    }

    // Step 2: Register Workflows and Activities with the Worker.
    const worker = await Worker.create({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE!,
      taskQueue: process.env.TEMPORAL_TASK_QUEUE!,
      // Workflows are registered using a path as they run in a separate JS context.
      // workflowBundle: {
      //   codePath: new URL("./workflow-bundle.js", import.meta.url).pathname,
      // },
      workflowsPath: join(import.meta.dirname, "workflows"),
      activities: workflowActivities,
      maxConcurrentActivityTaskExecutions: 20,
    });

    // Add health check server
    server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end("OK");
    });
    server.listen(8080, () => {
      console.log("Health check server listening on port 8080");
    });

    await worker.run();
  } catch (err) {
    console.error("Error running worker", err);
    server?.close(); // Close the server on error
    throw err;
  }
}

runWorker().catch((err) => {
  console.error("Error running worker", err);
  process.exit(1);
});
