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
