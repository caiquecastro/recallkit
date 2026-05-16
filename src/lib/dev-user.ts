import { eq } from "drizzle-orm";

import type { getDb } from "@/db/client";
import { users } from "@/db/schema";

const DEV_USER_EMAIL = "demo@recallkit.local";

type DatabaseExecutor = Pick<ReturnType<typeof getDb>, "insert" | "select">;

export async function getDevUserId(db: DatabaseExecutor) {
  const [createdUser] = await db
    .insert(users)
    .values({ email: DEV_USER_EMAIL })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (createdUser) {
    return createdUser.id;
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, DEV_USER_EMAIL))
    .limit(1);

  if (!existingUser) {
    throw new Error("Unable to resolve the development user.");
  }

  return existingUser.id;
}
