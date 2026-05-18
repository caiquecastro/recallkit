import { ClerkProvider, Show, SignInButton, UserButton } from "@clerk/nextjs";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "RecallKit",
  description: "A personal second brain for travel, tennis, and tech.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-stone-50 text-zinc-950">
        <ClerkProvider dynamic>
          <div className="min-h-screen">
            <header className="border-zinc-200 border-b bg-white">
              <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Link href="/" className="font-semibold text-xl">
                  RecallKit
                </Link>
                <nav className="flex items-center gap-1 text-sm">
                  <Show when="signed-in">
                    <Link className="nav-link" href="/new">
                      New
                    </Link>
                    <Link className="nav-link" href="/library">
                      Library
                    </Link>
                    <Link className="nav-link" href="/ask">
                      Ask
                    </Link>
                    <UserButton />
                  </Show>
                  <Show when="signed-out">
                    <SignInButton mode="modal">
                      <button className="secondary-button" type="button">
                        Sign in
                      </button>
                    </SignInButton>
                  </Show>
                </nav>
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl px-5 py-8">
              {children}
            </main>
          </div>
        </ClerkProvider>
      </body>
    </html>
  );
}
