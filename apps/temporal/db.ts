import { db } from "@acme/db/client";

const createClient = () => db;

const globalForClient = globalThis as unknown as {
  client: ReturnType<typeof createClient> | undefined;
};

export const client = globalForClient.client ?? createClient();