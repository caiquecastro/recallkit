import Link from "next/link";

export default function NewPage() {
  return (
    <div className="grid max-w-4xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-teal-700">Capture</p>
        <h1 className="font-semibold text-3xl tracking-tight">New item</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Link className="action-card" href="/new/note">
          <span className="text-sm text-zinc-500">Manual capture</span>
          <strong>Write a note</strong>
          <span className="text-sm text-zinc-600">
            Save your own text, thoughts, reminders, or links with context.
          </span>
        </Link>
        <Link className="action-card" href="/new/url">
          <span className="text-sm text-zinc-500">Web ingestion</span>
          <strong>Save a URL</strong>
          <span className="text-sm text-zinc-600">
            Fetch a webpage and store its extracted text for retrieval.
          </span>
        </Link>
      </section>
    </div>
  );
}
