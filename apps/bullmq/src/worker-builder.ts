import type { WorkerOptions } from "bullmq";
import { Worker } from "bullmq";

import type { Queues } from "@r3veal/queues";
import { Logger } from "@r3veal/logging";
import { createConnection, QUEUE_CONFIG, QueueData } from "@r3veal/queues";

export class WorkerBuilder {
  private static workers = new Map<Queues, Worker>();

  static createWorker<T extends Queues>(
    queueName: T,
    processor: (job: { data: QueueData<T> }) => Promise<any>,
    options?: Omit<WorkerOptions, "connection">,
  ): Worker {
    const logger = new Logger(`Worker: ${queueName}`);
    const config = QUEUE_CONFIG[queueName];
    const worker = new Worker(
      config.name,
      async (job) => {
        return processor(job as { data: QueueData<T> });
      },
      {
        connection: createConnection(),
        autorun: false,
        ...options,
      },
    );

    worker.on("ready", () => {
      logger.info(`Worker ${queueName} ready`);
    });

    worker.on("completed", (jobId, result) => {
      logger.info(`Job ${jobId} completed with result: ${result}`);
    });

    worker.on("failed", (jobId, error) => {
      logger.error(`Job ${jobId} failed with error: ${error}`);
    });

    worker.on("error", (error) => {
      logger.error(`Worker ${queueName} error: ${error}`);
    });

    worker.on("progress", (jobId, progress) => {
      logger.info(`Job ${jobId} progress: ${progress}`);
    });

    this.workers.set(queueName, worker);
    return worker;
  }

  // Get all registered workers
  static getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  // Close all workers
  static async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close()),
    );
    this.workers.clear();
  }
}

/**
 * Use this builder so we don't have to keep track of logging
 * and other worker configuration
 */
export const createWorker = <T extends Queues>(
  queueName: T,
  processor: (job: { data: QueueData<T> }) => Promise<any>,
  options?: Omit<WorkerOptions, "connection">,
) => WorkerBuilder.createWorker(queueName, processor, options);
