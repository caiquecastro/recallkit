import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chatCreate: vi.fn(),
  embeddingsCreate: vi.fn(),
  env: {
    AI_CHAT_PROVIDER: "openai",
    AI_EMBEDDING_PROVIDER: "openai",
    OPENAI_API_KEY: "openai-key",
    OPENAI_BASE_URL: "https://api.openai.com/v1",
    OPENAI_CHAT_MODEL: "gpt-test",
    OPENAI_EMBEDDING_MODEL: "embedding-test",
    OPENROUTER_API_KEY: "openrouter-key",
    OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
    OPENROUTER_CHAT_MODEL: "openrouter-chat",
    OPENROUTER_EMBEDDING_MODEL: "openrouter-embedding",
    OPENROUTER_SITE_URL: "https://recallkit.test",
    OPENROUTER_APP_NAME: "RecallKit Test",
  },
  OpenAI: vi.fn(),
}));

vi.mock("@/env", () => ({
  env: mocks.env,
}));

vi.mock("openai", () => ({
  default: mocks.OpenAI,
}));

import { createChatAnswer, createEmbeddings, getChatConfig } from "@/lib/ai";

const validEmbedding = Array.from({ length: 1536 }, (_, index) => index);

describe("getChatConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.AI_CHAT_PROVIDER = "openai";
    mocks.env.OPENAI_API_KEY = "openai-key";
  });

  it("returns OpenAI chat config", () => {
    expect(getChatConfig()).toEqual({
      apiKey: "openai-key",
      baseUrl: "https://api.openai.com/v1",
      headers: {},
      model: "gpt-test",
      provider: "openai",
    });
  });

  it("returns OpenRouter chat config when selected", () => {
    mocks.env.AI_CHAT_PROVIDER = "openrouter";

    expect(getChatConfig()).toEqual({
      apiKey: "openrouter-key",
      baseUrl: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://recallkit.test",
        "X-Title": "RecallKit Test",
      },
      model: "openrouter-chat",
      provider: "openrouter",
    });
  });
});

describe("createEmbeddings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.AI_EMBEDDING_PROVIDER = "openai";
    mocks.OpenAI.mockReturnValue({
      embeddings: {
        create: mocks.embeddingsCreate,
      },
    });
  });

  it("returns an empty array without calling OpenAI for empty input", async () => {
    await expect(createEmbeddings([])).resolves.toEqual([]);

    expect(mocks.OpenAI).not.toHaveBeenCalled();
    expect(mocks.embeddingsCreate).not.toHaveBeenCalled();
  });

  it("creates embeddings in response index order", async () => {
    const secondEmbedding = validEmbedding.map((value) => value + 1);
    mocks.embeddingsCreate.mockResolvedValueOnce({
      data: [
        { embedding: secondEmbedding, index: 1 },
        { embedding: validEmbedding, index: 0 },
      ],
    });

    await expect(createEmbeddings(["first", "second"])).resolves.toEqual([
      validEmbedding,
      secondEmbedding,
    ]);

    expect(mocks.embeddingsCreate).toHaveBeenCalledWith(
      {
        input: ["first", "second"],
        model: "embedding-test",
      },
      { timeout: 30_000 },
    );
  });
});

describe("createChatAnswer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.env.AI_CHAT_PROVIDER = "openai";
    mocks.OpenAI.mockReturnValue({
      chat: {
        completions: {
          create: mocks.chatCreate,
        },
      },
    });
  });

  it("returns trimmed chat content", async () => {
    mocks.chatCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "  Answer text.  " } }],
    });

    await expect(
      createChatAnswer({
        input: "Question?",
        instructions: "Answer carefully.",
      }),
    ).resolves.toBe("Answer text.");

    expect(mocks.chatCreate).toHaveBeenCalledWith(
      {
        max_completion_tokens: 900,
        messages: [
          { role: "developer", content: "Answer carefully." },
          { role: "user", content: "Question?" },
        ],
        model: "gpt-test",
        store: false,
      },
      { timeout: 45_000 },
    );
  });
});
