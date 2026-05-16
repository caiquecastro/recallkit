import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

if (existsSync(".env.local")) {
  loadEnvFile(".env.local");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
