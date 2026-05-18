import { and, eq, isNotNull, sql } from "drizzle-orm";

import { getDb } from "@/db/client";
import { chunks, items } from "@/db/schema";
import { createChatAnswer, createEmbeddings } from "@/lib/ai";
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
    answer: await composeAnswer(normalizedQuestion, citations),
    citations,
    question: normalizedQuestion,
  };
}

async function composeAnswer(question: string, citations: AskCitation[]) {
  return createChatAnswer({
    instructions: [
      "You answer questions over a personal saved library.",
      "Use only the provided source passages as evidence.",
      "Cite claims with bracketed source numbers like [1] or [2].",
      "If the passages do not contain enough information, say what is missing.",
      "Keep the answer concise and directly useful.",
    ].join(" "),
    input: [
      `Question: ${question}`,
      "",
      "Sources:",
      ...citations.map(formatCitationForPrompt),
    ].join("\n"),
  });
}

function formatCitationForPrompt(citation: AskCitation, index: number) {
  return [
    `[${index + 1}] ${citation.title}`,
    `Type: ${citation.sourceType}`,
    citation.url ? `URL: ${citation.url}` : null,
    `Passage: ${excerpt(citation.content)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= 1_200) {
    return compact;
  }

  return `${compact.slice(0, 1_197).trim()}...`;
}

function toVectorLiteral(embedding: number[]) {
  return JSON.stringify(embedding);
}
