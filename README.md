This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Database

RecallKit uses Postgres with pgvector and Drizzle ORM.

Start the local database:

```bash
pnpm db:up
```

Create an environment file:

```bash
cp .env.example .env.local
```

The default local connection string is already set in `.env.example`. Apply
the database migrations:

```bash
pnpm db:migrate
```

Then run the app:

```bash
pnpm dev
```

Useful commands:

```bash
pnpm db:generate
pnpm db:push
pnpm db:studio
pnpm db:down
pnpm db:reset
```

## AI Providers

RecallKit reads AI settings from server-side environment variables. Use OpenAI
by default:

```bash
AI_CHAT_PROVIDER="openai"
AI_EMBEDDING_PROVIDER="openai"
OPENAI_API_KEY="..."
```

To route chat and embeddings through OpenRouter instead:

```bash
AI_CHAT_PROVIDER="openrouter"
AI_EMBEDDING_PROVIDER="openrouter"
OPENROUTER_API_KEY="..."
```

The model IDs are configurable in `.env.local`; see `.env.example` for the
default OpenAI and OpenRouter model names.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
