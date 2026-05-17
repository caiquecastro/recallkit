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

type EmbeddingsResponse = {
  data?: Array<{
    embedding?: unknown;
    index?: number;
  }>;
  error?: {
    message?: string;
  };
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
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    body: JSON.stringify({
      input,
      model: config.model,
    }),
    headers: {
      ...config.headers,
      authorization: `Bearer ${config.apiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(30_000),
  });
  const payload = (await response
    .json()
    .catch(() => ({}))) as EmbeddingsResponse;

  if (!response.ok) {
    throw new Error(
      payload.error?.message ??
        `Unable to create embeddings. Received ${response.status}.`,
    );
  }

  const embeddings = payload.data
    ?.toSorted((left, right) => (left.index ?? 0) - (right.index ?? 0))
    .map((item) => item.embedding);

  if (!embeddings || embeddings.length !== input.length) {
    throw new Error("Embedding response did not match the requested chunks.");
  }

  return embeddings.map(validateEmbedding);
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

function validateEmbedding(value: unknown) {
  if (
    !Array.isArray(value) ||
    value.length !== embeddingDimensions ||
    !value.every((entry) => typeof entry === "number")
  ) {
    throw new Error(
      `Embedding response must contain ${embeddingDimensions} numeric dimensions.`,
    );
  }

  return value;
}
