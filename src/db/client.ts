import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

const databaseUrl = process.env.DATABASE_URL;

type Database = ReturnType<typeof drizzle<typeof schema>>;

let db: Database | undefined;

export function hasDatabaseUrl() {
  return Boolean(databaseUrl);
}

export function getDb() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to connect to the database.");
  }

  if (!db) {
    const client = postgres(databaseUrl, { prepare: false });
    db = drizzle(client, { schema });
  }

  return db;
}
