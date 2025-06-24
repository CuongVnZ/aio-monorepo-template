import { createWorker } from "@/worker-builder";

import { Queues } from "@r3veal/queues";
import { migrateEducation } from "@r3veal/scripts/migrate-paraform-data";

export const migrateEducationWorker = createWorker(
  Queues.ParaformEducationQueue,
  async (job) => {
    await migrateEducation();
  },
  {
    concurrency: 1,
  },
);
