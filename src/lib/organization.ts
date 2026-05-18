import { z } from "zod";

import { createChatAnswer } from "@/lib/ai";

export const organizationEntityTypes = [
  "city",
  "product",
  "framework",
  "person",
  "tool",
  "place",
  "organization",
  "topic",
  "other",
] as const;

export type OrganizationEntityType = (typeof organizationEntityTypes)[number];

export type LibraryItemOrganization = {
  collection: string | null;
  entities: Array<{
    confidence: number;
    name: string;
    type: OrganizationEntityType;
  }>;
  summary: string;
  tags: string[];
  title: string;
};

export type OrganizeLibraryItemInput = {
  content: string;
  sourceType: "note" | "url" | "pdf" | "video" | "document";
  title: string;
  url: string | null;
};

const maxPromptContentLength = 12_000;
const maxTitleLength = 240;
const maxSummaryLength = 500;
const maxTagLength = 80;
const maxCollectionLength = 120;
const maxEntityNameLength = 160;

const organizationSchema = z.object({
  collection: z.string().nullable(),
  entities: z
    .array(
      z.object({
        confidence: z.number().min(0).max(1),
        name: z.string(),
        type: z.enum(organizationEntityTypes),
      }),
    )
    .max(12),
  summary: z.string(),
  tags: z.array(z.string()).max(8),
  title: z.string(),
});

export async function organizeLibraryItem(
  input: OrganizeLibraryItemInput,
): Promise<LibraryItemOrganization> {
  const answer = await createChatAnswer({
    instructions: [
      "You organize saved personal library items for a second-brain app.",
      "Return only valid JSON with these keys: title, summary, tags, collection, entities.",
      "Use concise, specific tags and at most one collection.",
      "Extract only entities directly supported by the content.",
      "Do not wrap the JSON in Markdown.",
    ].join(" "),
    input: formatOrganizationPrompt(input),
  });

  return normalizeOrganization(
    organizationSchema.parse(JSON.parse(extractJsonObject(answer))),
    input,
  );
}

function formatOrganizationPrompt(input: OrganizeLibraryItemInput) {
  return [
    "Organize this saved item.",
    "",
    `Current title: ${input.title}`,
    `Source type: ${input.sourceType}`,
    input.url ? `URL: ${input.url}` : null,
    "",
    "Rules:",
    "- title: improve the title, but keep it factual.",
    "- summary: one or two sentences.",
    "- tags: lowercase short labels, no hash symbols.",
    "- collection: a broad reusable bucket, or null.",
    "- entities: include name, type, and confidence from 0 to 1.",
    "",
    "Content:",
    truncateText(input.content, maxPromptContentLength),
  ]
    .filter(Boolean)
    .join("\n");
}

function normalizeOrganization(
  value: z.infer<typeof organizationSchema>,
  input: OrganizeLibraryItemInput,
): LibraryItemOrganization {
  return {
    collection: normalizeOptionalLabel(value.collection, maxCollectionLength),
    entities: dedupeByNameAndType(value.entities)
      .map((entity) => ({
        confidence: clampConfidence(entity.confidence),
        name: normalizeRequiredLabel(entity.name, maxEntityNameLength),
        type: entity.type,
      }))
      .filter((entity) => entity.name.length > 0),
    summary: truncateText(
      normalizeWhitespace(value.summary) || fallbackSummary(input.content),
      maxSummaryLength,
    ),
    tags: dedupeLabels(value.tags.map((tag) => normalizeTag(tag))).slice(0, 8),
    title: truncateText(
      normalizeWhitespace(value.title) || input.title,
      maxTitleLength,
    ),
  };
}

function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Organization response did not include a JSON object.");
  }

  return value.slice(start, end + 1);
}

function dedupeByNameAndType(
  entities: Array<{
    confidence: number;
    name: string;
    type: OrganizationEntityType;
  }>,
) {
  const seen = new Set<string>();

  return entities.filter((entity) => {
    const key = `${entity.type}:${normalizeWhitespace(entity.name).toLowerCase()}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function dedupeLabels(labels: string[]) {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const label of labels) {
    if (!label || seen.has(label)) {
      continue;
    }

    seen.add(label);
    deduped.push(label);
  }

  return deduped;
}

function normalizeOptionalLabel(value: string | null, maxLength: number) {
  const normalized = value ? normalizeWhitespace(value) : "";

  return normalized ? truncateText(normalized, maxLength) : null;
}

function normalizeRequiredLabel(value: string, maxLength: number) {
  return truncateText(normalizeWhitespace(value), maxLength);
}

function normalizeTag(value: string) {
  return truncateText(
    normalizeWhitespace(value)
      .toLowerCase()
      .replace(/^#+/, "")
      .replace(/\s+/g, "-"),
    maxTagLength,
  );
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function clampConfidence(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function fallbackSummary(content: string) {
  return truncateText(normalizeWhitespace(content), maxSummaryLength);
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}
