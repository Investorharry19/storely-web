"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const openStore = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanSlug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    if (cleanSlug) router.push(`/store/${encodeURIComponent(cleanSlug)}`);
  };

  return (
    <main className="min-h-screen bg-[#f4f1eb] px-6 py-8 text-[#24201c] sm:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <nav className="flex items-center justify-between">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden text-[#70675d] sm:inline">
              A better way to shop small
            </span>
            <Link
              className="font-semibold text-[#a04b2b] hover:underline"
              href="/owner/login"
            >
              Sell on Storely
            </Link>
          </div>
        </nav>
        <section className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-[1fr_.8fr]">
          <div>
            <p className="eyebrow text-[#a04b2b]">
              Independent commerce, beautifully simple
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-6xl leading-[.94] tracking-tight sm:text-8xl">
              Find something worth keeping.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#70675d]">
              Storely connects you with independent sellers and the things they
              make, source, and stand behind.
            </p>
          </div>
          <div className="border border-[#d9d0c4] bg-[#fffdf9] p-7 shadow-[10px_10px_0_#ded5c8] sm:p-10">
            <p className="eyebrow text-[#70675d]">Enter a store handle</p>
            <h2 className="mt-3 font-serif text-3xl">
              Go straight to a seller.
            </h2>
            <form className="mt-8" onSubmit={openStore}>
              <label className="text-sm font-semibold" htmlFor="store-slug">
                Store handle
              </label>
              <div className="mt-2 flex border-b-2 border-[#24201c]">
                <span className="py-3 text-[#a04b2b]">storely/</span>
                <input
                  className="min-w-0 flex-1 bg-transparent px-1 py-3 outline-none"
                  id="store-slug"
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="your-store"
                  value={slug}
                />
              </div>
              <button className="button-dark mt-7 w-full" type="submit">
                Visit store
              </button>
            </form>
            <p className="mt-5 text-xs leading-5 text-[#8c8176]">
              Use the shareable Storely link from your favorite seller.
            </p>
          </div>
        </section>
        <section className="grid gap-4 border-t border-[#ded5ca] py-8 sm:grid-cols-3">
          <div>
            <p className="eyebrow text-[#70675d]">For store owners</p>
            <h2 className="mt-2 font-serif text-2xl">Your shop, your way.</h2>
          </div>
          <Link
            className="border border-[#d9d0c4] bg-[#fffdf9] p-5 transition hover:-translate-y-1 hover:border-[#a04b2b]"
            href="/owner/register"
          >
            <span className="text-xs font-bold uppercase tracking-[.12em] text-[#a04b2b]">
              New to Storely
            </span>
            <p className="mt-2 font-semibold">Create a store owner account</p>
            <p className="mt-1 text-sm text-[#70675d]">
              Start your seller profile and publish your storefront.
            </p>
          </Link>
          <Link
            className="border border-[#d9d0c4] bg-[#fffdf9] p-5 transition hover:-translate-y-1 hover:border-[#a04b2b]"
            href="/owner/manage"
          >
            <span className="text-xs font-bold uppercase tracking-[.12em] text-[#a04b2b]">
              Already selling?
            </span>
            <p className="mt-2 font-semibold">Manage your store</p>
            <p className="mt-1 text-sm text-[#70675d]">
              Sign in to update your business, catalog, and shop link.
            </p>
          </Link>
        </section>
        <footer className="border-t border-[#ded5ca] py-6 text-sm text-[#70675d]">
          Shop independent. Keep it personal.
        </footer>
      </div>
    </main>
  );
}
