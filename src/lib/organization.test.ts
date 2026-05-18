import { beforeEach, describe, expect, it, vi } from "vitest";

import { createChatAnswer } from "@/lib/ai";
import { organizeLibraryItem } from "@/lib/organization";

vi.mock("@/lib/ai", () => ({
  createChatAnswer: vi.fn(),
}));

const createChatAnswerMock = vi.mocked(createChatAnswer);

describe("organizeLibraryItem", () => {
  beforeEach(() => {
    createChatAnswerMock.mockReset();
  });

  it("normalizes organization metadata returned by the model", async () => {
    createChatAnswerMock.mockResolvedValueOnce(`
      Here is the JSON:
      {
        "title": "  Building RecallKit  ",
        "summary": "  A note about organizing saved knowledge.  ",
        "tags": [" AI Tools ", "#AI Tools", "Personal Knowledge"],
        "collection": "  Knowledge Management  ",
        "entities": [
          { "name": " OpenAI ", "type": "company", "confidence": 0.9 },
          { "name": "OpenAI", "type": "organization", "confidence": 0.8 },
          { "name": "RecallKit", "type": "app", "confidence": 0.7 },
          { "name": "Unknown label", "type": "made up", "confidence": 0.6 }
        ]
      }
    `);

    await expect(
      organizeLibraryItem({
        content: "RecallKit helps capture and organize saved knowledge.",
        sourceType: "note",
        title: "Untitled note",
        url: null,
      }),
    ).resolves.toEqual({
      collection: "Knowledge Management",
      entities: [
        { confidence: 0.9, name: "OpenAI", type: "organization" },
        { confidence: 0.7, name: "RecallKit", type: "product" },
        { confidence: 0.6, name: "Unknown label", type: "other" },
      ],
      summary: "A note about organizing saved knowledge.",
      tags: ["ai-tools", "personal-knowledge"],
      title: "Building RecallKit",
    });
  });

  it("falls back to the input content when the model summary is blank", async () => {
    createChatAnswerMock.mockResolvedValueOnce(
      JSON.stringify({
        title: "",
        summary: "   ",
        tags: [],
        collection: null,
        entities: [],
      }),
    );

    await expect(
      organizeLibraryItem({
        content: "  First line.\n\nSecond line.  ",
        sourceType: "note",
        title: "Original title",
        url: null,
      }),
    ).resolves.toMatchObject({
      summary: "First line. Second line.",
      title: "Original title",
    });
  });
});
