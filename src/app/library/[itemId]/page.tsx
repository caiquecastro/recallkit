import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteLibraryItem } from "@/app/actions";
import { MetaLine } from "@/app/library/meta-line";
import { getItemDetail } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const state = await getItemDetail(itemId);

  if (state.status === "not-found") {
    notFound();
  }

  const { item } = state;

  return (
    <article className="grid max-w-4xl min-w-0 gap-6">
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
        <h1 className="wrap-anywhere font-semibold text-3xl tracking-tight">
          {item.title}
        </h1>
        <MetaLine
          collections={item.collections}
          date={item.createdAt}
          tags={item.tags}
        />
        {item.url ? (
          <a
            className="break-all text-sm text-teal-700 hover:text-teal-900"
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            {item.url}
          </a>
        ) : null}
      </header>

      {item.summary ? (
        <section className="panel">
          <h2 className="section-title">Summary</h2>
          <p className="wrap-anywhere mt-3 text-zinc-700">{item.summary}</p>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="section-title">Content</h2>
        <div className="wrap-anywhere mt-4 whitespace-pre-wrap text-zinc-800 leading-7">
          {item.document?.cleanedText ?? item.contentText}
        </div>
      </section>

      <section className="panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Danger zone</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Delete this item and its indexed chunks from your library.
          </p>
        </div>
        <form action={deleteLibraryItem}>
          <input name="itemId" type="hidden" value={item.id} />
          <button className="destructive-button" type="submit">
            Delete item
          </button>
        </form>
      </section>
    </article>
  );
}
