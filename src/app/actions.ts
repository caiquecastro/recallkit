"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import {
  collectionItems,
  collections,
  documents,
  items,
  itemTags,
  tags,
} from "@/db/schema";
import { getDevUserId } from "@/lib/dev-user";

type DatabaseExecutor = Pick<ReturnType<typeof getDb>, "insert" | "select">;

export async function createNote(formData: FormData) {
  const title = getRequiredString(formData, "title");
  const content = getRequiredString(formData, "content");
  const collectionName = getOptionalString(formData, "collection");
  const tagNames = parseTags(getOptionalString(formData, "tags"));

  const db = getDb();

  const itemId = await db.transaction(async (tx) => {
    const userId = await getDevUserId(tx);

    const [item] = await tx
      .insert(items)
      .values({
        userId,
        title,
        sourceType: "note",
        contentText: content,
        status: "ready",
      })
      .returning({ id: items.id });

    await tx.insert(documents).values({
      itemId: item.id,
      rawText: content,
      cleanedText: content.trim(),
    });

    for (const tagName of tagNames) {
      const tagId = await resolveTagId(tx, userId, tagName);

      await tx
        .insert(itemTags)
        .values({ itemId: item.id, tagId })
        .onConflictDoNothing();
    }

    if (collectionName) {
      const collectionId = await resolveCollectionId(
        tx,
        userId,
        collectionName,
      );

      await tx
        .insert(collectionItems)
        .values({ collectionId, itemId: item.id })
        .onConflictDoNothing();
    }

    return item.id;
  });

  redirect(`/library/${itemId}`);
}

function getRequiredString(formData: FormData, field: string) {
  const value = getOptionalString(formData, field);

  if (!value) {
    throw new Error(`${field} is required.`);
  }

  return value;
}

function getOptionalString(formData: FormData, field: string) {
  const value = formData.get(field);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseTags(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

async function resolveTagId(
  tx: DatabaseExecutor,
  userId: string,
  name: string,
) {
  const [createdTag] = await tx
    .insert(tags)
    .values({ userId, name })
    .onConflictDoNothing({ target: [tags.userId, tags.name] })
    .returning({ id: tags.id });

  if (createdTag) {
    return createdTag.id;
  }

  const [existingTag] = await tx
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, name)))
    .limit(1);

  if (!existingTag) {
    throw new Error(`Unable to resolve tag ${name}.`);
  }

  return existingTag.id;
}

async function resolveCollectionId(
  tx: DatabaseExecutor,
  userId: string,
  name: string,
) {
  const [createdCollection] = await tx
    .insert(collections)
    .values({ userId, name })
    .onConflictDoNothing({ target: [collections.userId, collections.name] })
    .returning({ id: collections.id });

  if (createdCollection) {
    return createdCollection.id;
  }

  const [existingCollection] = await tx
    .select({ id: collections.id })
    .from(collections)
    .where(and(eq(collections.userId, userId), eq(collections.name, name)))
    .limit(1);

  if (!existingCollection) {
    throw new Error(`Unable to resolve collection ${name}.`);
  }

  return existingCollection.id;
}
