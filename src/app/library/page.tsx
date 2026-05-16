import Link from "next/link";

import { getLibraryItems } from "@/lib/library";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const state = await getLibraryItems();

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-semibold text-3xl tracking-tight">Library</h1>
        <Link className="primary-button" href="/save">
          Save note
        </Link>
      </div>

      {state.items.length === 0 ? (
        <div className="panel grid gap-3">
          <h2 className="font-medium text-xl">No saved items</h2>
          <Link className="secondary-button w-fit" href="/save">
            Add the first note
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {state.items.map((item) => (
            <Link
              className="list-row"
              href={`/library/${item.id}`}
              key={item.id}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-medium text-lg">{item.title}</h2>
                  <span className="badge">{item.sourceType}</span>
                  <span className="badge">{item.status}</span>
                </div>
                {item.summary ? (
                  <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                    {item.summary}
                  </p>
                ) : null}
                <MetaLine
                  collections={item.collections}
                  date={item.createdAt}
                  tags={item.tags}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
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

  return <p className="mt-3 text-sm text-zinc-500">{parts.join(" · ")}</p>;
}
