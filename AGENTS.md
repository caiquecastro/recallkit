# Repository Guidelines

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Structure & Module Organization

RecallKit is a Next.js 16 App Router project. Route entry points live in `src/app`, including nested pages such as `src/app/library/[itemId]/page.tsx`, server actions in `src/app/actions.ts`, and global styles in `src/app/globals.css`. Shared logic belongs in `src/lib`; Drizzle code lives in `src/db/schema.ts` and `src/db/client.ts`. Generated migrations are stored in `drizzle/`, one-off scripts in `scripts/`, and static assets in `public/`.

## Build, Test, and Development Commands

- `pnpm dev`: start the local Next.js development server.
- `pnpm build`: create a production build.
- `pnpm start`: serve the production build.
- `pnpm test`: run the unit test suite.
- `pnpm test:unit`: run Vitest once.
- `pnpm test:coverage`: run Vitest with coverage reporting.
- `pnpm test:unit:watch`: run Vitest in watch mode.
- `pnpm lint`: run Biome checks, including lint rules and import organization.
- `pnpm format`: format files with Biome.
- `pnpm db:up` / `pnpm db:down`: start or stop the local Postgres service.
- `pnpm db:reset`: recreate the local Postgres service and volume.
- `pnpm db:migrate`: apply Drizzle migrations.
- `pnpm db:generate`: generate migrations after schema changes.
- `pnpm db:push`: push schema changes directly with Drizzle Kit.
- `pnpm db:studio`: inspect local data in Drizzle Studio.

## Coding Style & Naming Conventions

Write TypeScript and React with 2-space indentation. Follow Biome defaults in `biome.json`; do not hand-format around formatter output. Use PascalCase for React components, camelCase for functions and variables, and kebab-case or bracketed route folders for URL segments. Keep route-specific code near its page, and move reusable database or domain helpers into `src/db` or `src/lib`.

## Testing Guidelines

Unit tests use Vitest. Place tests near the code they cover, using names like `library.test.ts` or `page.test.tsx`. Validate most changes with `pnpm test:unit`, `pnpm lint`, `pnpm build`, and focused manual checks in the affected route.

## Commit & Pull Request Guidelines

Recent commits use short, lower-case imperative subjects, for example `add data foundation` and `add manual note library flow`. Keep commits focused and describe what changed, not how much work it took. Pull requests should include a concise summary, linked issue if relevant, database migration notes, verification steps, and screenshots for UI changes.

## Security & Configuration Tips

Store local secrets in `.env.local`; never commit real credentials. Database configuration reads `DATABASE_URL`. Review generated SQL in `drizzle/` before committing schema changes.
