"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api/client";

export default function OwnerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim().toLowerCase());
      setCodeSent(true);
      setNotice(
        result.message ??
          "If this email is registered, a password reset code has been sent.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to request a password reset code.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const result = await authApi.resetPassword({
        email: email.trim().toLowerCase(),
        code,
        newPassword: password,
      });
      setNotice(result.message ?? "Password reset successful. Please sign in.");
      setCodeSent(false);
      setCode("");
      setPassword("");
      setConfirmPassword("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reset your password.",
      );
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
        <p className="eyebrow mt-12 text-[#a04b2b]">Account recovery</p>
        <h1 className="mt-3 font-serif text-4xl">Forgot your password?</h1>
        <p className="mt-3 text-sm leading-6 text-[#70675d]">
          {codeSent
            ? `Enter the reset code sent to ${email}, then choose a new password.`
            : "Enter your account email and we’ll send you a code to reset your password."}
        </p>
        {codeSent ? (
          <form className="mt-8 space-y-5" onSubmit={resetPassword}>
            <label className="field-label">
              Reset code
              <input
                autoComplete="one-time-code"
                className="field-input text-center text-2xl tracking-[.45em]"
                inputMode="numeric"
                maxLength={6}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                pattern="[0-9]{6}"
                required
                value={code}
              />
            </label>
            <label className="field-label">
              New password
              <input
                autoComplete="new-password"
                className="field-input"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
              <span className="text-xs font-normal text-[#8c8176]">
                Use at least 8 characters, including uppercase, lowercase,
                number, and special character.
              </span>
            </label>
            <label className="field-label">
              Confirm new password
              <input
                autoComplete="new-password"
                className="field-input"
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
            {error ? <p className="text-sm text-[#a04b2b]">{error}</p> : null}
            {notice ? <p className="text-sm text-[#3b7551]">{notice}</p> : null}
            <button
              className="button-dark w-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Resetting password..." : "Reset password"}
            </button>
            <button
              className="w-full text-sm font-semibold text-[#a04b2b] hover:underline"
              disabled={loading}
              onClick={() => requestCode()}
              type="button"
            >
              Resend code
            </button>
          </form>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={requestCode}>
            <label className="field-label">
              Email
              <input
                autoComplete="email"
                className="field-input"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </label>
            {error ? <p className="text-sm text-[#a04b2b]">{error}</p> : null}
            {notice ? <p className="text-sm text-[#3b7551]">{notice}</p> : null}
            <button
              className="button-dark w-full"
              disabled={loading}
              type="submit"
            >
              {loading ? "Sending code..." : "Send reset code"}
            </button>
          </form>
        )}
        <p className="mt-7 text-center text-sm text-[#70675d]">
          <Link
            className="font-semibold text-[#a04b2b] hover:underline"
            href="/owner/login"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
