import { Queue } from "bullmq";

import { QUEUE_CONFIG, QueueData, Queues } from "./config";
import { createConnection } from "./redis";

/**
 * Type-safe queue builder
 */
export class QueueBuilder {
  private static queues = new Map<Queues, Queue>();

  static getQueue<T extends Queues>(queue_name: T): Queue<QueueData<T>> {
    if (!this.queues.has(queue_name)) {
      const config = QUEUE_CONFIG[queue_name];
      const queue = new Queue<QueueData<T>>(config.name, {
        connection: createConnection(),
        defaultJobOptions: config.defaultJobOptions,
      });
      this.queues.set(queue_name, queue as Queue);
    }
    return this.queues.get(queue_name) as Queue<QueueData<T>>;
  }

  /**
   * Type-safe job addition
   * @param queue_name The name of the queue
   * @param job_name The name of the job
   * @param data The data for the job
   * @param options Optional job options
   * @returns A promise that resolves when the job is added
   */
  static async addJob<T extends Queues>(
    queue_name: T,
    job_name: string,
    data: QueueData<T>,
    options?: any,
  ) {
    const queue = this.getQueue(queue_name);
    // @ts-ignore
    return queue.add(job_name, data, options);
  }

  /**
   * Batch job addition with type safety
   * @param queue_name The name of the queue
   * @param jobs An array of objects with name, data, and optional opts
   * @returns A promise that resolves when the jobs are added
   */
  static async addBulkJobs<T extends Queues>(
    queue_name: T,
    jobs: Array<{ name: string; data: QueueData<T>; opts?: any }>,
  ) {
    const queue = this.getQueue(queue_name);
    // @ts-ignore
    return queue.addBulk(jobs);
  }

  /**
   * Get all registered queues
   * @returns All registered queues
   */
  static getAllQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Close all queues
   * @returns A promise that resolves when all queues are closed
   */
  static async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close()),
    );
    this.queues.clear();
  }
}

// Convenience functions for common operations
export const createQueue = <T extends Queues>(queue_name: T) =>
  QueueBuilder.getQueue(queue_name);

export const addJob = <T extends Queues>(
  queue_name: T,
  job_name: string,
  data: QueueData<T>,
  options?: any,
) => QueueBuilder.addJob(queue_name, job_name, data, options);

export const addBulkJobs = <T extends Queues>(
  queue_name: T,
  jobs: Array<{ name: string; data: QueueData<T>; opts?: any }>,
) => QueueBuilder.addBulkJobs(queue_name, jobs);
