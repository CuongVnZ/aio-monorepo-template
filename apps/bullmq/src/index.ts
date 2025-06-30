import { Logger } from "@acme/logging";

import { WorkerBuilder } from "./worker-builder";

export * from "./workers/sample";

export { env } from "./env";

const logger = new Logger("Workers");

// Start all workers
const startWorkers = async () => {
  try {
    logger.info("env", JSON.stringify(process.env, null, 2));
    // get all registered workers
    const workers = WorkerBuilder.getAllWorkers();
    for (const worker of workers) {
      await worker.run();
    }

    logger.info("All workers started successfully");
  } catch (error) {
    logger.error("Failed to start workers:", error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down workers...`);
  try {
    const workers = WorkerBuilder.getAllWorkers();
    for (const worker of workers) {
      await worker.close();
    }
    logger.info("All workers closed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception:", err);
  process.exit(1);
});
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled rejection at:", promise, "reason:", reason);
  process.exit(1);
});

startWorkers();
