// Register your queues here with their corresponding data interfaces
export enum Queues {
  SampleQueue = "sample-queue",
}

export interface SampleJobData {
  id: string;
}

// Automatic mapping between queues and their data interfaces
export type QueueDataMap = {
  [Queues.SampleQueue]: SampleJobData;
};

// Helper type to get the data type for a specific queue
export type QueueData<T extends Queues> = QueueDataMap[T];

// Type-safe queue configuration
export const QUEUE_CONFIG = {
  [Queues.SampleQueue]: {
    name: Queues.SampleQueue,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 5,
    },
  },
} as const;
