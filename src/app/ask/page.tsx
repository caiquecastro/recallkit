import Link from "next/link";

import { askLibrary } from "@/lib/ask";

export const dynamic = "force-dynamic";

type AskPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const questionParam = (await searchParams).q;
  const question = Array.isArray(questionParam)
    ? (questionParam[0] ?? "")
    : (questionParam ?? "");
  const state = await askLibrary(question);

  return (
    <div className="grid max-w-4xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-teal-700">Query</p>
        <h1 className="font-semibold text-3xl tracking-tight">Ask</h1>
      </div>

      <form action="/ask" className="panel grid gap-4">
        <label className="grid gap-2">
          <span className="field-label">Question</span>
          <textarea
            className="field min-h-28 resize-y"
            defaultValue={state.question}
            name="q"
            placeholder="What did I save about Babolat Pure Aero alternatives?"
            required
          />
        </label>
        <div className="flex justify-end">
          <button className="primary-button" type="submit">
            Ask library
          </button>
        </div>
      </form>

      {state.status === "idle" ? (
        <section className="panel grid gap-3">
          <h2 className="font-medium text-xl">Ask across your saved content</h2>
          <p className="text-sm text-zinc-600">
            Questions search the chunks created from notes and saved URLs, then
            return the closest source passages.
          </p>
        </section>
      ) : null}

      {state.status === "no-results" ? (
        <section className="panel grid gap-3">
          <h2 className="font-medium text-xl">No matching sources</h2>
          <p className="text-sm text-zinc-600">
            Try a more specific term from a saved note, URL, tag, product, or
            place.
          </p>
        </section>
      ) : null}

      {state.status === "ready" ? (
        <section className="grid gap-4">
          <div className="panel">
            <h2 className="section-title">Answer</h2>
            <p className="mt-4 whitespace-pre-wrap text-zinc-800 leading-7">
              {state.answer}
            </p>
          </div>

          <div className="grid gap-3">
            <h2 className="section-title">Sources</h2>
            {state.citations.map((citation, index) => (
              <article
                className="list-row"
                key={`${citation.itemId}-${citation.chunkIndex}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">[{index + 1}]</span>
                  <span className="badge">{citation.sourceType}</span>
                  <span className="badge">chunk {citation.chunkIndex + 1}</span>
                </div>
                <h3 className="mt-3 font-medium text-lg">
                  <Link
                    className="hover:text-teal-800"
                    href={`/library/${citation.itemId}`}
                  >
                    {citation.title}
                  </Link>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-zinc-600">
                  {citation.content}
                </p>
                {citation.url ? (
                  <a
                    className="mt-3 block break-all text-sm text-teal-700 hover:text-teal-900"
                    href={citation.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {citation.url}
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
