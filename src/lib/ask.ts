import { desc, eq } from "drizzle-orm";

import { getDb } from "@/db/client";
import { chunks, items } from "@/db/schema";
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
  sourceType: string;
  title: string;
  url: string | null;
};

const STOP_WORDS = new Set([
  "a",
  "about",
  "and",
  "are",
  "as",
  "at",
  "be",
  "best",
  "did",
  "do",
  "find",
  "for",
  "from",
  "i",
  "in",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "saved",
  "show",
  "summarize",
  "tell",
  "that",
  "the",
  "to",
  "was",
  "were",
  "what",
  "with",
]);

export async function askLibrary(question: string): Promise<AskState> {
  const normalizedQuestion = question.trim();

  if (!normalizedQuestion) {
    return { status: "idle", question: "" };
  }

  const queryTerms = tokenize(normalizedQuestion);

  if (queryTerms.length === 0) {
    return { status: "no-results", question: normalizedQuestion };
  }

  const db = getDb();
  const userId = await getDevUserId(db);
  const rows = await db
    .select({
      chunkIndex: chunks.chunkIndex,
      content: chunks.content,
      itemId: items.id,
      sourceType: items.sourceType,
      title: items.title,
      url: items.url,
    })
    .from(chunks)
    .innerJoin(items, eq(items.id, chunks.itemId))
    .where(eq(items.userId, userId))
    .orderBy(desc(items.createdAt), chunks.chunkIndex)
    .limit(500);

  const ranked = rows
    .map((row) => ({
      ...row,
      score: scoreChunk({
        content: row.content,
        query: normalizedQuestion,
        terms: queryTerms,
        title: row.title,
      }),
    }))
    .filter((row) => row.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  if (ranked.length === 0) {
    return { status: "no-results", question: normalizedQuestion };
  }

  const citations = ranked.map(({ score: _score, ...row }) => row);

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

function scoreChunk({
  content,
  query,
  terms,
  title,
}: {
  content: string;
  query: string;
  terms: string[];
  title: string;
}) {
  const searchableContent = content.toLowerCase();
  const searchableTitle = title.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  let score = searchableContent.includes(normalizedQuery) ? 8 : 0;

  for (const term of terms) {
    score += countMatches(searchableContent, term);

    if (searchableTitle.includes(term)) {
      score += 3;
    }
  }

  return score;
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      value
        .toLowerCase()
        .match(/[a-z0-9]+/g)
        ?.filter((term) => term.length > 1 && !STOP_WORDS.has(term)) ?? [],
    ),
  );
}

function countMatches(value: string, term: string) {
  let count = 0;
  let index = value.indexOf(term);

  while (index !== -1) {
    count += 1;
    index = value.indexOf(term, index + term.length);
  }

  return count;
}

function excerpt(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= 320) {
    return compact;
  }

  return `${compact.slice(0, 317).trim()}...`;
}
