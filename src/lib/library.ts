import { and, desc, eq } from "drizzle-orm";

import { getDb, hasDatabaseUrl } from "@/db/client";
import {
  collectionItems,
  collections,
  documents,
  items,
  itemTags,
  tags,
} from "@/db/schema";
import { getDevUserId } from "@/lib/dev-user";

export type LibraryState =
  | { status: "missing-database-url" }
  | { status: "ready"; items: LibraryItem[] };

export type LibraryItem = {
  id: string;
  title: string;
  sourceType: "url" | "pdf" | "note" | "video" | "document";
  status: "draft" | "processing" | "ready" | "failed";
  summary: string | null;
  createdAt: Date;
  tags: string[];
  collections: string[];
};

export type ItemDetailState =
  | { status: "missing-database-url" }
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
  if (!hasDatabaseUrl()) {
    return { status: "missing-database-url" };
  }

  const db = getDb();
  const userId = await getDevUserId(db);

  const rows = await db
    .select({
      id: items.id,
      title: items.title,
      sourceType: items.sourceType,
      status: items.status,
      summary: items.summary,
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
  if (!hasDatabaseUrl()) {
    return { status: "missing-database-url" };
  }

  const db = getDb();
  const userId = await getDevUserId(db);

  const [item] = await db
    .select({
      id: items.id,
      title: items.title,
      sourceType: items.sourceType,
      status: items.status,
      summary: items.summary,
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

function groupLibraryRows(
  rows: Array<{
    id: string;
    title: string;
    sourceType: LibraryItem["sourceType"];
    status: LibraryItem["status"];
    summary: string | null;
    createdAt: Date;
    tagName: string | null;
    collectionName: string | null;
  }>,
) {
  const grouped = new Map<string, LibraryItem>();

  for (const row of rows) {
    const item =
      grouped.get(row.id) ??
      ({
        id: row.id,
        title: row.title,
        sourceType: row.sourceType,
        status: row.status,
        summary: row.summary,
        createdAt: row.createdAt,
        tags: [],
        collections: [],
      } satisfies LibraryItem);

    if (row.tagName && !item.tags.includes(row.tagName)) {
      item.tags.push(row.tagName);
    }

    if (row.collectionName && !item.collections.includes(row.collectionName)) {
      item.collections.push(row.collectionName);
    }

    grouped.set(row.id, item);
  }

  return Array.from(grouped.values());
}
