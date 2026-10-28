"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.login({ email, password });
      router.push("/owner/manage");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="font-serif text-2xl" href="/">
          storely<span className="text-[#a04b2b]">.</span>
        </Link>
        <p className="eyebrow mt-12 text-[#a04b2b]">Store owner portal</p>
        <h1 className="mt-3 font-serif text-4xl">Welcome back.</h1>
        <p className="mt-3 text-sm leading-6 text-[#70675d]">
          Sign in to manage your store and keep your storefront current.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="field-label">
            Email
            <input
              className="field-input"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="field-label">
            Password
            <input
              className="field-input"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="text-sm text-[#a04b2b]">{error}</p> : null}
          <button
            className="button-dark w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-7 text-sm text-[#70675d]">
          New store owner?{" "}
          <Link className="font-semibold text-[#a04b2b]" href="/owner/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
