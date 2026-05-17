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

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_OPENAI_CHAT_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";
const DEFAULT_OPENROUTER_CHAT_MODEL = "openai/gpt-5.4-mini";
const DEFAULT_OPENROUTER_EMBEDDING_MODEL = "openai/text-embedding-3-small";

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
  const provider = resolveProvider(
    readEnv(kind === "chat" ? "AI_CHAT_PROVIDER" : "AI_EMBEDDING_PROVIDER"),
  );

  if (provider === "openrouter") {
    return {
      apiKey: requireEnv("OPENROUTER_API_KEY"),
      baseUrl: readEnv("OPENROUTER_BASE_URL") ?? DEFAULT_OPENROUTER_BASE_URL,
      headers: getOpenRouterHeaders(),
      model:
        readEnv(
          kind === "chat"
            ? "OPENROUTER_CHAT_MODEL"
            : "OPENROUTER_EMBEDDING_MODEL",
        ) ??
        (kind === "chat"
          ? DEFAULT_OPENROUTER_CHAT_MODEL
          : DEFAULT_OPENROUTER_EMBEDDING_MODEL),
      provider,
    };
  }

  return {
    apiKey: requireEnv("OPENAI_API_KEY"),
    baseUrl: readEnv("OPENAI_BASE_URL") ?? DEFAULT_OPENAI_BASE_URL,
    headers: {},
    model:
      readEnv(
        kind === "chat" ? "OPENAI_CHAT_MODEL" : "OPENAI_EMBEDDING_MODEL",
      ) ??
      (kind === "chat"
        ? DEFAULT_OPENAI_CHAT_MODEL
        : DEFAULT_OPENAI_EMBEDDING_MODEL),
    provider,
  };
}

function getOpenRouterHeaders() {
  const headers: Record<string, string> = {};
  const siteUrl = readEnv("OPENROUTER_SITE_URL");

  if (siteUrl) {
    headers["HTTP-Referer"] = siteUrl;
  }

  headers["X-Title"] = readEnv("OPENROUTER_APP_NAME") ?? "RecallKit";

  return headers;
}

function resolveProvider(value: string | undefined): AiProvider {
  if (!value) {
    return "openai";
  }

  if (value === "openai" || value === "openrouter") {
    return value;
  }

  throw new Error(
    `Unsupported AI provider "${value}". Use "openai" or "openrouter".`,
  );
}

function requireEnv(name: string) {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}

function readEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}
