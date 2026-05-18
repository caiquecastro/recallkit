import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import type { getDb } from "@/db/client";
import { users } from "@/db/schema";

type DatabaseExecutor = Pick<
  ReturnType<typeof getDb>,
  "insert" | "select" | "update"
>;

export async function getDevUserId(db: DatabaseExecutor) {
  return getCurrentUserId(db);
}

export async function getCurrentUserId(db: DatabaseExecutor) {
  const { userId } = await auth.protect();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (existingUser) {
    return existingUser.id;
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ?? `${userId}@clerk.local`;

  const [createdUser] = await db
    .insert(users)
    .values({ clerkUserId: userId, email })
    .onConflictDoNothing({ target: users.clerkUserId })
    .returning({ id: users.id });

  if (createdUser) {
    return createdUser.id;
  }

  const [userWithEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (userWithEmail) {
    await db
      .update(users)
      .set({ clerkUserId: userId })
      .where(eq(users.id, userWithEmail.id));

    return userWithEmail.id;
  }

  const [createdUserByClerkId] = await db
    .insert(users)
    .values({ clerkUserId: userId, email })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: { email },
    })
    .returning({ id: users.id });

  if (createdUserByClerkId) {
    return createdUserByClerkId.id;
  }

  const [resolvedUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  if (!resolvedUser) {
    throw new Error("Unable to resolve the signed-in user.");
  }

  return resolvedUser.id;
}
