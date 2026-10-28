"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { businessApi } from "@/lib/api/business";
import { catalogApi } from "@/lib/api/catalog";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { ApiError, getSession } from "@/lib/api/client";

type NewImage = { file: File; preview: string };

export default function NewProductPage() {
  const router = useRouter();
  const session = getSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<NewImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: 0,
    stockQuantity: 0,
    description: "",
    isAvailable: true,
  });
  const [error, setError] = useState("");
  const business = useQuery({
    queryKey: ["business", "me"],
    queryFn: businessApi.getMine,
    enabled: Boolean(session),
  });

  useEffect(
    () => () => images.forEach((image) => URL.revokeObjectURL(image.preview)),
    [images],
  );

  const addImages = (files: File[]) => {
    const available = 5 - images.length;
    const valid = files
      .filter(
        (file) =>
          file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
      )
      .slice(0, available);
    if (files.length > available)
      setError(
        `You can add ${available} more image${available === 1 ? "" : "s"}.`,
      );
    else if (valid.length !== files.length)
      setError("Only image files up to 5 MB are allowed.");
    setImages((current) => [
      ...current,
      ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeImage = (index: number) =>
    setImages((current) =>
      current.filter((_, itemIndex) => itemIndex !== index),
    );
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    setImages((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };
  const create = useMutation({
    mutationFn: () =>
      catalogApi.createProduct({
        ...form,
        name: form.name.trim(),
        images: images.map((image) => image.file),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
      router.push("/owner/manage");
    },
    onError: (caught: Error) => setError(caught.message),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (form.name.trim().length < 2)
      return setError("Product name must be at least 2 characters.");
    if (!form.category) return setError("Select a category.");
    if (!images.length) return setError("Upload at least one product image.");
    create.mutate();
  };

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow text-[#a04b2b]">Store owner portal</p>
          <h1 className="mt-3 font-serif text-4xl">Sign in to add products.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );
  if (business.isPending)
    return (
      <main className="auth-shell">
        <p className="text-sm text-[#70675d]">Loading product editor...</p>
      </main>
    );
  if (business.error instanceof ApiError && business.error.status === 404)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-3xl">Set up your store first.</h1>
          <Link className="button-dark mt-7" href="/owner/onboarding">
            Set up store
          </Link>
        </div>
      </main>
    );

  return (
    <main className="owner-shell">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between border-b border-[#ded5ca] pb-6">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <Link
            className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
            href="/owner/manage"
          >
            Back to products
          </Link>
        </nav>
        <header className="py-10">
          <p className="eyebrow text-[#a04b2b]">New product</p>
          <h1 className="mt-3 font-serif text-5xl">Add something new.</h1>
          <p className="mt-3 text-sm text-[#70675d]">
            Create the product customers will see in your storefront.
          </p>
        </header>
        <form
          className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]"
          onSubmit={submit}
        >
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-6 sm:p-8">
            <p className="eyebrow text-[#70675d]">Product details</p>
            <div className="mt-6 grid gap-5">
              <label className="field-label">
                Product name
                <input
                  className="field-input"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                />
              </label>
              <label className="field-label">
                Category
                <select
                  className="field-input"
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
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
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="field-label">
                  Price
                  <input
                    className="field-input"
                    min="0"
                    required
                    step="0.01"
                    type="number"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: Number(event.target.value) })
                    }
                  />
                </label>
                <label className="field-label">
                  Stock quantity
                  <input
                    className="field-input"
                    min="0"
                    required
                    type="number"
                    value={form.stockQuantity}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        stockQuantity: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <label className="field-label">
                Description
                <textarea
                  className="field-input min-h-32"
                  maxLength={1000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input
                  checked={form.isAvailable}
                  onChange={(event) =>
                    setForm({ ...form, isAvailable: event.target.checked })
                  }
                  type="checkbox"
                />{" "}
                Visible in storefront
              </label>
            </div>
          </section>
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-6 sm:p-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="eyebrow text-[#70675d]">Image gallery</p>
                <h2 className="mt-2 font-serif text-3xl">
                  {images.length}/5 images
                </h2>
              </div>
              <button
                className="text-sm font-semibold text-[#a04b2b] hover:underline"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Add images
              </button>
            </div>
            <input
              ref={fileInputRef}
              accept="image/*"
              className="sr-only"
              multiple
              onChange={(event) =>
                addImages(Array.from(event.target.files ?? []))
              }
              type="file"
            />
            <div
              className="image-upload-zone mt-6"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                addImages(Array.from(event.dataTransfer.files));
              }}
              role="button"
              tabIndex={0}
            >
              <span className="image-upload-icon">+</span>
              <span className="font-semibold">
                Choose images or drop them here
              </span>
              <span className="text-xs text-[#8c8176]">
                PNG, JPG, WEBP up to 5 MB each
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#8c8176]">
              Drag images to reorder. The first image becomes the storefront
              cover.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div
                  className={`image-preview-card ${draggedIndex === index ? "image-preview-card-dragging" : ""}`}
                  draggable
                  key={`${image.file.name}-${image.file.lastModified}`}
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedIndex !== null) moveImage(draggedIndex, index);
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <img alt={`Product image ${index + 1}`} src={image.preview} />
                  <span className="image-preview-order">{index + 1}</span>
                  <button
                    className="image-preview-remove"
                    onClick={() => removeImage(index)}
                    type="button"
                  >
                    ×
                  </button>
                  <div className="image-preview-actions">
                    <button
                      disabled={index === 0}
                      onClick={() => moveImage(index, index - 1)}
                      type="button"
                    >
                      ←
                    </button>
                    <button
                      disabled={index === images.length - 1}
                      onClick={() => moveImage(index, index + 1)}
                      type="button"
                    >
                      →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {error ? (
              <p className="mt-6 text-sm text-[#a04b2b]">{error}</p>
            ) : null}
            <button
              className="button-dark mt-8 w-full"
              disabled={create.isPending}
              type="submit"
            >
              {create.isPending ? "Creating product..." : "Create product"}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}
