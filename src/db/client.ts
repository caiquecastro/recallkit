import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL as string;

type Database = ReturnType<typeof drizzle<typeof schema>>;

let db: Database | undefined;

export function getDb() {
  if (!db) {
    const client = postgres(databaseUrl, { prepare: false });
    db = drizzle(client, { schema });
  }

  return db;
}
