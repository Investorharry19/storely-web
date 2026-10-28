"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/client";

export default function OwnerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "", form: "" }));
  };

  const validate = () => {
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const nextErrors: Record<string, string> = {};

    if (!fullName) nextErrors.fullName = "Full name is required.";
    else if (fullName.length < 2)
      nextErrors.fullName = "Full name must be at least 2 characters.";
    else if (fullName.length > 100)
      nextErrors.fullName = "Full name must not exceed 100 characters.";

    if (!email) nextErrors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email))
      nextErrors.email = "Enter a valid email address.";

    if (!password) nextErrors.password = "Password is required.";
    else if (password.length < 8)
      nextErrors.password = "Password must be at least 8 characters.";
    else if (password.length > 72)
      nextErrors.password = "Password must not exceed 72 characters.";
    else if (!/[A-Z]/.test(password))
      nextErrors.password = "Add at least one uppercase letter.";
    else if (!/[a-z]/.test(password))
      nextErrors.password = "Add at least one lowercase letter.";
    else if (!/[0-9]/.test(password))
      nextErrors.password = "Add at least one number.";
    else if (!/[^A-Za-z0-9]/.test(password))
      nextErrors.password = "Add at least one special character.";

    setErrors(nextErrors);
    return { valid: Object.keys(nextErrors).length === 0, fullName, email };
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validate();
    if (!result.valid) return;
    setLoading(true);
    try {
      await authApi.signup({
        ...form,
        fullName: result.fullName,
        email: result.email,
      });
      router.push(`/owner/verify?email=${encodeURIComponent(result.email)}`);
    } catch (caught) {
      setErrors({
        form:
          caught instanceof Error
            ? caught.message
            : "Unable to create your account.",
      });
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
        <p className="eyebrow mt-12 text-[#a04b2b]">Start selling</p>
        <h1 className="mt-3 font-serif text-4xl">Build your storefront.</h1>
        <p className="mt-3 text-sm leading-6 text-[#70675d]">
          Create your owner account first. We will send a verification code
          before you publish.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="field-label">
            Full name
            <input
              aria-describedby="full-name-error"
              aria-invalid={Boolean(errors.fullName)}
              className="field-input"
              onChange={(event) => updateField("fullName", event.target.value)}
              value={form.fullName}
            />
            {errors.fullName ? (
              <span className="field-error" id="full-name-error">
                {errors.fullName}
              </span>
            ) : null}
          </label>
          <label className="field-label">
            Email
            <input
              aria-describedby="email-error"
              aria-invalid={Boolean(errors.email)}
              className="field-input"
              onChange={(event) => updateField("email", event.target.value)}
              type="email"
              value={form.email}
            />
            {errors.email ? (
              <span className="field-error" id="email-error">
                {errors.email}
              </span>
            ) : null}
          </label>
          <label className="field-label">
            Password
            <input
              aria-describedby="password-error password-hint"
              aria-invalid={Boolean(errors.password)}
              className="field-input"
              onChange={(event) => updateField("password", event.target.value)}
              type="password"
              value={form.password}
            />
            <span
              className="text-xs font-normal text-[#8c8176]"
              id="password-hint"
            >
              8–72 characters with uppercase, lowercase, number, and special
              character.
            </span>
            {errors.password ? (
              <span className="field-error" id="password-error">
                {errors.password}
              </span>
            ) : null}
          </label>
          {errors.form ? (
            <p className="text-sm text-[#a04b2b]">{errors.form}</p>
          ) : null}
          <button
            className="button-dark w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating account..." : "Create owner account"}
          </button>
        </form>
        <p className="mt-7 text-sm text-[#70675d]">
          Already have an account?{" "}
          <Link className="font-semibold text-[#a04b2b]" href="/owner/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
