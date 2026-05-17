import { and, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { chunks, items } from "@/db/schema";
import { createEmbeddings } from "@/lib/ai";
import { getDevUserId } from "@/lib/dev-user";

export type AskState =
  | { status: "idle"; question: "" }
  | { status: "no-results"; question: string }
  | {
      status: "ready";
      answer: string;
      citations: AskCitation[];
      question: string;
    };

export type AskCitation = {
  chunkIndex: number;
  content: string;
  itemId: string;
  similarity: number;
  sourceType: string;
  title: string;
  url: string | null;
};

export async function askLibrary(question: string): Promise<AskState> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    return { status: "idle", question: "" };
  }

  const db = getDb();
  const userId = await getDevUserId(db);
  const [questionEmbedding] = await createEmbeddings([normalizedQuestion]);
  const distance = sql<number>`${chunks.embedding} <=> ${toVectorLiteral(questionEmbedding)}::vector`;
  const rows = await db
    .select({
      chunkIndex: chunks.chunkIndex,
      content: chunks.content,
      distance,
      itemId: items.id,
      sourceType: items.sourceType,
      title: items.title,
      url: items.url,
    })
    .from(chunks)
    .innerJoin(items, eq(items.id, chunks.itemId))
    .where(and(eq(items.userId, userId), isNotNull(chunks.embedding)))
    .orderBy(distance)
    .limit(5);

  if (rows.length === 0) {
    return { status: "no-results", question: normalizedQuestion };
  }

  const citations = rows.map(({ distance: citationDistance, ...row }) => ({
    ...row,
    similarity: 1 - citationDistance,
  }));

  return {
    status: "ready",
    answer: composeAnswer(citations),
    citations,
    question: normalizedQuestion,
  };
}

function composeAnswer(citations: AskCitation[]) {
  const lead =
    citations.length === 1
      ? "I found one relevant saved item:"
      : `I found ${citations.length} relevant saved items:`;

  return [
    lead,
    ...citations.map(
      (citation, index) =>
        `[${index + 1}] ${citation.title}: ${excerpt(citation.content)}`,
    ),
  ].join("\n\n");
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= 320) {
    return compact;
  }

  return `${compact.slice(0, 317).trim()}...`;
}

function toVectorLiteral(embedding: number[]) {
  return JSON.stringify(embedding);
}
