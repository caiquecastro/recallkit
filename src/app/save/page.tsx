import Link from "next/link";

import { createNote } from "@/app/actions";
import { hasDatabaseUrl } from "@/db/client";

export const dynamic = "force-dynamic";

export default function SavePage() {
  if (!hasDatabaseUrl()) {
    return <DatabaseSetup />;
  }

  return (
    <div className="grid max-w-3xl gap-6">
      <div className="grid gap-2">
        <h1 className="font-semibold text-3xl tracking-tight">Save</h1>
      </div>

      <form action={createNote} className="panel grid gap-5">
        <label className="grid gap-2">
          <span className="field-label">Title</span>
          <input
            className="field"
            name="title"
            placeholder="Babolat Pure Aero alternatives"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="field-label">Note</span>
          <textarea
            className="field min-h-64 resize-y"
            name="content"
            placeholder="Paste or write the note here."
            required
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="field-label">Tags</span>
            <input
              className="field"
              name="tags"
              placeholder="tennis, rackets, gear"
            />
          </label>

          <label className="grid gap-2">
            <span className="field-label">Collection</span>
            <input
              className="field"
              name="collection"
              placeholder="Tennis Gear"
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Link className="secondary-button" href="/library">
            Cancel
          </Link>
          <button className="primary-button" type="submit">
            Save note
          </button>
        </div>
      </form>
    </div>
  );
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
