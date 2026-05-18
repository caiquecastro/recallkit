import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
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

      <Show when="signed-in">
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
      </Show>

      <Show when="signed-out">
        <section className="panel flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-medium text-xl">Start your private library</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Sign in to save notes, URLs, and ask questions over your own
              content.
            </p>
          </div>
          <div className="flex gap-2">
            <SignInButton mode="modal">
              <button className="secondary-button" type="button">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="primary-button" type="button">
                Sign up
              </button>
            </SignUpButton>
          </div>
        </section>
      </Show>
    </div>
  );
}
