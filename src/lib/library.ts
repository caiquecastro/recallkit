import { and, desc, eq } from "drizzle-orm";

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
import { groupLibraryRows, type LibraryItem } from "@/lib/library-rows";

export type LibraryState = { status: "ready"; items: LibraryItem[] };

export type ItemDetailState =
  | { status: "not-found" }
  | {
      status: "ready";
      item: LibraryItem & {
        contentText: string | null;
        document: {
          rawText: string;
          cleanedText: string;
        } | null;
      };
    };

export async function getLibraryItems(): Promise<LibraryState> {
  const db = getDb();
  const userId = await getDevUserId(db);

  const rows = await db
    .select({
      id: items.id,
      title: items.title,
      sourceType: items.sourceType,
      status: items.status,
      summary: items.summary,
      url: items.url,
      createdAt: items.createdAt,
      tagName: tags.name,
      collectionName: collections.name,
    })
    .from(items)
    .leftJoin(itemTags, eq(itemTags.itemId, items.id))
    .leftJoin(tags, eq(tags.id, itemTags.tagId))
    .leftJoin(collectionItems, eq(collectionItems.itemId, items.id))
    .leftJoin(collections, eq(collections.id, collectionItems.collectionId))
    .where(eq(items.userId, userId))
    .orderBy(desc(items.createdAt));

  return {
    status: "ready",
    items: groupLibraryRows(rows),
  };
}

export async function getItemDetail(itemId: string): Promise<ItemDetailState> {
  const db = getDb();
  const userId = await getDevUserId(db);

  const [item] = await db
    .select({
      id: items.id,
      title: items.title,
      sourceType: items.sourceType,
      status: items.status,
      summary: items.summary,
      url: items.url,
      contentText: items.contentText,
      createdAt: items.createdAt,
      rawText: documents.rawText,
      cleanedText: documents.cleanedText,
    })
    .from(items)
    .leftJoin(documents, eq(documents.itemId, items.id))
    .where(and(eq(items.id, itemId), eq(items.userId, userId)))
    .limit(1);

  if (!item) {
    return { status: "not-found" };
  }

  const tagRows = await db
    .select({ name: tags.name })
    .from(itemTags)
    .innerJoin(tags, eq(tags.id, itemTags.tagId))
    .where(eq(itemTags.itemId, itemId))
    .orderBy(tags.name);

  const collectionRows = await db
    .select({ name: collections.name })
    .from(collectionItems)
    .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
    .where(eq(collectionItems.itemId, itemId))
    .orderBy(collections.name);

  return {
    status: "ready",
    item: {
      id: item.id,
      title: item.title,
      sourceType: item.sourceType,
      status: item.status,
      summary: item.summary,
      url: item.url,
      contentText: item.contentText,
      createdAt: item.createdAt,
      tags: tagRows.map((tag) => tag.name),
      collections: collectionRows.map((collection) => collection.name),
      document:
        item.rawText && item.cleanedText
          ? { rawText: item.rawText, cleanedText: item.cleanedText }
          : null,
    },
  };
}
