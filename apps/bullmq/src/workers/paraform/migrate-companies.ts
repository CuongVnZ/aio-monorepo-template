import { createWorker } from "@/worker-builder";

import { Queues } from "@r3veal/queues";
import { migrateCompanies } from "@r3veal/scripts/migrate-paraform-data";

export const migrateCompaniesWorker = createWorker(
  Queues.ParaformCompanyQueue,
  async (job) => {
    await migrateCompanies();
  },
  {
    concurrency: 1,
  },
);
