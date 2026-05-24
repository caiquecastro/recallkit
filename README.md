# RecallKit

RecallKit is a personal AI library for saving useful notes and webpages, organizing them with AI-generated metadata, and asking natural-language questions over the saved content with source citations.

The app is built as a Next.js 16 App Router project with Postgres, pgvector, Drizzle ORM, and configurable OpenAI-compatible AI providers.

## Current Features

- Capture manual notes.
- Save URLs that return HTML or plain text.
- Extract readable webpage text with lightweight server-side parsing.
- Generate an improved title, summary, tags, collection, and entities for each saved item.
- Chunk saved content and store 1536-dimension embeddings in pgvector.
- Browse saved items in the library.
- View item details, original content, tags, collections, and source URLs.
- Ask questions over the saved library using vector retrieval and cited source passages.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- Postgres 16 with pgvector
- OpenAI SDK, usable with OpenAI or OpenRouter-compatible endpoints
- Biome for linting and formatting

## Requirements

- Node.js 20 or newer
- pnpm
- Docker, for the local Postgres/pgvector database
- An OpenAI or OpenRouter API key

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the local database:

```bash
pnpm db:up
```

Apply migrations:

```bash
pnpm db:migrate
```

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

`DATABASE_URL` is required. The default local value in `.env.example` matches the Docker Compose database:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/recallkit"
```

RecallKit supports OpenAI by default:

```bash
AI_CHAT_PROVIDER="openai"
AI_EMBEDDING_PROVIDER="openai"
OPENAI_API_KEY="..."
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_CHAT_MODEL="gpt-5.4-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

It can also route chat and embeddings through OpenRouter:

```bash
AI_CHAT_PROVIDER="openrouter"
AI_EMBEDDING_PROVIDER="openrouter"
OPENROUTER_API_KEY="..."
OPENROUTER_BASE_URL="https://openrouter.ai/api/v1"
OPENROUTER_CHAT_MODEL="openai/gpt-5.4-mini"
OPENROUTER_EMBEDDING_MODEL="openai/text-embedding-3-small"
OPENROUTER_APP_NAME="RecallKit"
```

The embedding model must return 1536-dimensional vectors unless the database schema and validation code are changed together.

## Common Commands

```bash
pnpm dev          # Start the local development server
pnpm build        # Create a production build
pnpm start        # Serve the production build
pnpm lint         # Run Biome checks
pnpm format       # Format files with Biome
```

Database commands:

```bash
pnpm db:up        # Start local Postgres with pgvector
pnpm db:down      # Stop local database containers
pnpm db:reset     # Stop containers and remove the database volume
pnpm db:migrate   # Apply generated Drizzle migrations
pnpm db:generate  # Generate migrations from schema changes
pnpm db:push      # Push schema changes directly
pnpm db:studio    # Open Drizzle Studio
```

## Project Structure

```text
src/app/                 App Router routes and server actions
src/app/actions.ts       Capture, ingestion, organization, and delete actions
src/app/ask/             Question-answering route
src/app/library/         Library list and item detail routes
src/app/new/             Note and URL capture routes
src/db/                  Drizzle client and schema
src/lib/ai.ts            AI provider configuration, chat, and embeddings
src/lib/ask.ts           Vector retrieval and cited answer composition
src/lib/library.ts       Library queries
src/lib/organization.ts  AI metadata extraction and normalization
drizzle/                 Generated SQL migrations and metadata
scripts/                 One-off project scripts
public/                  Static assets
```

## Data Model

The main schema lives in `src/db/schema.ts`.

- `users`: local user records. The current app uses a development user helper rather than full auth.
- `items`: saved library objects such as notes and URLs.
- `documents`: normalized text extracted from each item.
- `chunks`: searchable passages with pgvector embeddings.
- `tags` and `item_tags`: reusable labels and item associations.
- `collections` and `collection_items`: broad item groupings.
- `entities`: AI-extracted names such as products, cities, tools, people, and topics.

## Application Flow

1. A user creates a note or saves a URL.
2. The server resolves the source content.
3. The content is chunked.
4. Embeddings are generated for each chunk.
5. AI produces organization metadata: title, summary, tags, collection, and entities.
6. The item, document, chunks, metadata, tags, collections, and entities are saved in a transaction.
7. Questions on `/ask` are embedded, matched against saved chunks by cosine distance, and answered using the nearest source passages.

## Development Notes

- This repository uses Next.js 16. Before changing framework-specific behavior, check the bundled docs in `node_modules/next/dist/docs/` because this version may differ from older Next.js conventions.
- Unit tests use Vitest. Use `pnpm test:unit`, `pnpm lint`, `pnpm build`, and focused manual checks for the affected routes.
- URL ingestion is intentionally lightweight today. It accepts only HTML and plain text responses and strips markup with simple parsing.
- PDF, video, document upload, background jobs, hosted auth, and browser-extension capture are planned but not implemented in the current app.

## Verification

For most changes, run:

```bash
pnpm lint
pnpm test:unit
pnpm build
```

For ingestion or retrieval changes, also perform a manual check:

1. Start the database with `pnpm db:up`.
2. Apply migrations with `pnpm db:migrate`.
3. Start the app with `pnpm dev`.
4. Create a note or URL item.
5. Open `/library` and verify the saved item.
6. Ask a question on `/ask` and verify that the answer includes source citations.
