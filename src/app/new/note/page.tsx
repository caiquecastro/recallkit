import Link from "next/link";

import { createNote } from "@/app/actions";
import { CaptureMetadataFields } from "@/app/new/capture-metadata-fields";

export const dynamic = "force-dynamic";

export default function NewNotePage() {
  return (
    <div className="grid max-w-3xl gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-medium text-teal-700">Manual capture</p>
        <h1 className="font-semibold text-3xl tracking-tight">New note</h1>
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

        <CaptureMetadataFields
          collectionPlaceholder="Tennis Gear"
          tagsPlaceholder="tennis, rackets"
        />

        <div className="flex items-center justify-between gap-3">
          <Link className="secondary-button" href="/new">
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
