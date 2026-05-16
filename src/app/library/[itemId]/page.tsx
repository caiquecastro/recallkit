import Link from "next/link";
import { notFound } from "next/navigation";

import { getItemDetail } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const state = await getItemDetail(itemId);

  if (state.status === "missing-database-url") {
    return <DatabaseSetup />;
  }

  if (state.status === "not-found") {
    notFound();
  }

  const { item } = state;

  return (
    <article className="grid max-w-4xl gap-6">
      <Link
        className="text-sm text-teal-700 hover:text-teal-900"
        href="/library"
      >
        Back to library
      </Link>

      <header className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <span className="badge">{item.sourceType}</span>
          <span className="badge">{item.status}</span>
        </div>
        <h1 className="font-semibold text-3xl tracking-tight">{item.title}</h1>
        <MetaLine
          collections={item.collections}
          date={item.createdAt}
          tags={item.tags}
        />
      </header>

      {item.summary ? (
        <section className="panel">
          <h2 className="section-title">Summary</h2>
          <p className="mt-3 text-zinc-700">{item.summary}</p>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="section-title">Content</h2>
        <div className="mt-4 whitespace-pre-wrap text-zinc-800 leading-7">
          {item.document?.cleanedText ?? item.contentText}
        </div>
      </section>
    </article>
  );
}

function MetaLine({
  collections,
  date,
  tags,
}: {
  collections: string[];
  date: Date;
  tags: string[];
}) {
  const parts = [
    date.toLocaleDateString("en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    ...collections,
    ...tags.map((tag) => `#${tag}`),
  ];

  return <p className="text-sm text-zinc-500">{parts.join(" · ")}</p>;
}

function DatabaseSetup() {
  return (
    <div className="panel max-w-2xl">
      <h1 className="font-semibold text-2xl tracking-tight">
        Database required
      </h1>
      <p className="mt-3 text-sm text-zinc-600">
        Set `DATABASE_URL` in `.env.local`, run `pnpm db:migrate`, then restart
        the dev server.
      </p>
    </div>
  );
}
