"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb } from "@/db/client";
import {
  chunks,
  collectionItems,
  collections,
  documents,
  entities,
  items,
  itemTags,
  tags,
} from "@/db/schema";
import { createEmbeddings } from "@/lib/ai";
import { getDevUserId } from "@/lib/dev-user";
import { organizeLibraryItem } from "@/lib/organization";

type DatabaseExecutor = Pick<ReturnType<typeof getDb>, "insert" | "select">;
type SourceType = "note" | "url";
const maxItemTitleLength = 240;

export async function createNote(formData: FormData) {
  const source = await resolveNoteContent({
    content: getOptionalString(formData, "content"),
    title: getOptionalString(formData, "title"),
  });

  await createLibraryItem({
    collectionName: getOptionalString(formData, "collection"),
    source,
    sourceType: "note",
    tagNames: parseTags(getOptionalString(formData, "tags")),
  });
}

export async function createUrlItem(formData: FormData) {
  const source = await resolveUrlContent({
    title: getOptionalString(formData, "title"),
    url: getOptionalString(formData, "url"),
  });

  await createLibraryItem({
    collectionName: getOptionalString(formData, "collection"),
    source,
    sourceType: "url",
    tagNames: parseTags(getOptionalString(formData, "tags")),
  });
}

export async function deleteLibraryItem(formData: FormData) {
  const itemId = requireValue(getOptionalString(formData, "itemId"), "itemId");
  const db = getDb();
  const userId = await getDevUserId(db);

  await db
    .delete(items)
    .where(and(eq(items.id, itemId), eq(items.userId, userId)));

  redirect("/library");
}

async function createLibraryItem({
  collectionName,
  source,
  sourceType,
  tagNames,
}: {
  collectionName: string;
  source: ResolvedSource;
  sourceType: SourceType;
  tagNames: string[];
}) {
  const db = getDb();
  const chunkContents = chunkText(source.content);
  const [embeddings, organization] = await Promise.all([
    createEmbeddings(chunkContents),
    organizeLibraryItem({
      content: source.content,
      sourceType,
      title: source.title,
      url: source.url,
    }),
  ]);
  const itemMetadata = {
    ...source.metadata,
    organization,
  };
  const resolvedTagNames = mergeTags(tagNames, organization.tags);
  const resolvedCollectionName = collectionName || organization.collection;

  const itemId = await db.transaction(async (tx) => {
    const userId = await getDevUserId(tx);

    const [item] = await tx
      .insert(items)
      .values({
        userId,
        title: organization.title,
        sourceType,
        url: source.url,
        contentText: source.content,
        summary: organization.summary,
        status: "ready",
        metadata: itemMetadata,
      })
      .returning({ id: items.id });

    const [document] = await tx
      .insert(documents)
      .values({
        itemId: item.id,
        rawText: source.content,
        cleanedText: source.content.trim(),
        metadata: itemMetadata,
      })
      .returning({ id: documents.id });

    const chunkValues = chunkContents.map((content, chunkIndex) => ({
      documentId: document.id,
      embedding: embeddings[chunkIndex],
      itemId: item.id,
      content,
      chunkIndex,
      metadata: { sourceType },
    }));

    if (chunkValues.length > 0) {
      await tx.insert(chunks).values(chunkValues);
    }

    for (const tagName of resolvedTagNames) {
      const tagId = await resolveTagId(tx, userId, tagName);

      await tx
        .insert(itemTags)
        .values({ itemId: item.id, tagId })
        .onConflictDoNothing();
    }

    if (resolvedCollectionName) {
      const collectionId = await resolveCollectionId(
        tx,
        userId,
        resolvedCollectionName,
      );

      await tx
        .insert(collectionItems)
        .values({ collectionId, itemId: item.id })
        .onConflictDoNothing();
    }

    if (organization.entities.length > 0) {
      await tx.insert(entities).values(
        organization.entities.map((entity) => ({
          confidence: entity.confidence,
          itemId: item.id,
          name: entity.name,
          type: entity.type,
        })),
      );
    }

    return item.id;
  });

  redirect(`/library/${itemId}`);
}

type ResolvedSource = {
  content: string;
  metadata: Record<string, unknown>;
  title: string;
  url: string | null;
};

async function resolveNoteContent(input: { content: string; title: string }) {
  const content = requireValue(input.content, "content");

  return {
    content,
    metadata: {},
    title: normalizeTitle(requireValue(input.title, "title")),
    url: null,
  } satisfies ResolvedSource;
}

async function resolveUrlContent(input: { title: string; url: string }) {
  const url = normalizeUrl(input.url);
  const extracted = await fetchUrlContent(url);
  const title = input.title || extracted.title || new URL(url).hostname;

  return {
    content: extracted.content,
    metadata: {
      contentType: extracted.contentType,
      description: extracted.description,
      fetchedAt: new Date().toISOString(),
    },
    title: normalizeTitle(title),
    url,
  } satisfies ResolvedSource;
}

async function fetchUrlContent(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: "text/html,text/plain;q=0.9",
      "user-agent": "RecallKit/0.1",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch URL. Received ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (
    !contentType.includes("text/html") &&
    !contentType.includes("text/plain")
  ) {
    throw new Error("URL must return HTML or plain text content.");
  }

  const body = await response.text();
  const title = extractTitle(body);
  const description = extractMetaDescription(body);
  const content = contentType.includes("text/html")
    ? extractReadableText(body)
    : body.trim();

  if (!content) {
    throw new Error("No readable text was found at this URL.");
  }

  return {
    content,
    contentType,
    description,
    title,
  };
}

function normalizeUrl(value: string) {
  const url = new URL(requireValue(value, "url"));

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("URL must start with http:// or https://.");
  }

  return url.toString();
}

function normalizeTitle(value: string) {
  return truncateText(value.replace(/\s+/g, " ").trim(), maxItemTitleLength);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function extractTitle(html: string) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]).trim() : "";
}

function extractMetaDescription(html: string) {
  const match = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
  );

  return match ? decodeHtml(match[1]).trim() : null;
}

function extractReadableText(html: string) {
  return decodeHtml(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function chunkText(content: string) {
  const words = content.trim().split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  const size = 220;
  const overlap = 40;

  for (let index = 0; index < words.length; index += size - overlap) {
    chunks.push(words.slice(index, index + size).join(" "));
  }

  return chunks;
}

function requireValue(value: string, field: string) {
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

function mergeTags(manualTags: string[], organizedTags: string[]) {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const tag of [...manualTags, ...organizedTags]) {
    const normalized = tag.trim();
    const key = normalized.toLowerCase();

    if (!normalized || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(normalized);
  }

  return merged;
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
