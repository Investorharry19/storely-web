"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/client";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim().toLowerCase();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.verifyOtp({ email, code, purpose: "SIGNUP" });
      router.push("/owner/manage");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "That code is invalid or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError("");
    setNotice("");
    try {
      const result = await authApi.resendOtp(email);
      setNotice(result.message || "A new verification code has been sent.");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to resend the code.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="font-serif text-2xl" href="/">
          storely<span className="text-[#a04b2b]">.</span>
        </Link>
        <p className="eyebrow mt-12 text-[#a04b2b]">
          Verify your email address
        </p>
        <h1 className="mt-3 font-serif text-4xl">Almost there.</h1>
        <p className="mt-3 text-sm leading-6 text-[#70675d]">
          Enter the 6-digit code sent to{" "}
          <strong>{email || "your email address"}</strong> to activate your
          Storely account.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="field-label">
            Your code
            <input
              autoComplete="one-time-code"
              className="field-input text-center text-2xl tracking-[.45em]"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setError("");
              }}
              pattern="[0-9]{6}"
              required
              value={code}
            />
          </label>
          <p className="text-xs leading-5 text-[#8c8176]">
            This code expires in 10 minutes and can only be used once. Never
            share it with anyone.
          </p>
          {error ? <p className="text-sm text-[#a04b2b]">{error}</p> : null}
          {notice ? <p className="text-sm text-[#3b7551]">{notice}</p> : null}
          <button
            className="button-dark w-full"
            disabled={loading || !email}
            type="submit"
          >
            {loading ? "Verifying..." : "Verify email"}
          </button>
        </form>
        <button
          className="mt-6 w-full text-sm font-semibold text-[#a04b2b] hover:underline"
          disabled={resending || !email}
          onClick={resend}
          type="button"
        >
          {resending ? "Sending..." : "Resend code"}
        </button>
        <p className="mt-6 text-center text-sm text-[#70675d]">
          <Link className="font-semibold text-[#a04b2b]" href="/owner/register">
            Back to registration
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function OwnerVerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="auth-shell">
          <p className="text-sm text-[#70675d]">Loading verification...</p>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
