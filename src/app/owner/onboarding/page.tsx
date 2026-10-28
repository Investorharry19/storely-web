"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { businessApi, type CreateBusinessInput } from "@/lib/api/business";
import { getSession } from "@/lib/api/client";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";

const initialForm: CreateBusinessInput = {
  name: "",
  type: "PRODUCT",
  category: "",
  description: "",
  phone: "",
  email: "",
  website: "",
  location: "",
};

export default function OwnerOnboardingPage() {
  const router = useRouter();
  const session = getSession();
  const [form, setForm] = useState(initialForm);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (field: keyof CreateBusinessInput, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (
      logo &&
      (!logo.type.startsWith("image/") || logo.size > 5 * 1024 * 1024)
    ) {
      setError("Logo must be an image no larger than 5 MB.");
      return;
    }
    setLoading(true);
    try {
      const input = {
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description?.trim() || undefined,
        phone: form.phone?.trim() || undefined,
        email: form.email?.trim().toLowerCase() || undefined,
        website: form.website?.trim() || undefined,
        location: form.location?.trim() || undefined,
      };
      if (logo) await businessApi.createWithLogo(input, logo);
      else await businessApi.create(input);
      router.push("/owner/manage");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create your store.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow text-[#a04b2b]">Store owner portal</p>
          <h1 className="mt-3 font-serif text-4xl">Sign in first.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Go to sign in
          </Link>
        </div>
      </main>
    );

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="font-serif text-2xl" href="/">
          storely<span className="text-[#a04b2b]">.</span>
        </Link>
        <p className="eyebrow mt-12 text-[#a04b2b]">Store setup</p>
        <h1 className="mt-3 font-serif text-4xl">Create your storefront.</h1>
        <p className="mt-3 text-sm leading-6 text-[#70675d]">
          Tell customers what you sell and where to find you. Your public store
          link will be generated automatically.
        </p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="field-label">
            Store name
            <input
              className="field-input"
              required
              minLength={2}
              maxLength={100}
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
            />
          </label>
          <label className="field-label">
            Store type
            <select
              className="field-input"
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="PRODUCT">Products</option>
              <option value="SERVICE">Services</option>
              <option value="HYBRID">Products and services</option>
            </select>
          </label>
          <label className="field-label">
            Category
            <select
              className="field-input"
              required
              value={form.category}
              onChange={(event) => update("category", event.target.value)}
            >
              <option disabled value="">
                Select a category
              </option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Business logo{" "}
            <span className="font-normal text-[#8c8176]">optional</span>
            <input
              accept="image/*"
              className="field-input"
              type="file"
              onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
            />
            <span className="text-xs font-normal text-[#8c8176]">
              Image files only, up to 5 MB.
            </span>
          </label>
          <label className="field-label">
            Description{" "}
            <span className="font-normal text-[#8c8176]">optional</span>
            <textarea
              className="field-input min-h-24"
              maxLength={500}
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
            />
          </label>
          <label className="field-label">
            Phone <span className="font-normal text-[#8c8176]">optional</span>
            <input
              className="field-input"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          </label>
          <label className="field-label">
            Store email{" "}
            <span className="font-normal text-[#8c8176]">optional</span>
            <input
              className="field-input"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
          </label>
          <label className="field-label">
            Location{" "}
            <span className="font-normal text-[#8c8176]">optional</span>
            <input
              className="field-input"
              placeholder="Lagos, Nigeria"
              value={form.location}
              onChange={(event) => update("location", event.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-[#a04b2b]">{error}</p> : null}
          <button
            className="button-dark w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? "Creating store..." : "Create storefront"}
          </button>
        </form>
      </div>
    </main>
  );
}
