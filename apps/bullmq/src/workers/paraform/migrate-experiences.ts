import { createWorker } from "@/worker-builder";

import { Queues } from "@r3veal/queues";
import { migrateExperiences } from "@r3veal/scripts/migrate-paraform-data";

export const migrateExperiencesWorker = createWorker(
  Queues.ParaformExperienceQueue,
  async (job) => {
    await migrateExperiences();
  },
  {
    concurrency: 1,
  },
);
