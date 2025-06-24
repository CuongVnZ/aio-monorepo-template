// example worker template

import { createWorker } from "@/worker-builder";

import { Queues } from "@r3veal/queues";

// The worker is automatically typed with SampleJobData
export const sampleWorker = createWorker(Queues.SampleQueue, async (job) => {
  // job.data is automatically typed as SampleJobData
  console.log("Processing sample job:", job.data.id);
  // TypeScript will enforce that job.data has the correct shape
});
