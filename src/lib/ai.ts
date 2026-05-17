import OpenAI from "openai";

import { env } from "@/env";

export type AiProvider = "openai" | "openrouter";

export type AiEndpointConfig = {
  apiKey: string;
  baseUrl: string;
  headers: Record<string, string>;
  model: string;
  provider: AiProvider;
};

export type AiConfig = {
  chat: AiEndpointConfig;
  embeddings: AiEndpointConfig;
};

const embeddingDimensions = 1536;

export function getAiConfig(): AiConfig {
  return {
    chat: getAiEndpointConfig("chat"),
    embeddings: getAiEndpointConfig("embeddings"),
  };
}

export function getChatConfig() {
  return getAiEndpointConfig("chat");
}

export function getEmbeddingConfig() {
  return getAiEndpointConfig("embeddings");
}

export async function createEmbeddings(input: string[]) {
  if (input.length === 0) {
    return [];
  }

  const config = getEmbeddingConfig();
  const client = createOpenAiClient(config);
  const response = await client.embeddings.create(
    {
      input,
      model: config.model,
    },
    {
      timeout: 30_000,
    },
  );
  const embeddings = response.data
    .toSorted((left, right) => left.index - right.index)
    .map((item) => item.embedding);

  if (embeddings.length !== input.length) {
    throw new Error("Embedding response did not match the requested chunks.");
  }

  return embeddings.map(validateEmbedding);
}

function createOpenAiClient(config: AiEndpointConfig) {
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    defaultHeaders: config.headers,
    maxRetries: 2,
  });
}

function getAiEndpointConfig(kind: "chat" | "embeddings"): AiEndpointConfig {
  const provider =
    kind === "chat" ? env.AI_CHAT_PROVIDER : env.AI_EMBEDDING_PROVIDER;

  if (provider === "openrouter") {
    return {
      apiKey: requireProviderEnv("OPENROUTER_API_KEY", env.OPENROUTER_API_KEY),
      baseUrl: env.OPENROUTER_BASE_URL,
      headers: getOpenRouterHeaders(),
      model:
        kind === "chat"
          ? env.OPENROUTER_CHAT_MODEL
          : env.OPENROUTER_EMBEDDING_MODEL,
      provider,
    };
  }

  return {
    apiKey: requireProviderEnv("OPENAI_API_KEY", env.OPENAI_API_KEY),
    baseUrl: env.OPENAI_BASE_URL,
    headers: {},
    model: kind === "chat" ? env.OPENAI_CHAT_MODEL : env.OPENAI_EMBEDDING_MODEL,
    provider,
  };
}

function getOpenRouterHeaders() {
  const headers: Record<string, string> = {};

  if (env.OPENROUTER_SITE_URL) {
    headers["HTTP-Referer"] = env.OPENROUTER_SITE_URL;
  }

  headers["X-Title"] = env.OPENROUTER_APP_NAME;

  return headers;
}

function requireProviderEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}

function validateEmbedding(value: unknown): number[] {
  if (
    !Array.isArray(value) ||
    value.length !== embeddingDimensions ||
    !value.every((entry) => typeof entry === "number")
  ) {
    throw new Error(
      `Embedding response must contain ${embeddingDimensions} numeric dimensions.`,
    );
  }

  return value as number[];
}
