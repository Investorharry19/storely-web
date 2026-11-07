"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { businessApi, type OwnerBusiness } from "@/lib/api/business";
import { getSession } from "@/lib/api/client";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";

type SettingsForm = {
  name: string;
  type: "PRODUCT" | "SERVICE" | "HYBRID";
  category: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  location: string;
};

const toForm = (business: OwnerBusiness): SettingsForm => ({
  name: business.name,
  type: business.type,
  category: business.category,
  description: business.description ?? "",
  phone: business.phone ?? "",
  email: business.email ?? "",
  website: business.website ?? "",
  location: business.location ?? "",
});

export default function OwnerSettingsPage() {
  const session = getSession();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState("");
  const business = useQuery({
    queryKey: ["business", "me"],
    queryFn: businessApi.getMine,
    enabled: Boolean(session),
  });

  const currentForm = form ?? (business.data?.data ? toForm(business.data.data) : null);

  const save = useMutation({
    mutationFn: async () => {
      if (!currentForm) throw new Error("Store settings are not ready.");
      const updated = await businessApi.update({
        ...currentForm,
        name: currentForm.name.trim(),
        category: currentForm.category.trim(),
        description: currentForm.description.trim() || null,
        phone: currentForm.phone.trim() || null,
        email: currentForm.email.trim().toLowerCase() || null,
        website: currentForm.website.trim() || null,
        location: currentForm.location.trim() || null,
      });
      if (logo) await businessApi.updateLogo(logo);
      return updated;
    },
    onSuccess: () => {
      setForm(null);
      setLogo(null);
      setError("");
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["business", "me"] });
    },
    onError: (caught: Error) => setError(caught.message),
  });

  const update = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K],
  ) =>
    setForm((current) => {
      const base = current ?? currentForm;
      return base ? { ...base, [key]: value } : null;
    });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!currentForm) return;
    if (currentForm.name.trim().length < 2)
      return setError("Store name must be at least 2 characters.");
    if (logo && (!logo.type.startsWith("image/") || logo.size > 5 * 1024 * 1024))
      return setError("Logo must be an image no larger than 5 MB.");
    save.mutate();
  };

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-4xl">Sign in to manage your store.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );

  return (
    <main className="owner-shell">
      <div className="mx-auto max-w-6xl">
        <nav className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ded5ca] pb-6">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
              href="/owner/manage"
            >
              Products
            </Link>
            <Link
              className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
              href="/owner/manage/orders"
            >
              Orders
            </Link>
            <Link
              className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
              href="/owner/manage/payments"
            >
              Payments
            </Link>
            <span
              aria-current="page"
              className="text-sm font-semibold text-[#a04b2b]"
            >
              Settings
            </span>
            <span className="text-sm text-[#70675d]">{session.user.fullName}</span>
          </div>
        </nav>
        <header className="py-10">
          <p className="eyebrow text-[#a04b2b]">Owner workspace</p>
          <h1 className="mt-3 font-serif text-5xl">Store settings</h1>
          <p className="mt-3 text-sm text-[#70675d]">
            Keep your storefront details and customer contact information up to date.
          </p>
        </header>
        {business.isPending ? (
          <p className="py-8 text-sm text-[#70675d]">Loading store settings...</p>
        ) : business.isError ? (
          <p className="py-8 text-sm text-[#a04b2b]">{business.error.message}</p>
        ) : currentForm ? (
          <form
            className="grid gap-5 border border-[#d9d0c4] bg-[#fffdf9] p-6 sm:grid-cols-2 sm:p-8"
            onSubmit={submit}
          >
            <label className="field-label">
              Store name
              <input
                className="field-input"
                maxLength={100}
                minLength={2}
                required
                value={currentForm.name}
                onChange={(event) => update("name", event.target.value)}
              />
            </label>
            <label className="field-label">
              Store type
              <select
                className="field-input"
                value={currentForm.type}
                onChange={(event) =>
                  update("type", event.target.value as SettingsForm["type"])
                }
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
                value={currentForm.category}
                onChange={(event) => update("category", event.target.value)}
              >
                {currentForm.category &&
                !BUSINESS_CATEGORIES.includes(
                  currentForm.category as (typeof BUSINESS_CATEGORIES)[number],
                ) ? (
                  <option value={currentForm.category}>{currentForm.category}</option>
                ) : null}
                {BUSINESS_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Store logo
              <input
                accept="image/*"
                className="field-input"
                onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
                type="file"
              />
              <span className="text-xs font-normal text-[#8c8176]">
                {business.data?.data?.logoUrl
                  ? "A store logo is currently set. Choose an image up to 5 MB to replace it."
                  : "No store logo uploaded yet. Choose an image up to 5 MB."}
              </span>
            </label>
            <label className="field-label sm:col-span-2">
              Description
              <textarea
                className="field-input min-h-24"
                maxLength={500}
                value={currentForm.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </label>
            <label className="field-label">
              Store phone
              <input
                className="field-input"
                maxLength={20}
                value={currentForm.phone}
                onChange={(event) => update("phone", event.target.value)}
              />
            </label>
            <label className="field-label">
              Store email
              <input
                className="field-input"
                type="email"
                value={currentForm.email}
                onChange={(event) => update("email", event.target.value)}
              />
            </label>
            <label className="field-label">
              Website
              <input
                className="field-input"
                type="url"
                value={currentForm.website}
                onChange={(event) => update("website", event.target.value)}
              />
            </label>
            <label className="field-label">
              Location
              <input
                className="field-input"
                maxLength={150}
                placeholder="Lagos, Nigeria"
                value={currentForm.location}
                onChange={(event) => update("location", event.target.value)}
              />
            </label>
            {error ? (
              <p className="text-sm text-[#a04b2b] sm:col-span-2">{error}</p>
            ) : null}
            <div className="sm:col-span-2">
              <button className="button-dark" disabled={save.isPending} type="submit">
                {save.isPending ? "Saving settings..." : "Save settings"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
