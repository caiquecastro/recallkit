import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AI_CHAT_PROVIDER: z.enum(["openai", "openrouter"]).default("openai"),
    AI_EMBEDDING_PROVIDER: z.enum(["openai", "openrouter"]).default("openai"),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
    OPENAI_CHAT_MODEL: z.string().min(1).default("gpt-5.4-mini"),
    OPENAI_EMBEDDING_MODEL: z.string().min(1).default("text-embedding-3-small"),
    OPENROUTER_API_KEY: z.string().min(1).optional(),
    OPENROUTER_BASE_URL: z
      .string()
      .url()
      .default("https://openrouter.ai/api/v1"),
    OPENROUTER_CHAT_MODEL: z.string().min(1).default("openai/gpt-5.4-mini"),
    OPENROUTER_EMBEDDING_MODEL: z
      .string()
      .min(1)
      .default("openai/text-embedding-3-small"),
    OPENROUTER_SITE_URL: z.string().url().optional(),
    OPENROUTER_APP_NAME: z.string().min(1).default("RecallKit"),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    AI_CHAT_PROVIDER: process.env.AI_CHAT_PROVIDER,
    AI_EMBEDDING_PROVIDER: process.env.AI_EMBEDDING_PROVIDER,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_CHAT_MODEL: process.env.OPENAI_CHAT_MODEL,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    OPENROUTER_CHAT_MODEL: process.env.OPENROUTER_CHAT_MODEL,
    OPENROUTER_EMBEDDING_MODEL: process.env.OPENROUTER_EMBEDDING_MODEL,
    OPENROUTER_SITE_URL: process.env.OPENROUTER_SITE_URL,
    OPENROUTER_APP_NAME: process.env.OPENROUTER_APP_NAME,
  },
  emptyStringAsUndefined: true,
});
