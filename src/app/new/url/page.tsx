import Link from "next/link";

import { createUrlItem } from "@/app/actions";

export const dynamic = "force-dynamic";

export default function NewUrlPage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-teal-700">Web ingestion</p>
        <h1 className="font-semibold text-3xl tracking-tight">New URL</h1>
      </div>

      <form action={createUrlItem} className="panel grid gap-5">
        <label className="grid gap-2">
          <span className="field-label">URL</span>
          <input
            className="field"
            name="url"
            placeholder="https://example.com/article"
            required
            type="url"
          />
        </label>

        <label className="grid gap-2">
          <span className="field-label">Title</span>
          <input
            className="field"
            name="title"
            placeholder="Optional; fetched from the page when left blank"
          />
        </label>

        <SharedFields />

        <div className="flex items-center justify-between gap-3">
          <Link className="secondary-button" href="/new">
            Cancel
          </Link>
          <button className="primary-button" type="submit">
            Save URL
          </button>
        </div>
      </form>
    </div>
  );
}

function SharedFields() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span className="field-label">Tags</span>
        <input className="field" name="tags" placeholder="docs, research" />
      </label>

      <label className="grid gap-2">
        <span className="field-label">Collection</span>
        <input className="field" name="collection" placeholder="Research" />
      </label>
    </div>
  );
}
