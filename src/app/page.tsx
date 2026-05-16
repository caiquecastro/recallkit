import Link from "next/link";

export default function Home() {
  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <p className="text-sm font-medium text-teal-700">Personal library</p>
        <h1 className="max-w-3xl font-semibold text-4xl tracking-tight">
          Save notes and URLs now. Retrieval comes next.
        </h1>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link className="action-card" href="/new">
          <span className="text-sm text-zinc-500">Capture</span>
          <strong>New item</strong>
        </Link>
        <Link className="action-card" href="/library">
          <span className="text-sm text-zinc-500">Browse</span>
          <strong>Open library</strong>
        </Link>
        <Link className="action-card" href="/ask">
          <span className="text-sm text-zinc-500">Query</span>
          <strong>Ask</strong>
        </Link>
      </section>
    </div>
  );
}
