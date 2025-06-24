import { createWorker } from "@/worker-builder";

import { Queues } from "@r3veal/queues";
import { migrateCandidates } from "@r3veal/scripts/migrate-paraform-data";

export const migrateCandidatesWorker = createWorker(
  Queues.ParaformCandidateQueue,
  async (job) => {
    await migrateCandidates();
  },
  {
    concurrency: 1,
  },
);
