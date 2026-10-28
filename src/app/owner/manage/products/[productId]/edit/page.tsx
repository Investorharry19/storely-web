"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { businessApi } from "@/lib/api/business";
import {
  catalogApi,
  getCatalogImage,
  type OwnerProduct,
  type ProductImageOrder,
} from "@/lib/api/catalog";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";
import { ApiError, getSession } from "@/lib/api/client";

type EditorImage =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; preview: string };

const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function EditProductPage() {
  const params = useParams<{ productId: string }>();
  const router = useRouter();
  const session = getSession();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [product, setProduct] = useState<OwnerProduct | null>(null);
  const [images, setImages] = useState<EditorImage[]>([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: 0,
    stockQuantity: 0,
    description: "",
    isAvailable: true,
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  const business = useQuery({
    queryKey: ["business", "me"],
    queryFn: businessApi.getMine,
    enabled: Boolean(session),
  });
  const productQuery = useQuery({
    queryKey: ["catalog", "product", params.productId],
    queryFn: () => catalogApi.getProduct(params.productId),
    enabled: Boolean(session && params.productId),
  });

  useEffect(() => {
    const current = productQuery.data?.data;
    if (!current || product?.id === current.id) return;
    queueMicrotask(() => {
      setProduct(current);
      setForm({
        name: current.name,
        category: current.category ?? "",
        price: Number(current.price),
        stockQuantity: current.stockQuantity,
        description: current.description ?? "",
        isAvailable: current.isAvailable,
      });
      setImages(
        current.imageUrls
          .map((image) => ({
            kind: "existing" as const,
            url: getCatalogImage(image) ?? "",
          }))
          .filter((image) => image.url),
      );
    });
  }, [productQuery.data, product]);

  useEffect(
    () => () =>
      images.forEach((image) => {
        if (image.kind === "new") URL.revokeObjectURL(image.preview);
      }),
    [images],
  );

  const categoryOptions =
    form.category &&
    !BUSINESS_CATEGORIES.includes(
      form.category as (typeof BUSINESS_CATEGORIES)[number],
    )
      ? [form.category, ...BUSINESS_CATEGORIES]
      : BUSINESS_CATEGORIES;
  const addImages = (files: File[]) => {
    const available = 5 - images.length;
    if (files.length > available)
      setError(
        `You can add ${available} more image${available === 1 ? "" : "s"}.`,
      );
    const valid = files
      .filter(
        (file) =>
          file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
      )
      .slice(0, available);
    setImages((current) => [
      ...current,
      ...valid.map((file) => ({
        kind: "new" as const,
        file,
        preview: URL.createObjectURL(file),
      })),
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

  const save = useMutation({
    mutationFn: () => {
      const imageOrder: ProductImageOrder[] = images.map((image, index) =>
        image.kind === "existing"
          ? { type: "existing", url: image.url }
          : {
              type: "new",
              index:
                images
                  .slice(0, index + 1)
                  .filter((entry) => entry.kind === "new").length - 1,
            },
      );
      const files = images
        .filter(
          (image): image is Extract<EditorImage, { kind: "new" }> =>
            image.kind === "new",
        )
        .map((image) => image.file);
      return catalogApi.updateProduct(params.productId, {
        ...form,
        imageOrder,
        images: files,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
      queryClient.invalidateQueries({
        queryKey: ["catalog", "product", params.productId],
      });
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
    if (images.length === 0)
      return setError("Keep at least one product image.");
    save.mutate();
  };

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow text-[#a04b2b]">Store owner portal</p>
          <h1 className="mt-3 font-serif text-4xl">
            Sign in to edit products.
          </h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in
          </Link>
        </div>
      </main>
    );
  if (business.isPending || productQuery.isPending)
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
  if (productQuery.isError || !product)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="font-serif text-3xl">Product not found.</h1>
          <Link className="button-dark mt-7" href="/owner/manage">
            Back to products
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
          <p className="eyebrow text-[#a04b2b]">Product editor</p>
          <h1 className="mt-3 font-serif text-5xl">Edit {product.name}</h1>
          <p className="mt-3 text-sm text-[#70675d]">
            Update the product details, image gallery, and storefront
            visibility.
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
                  {categoryOptions.map((category) => (
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
            <p className="mt-3 text-xs leading-5 text-[#8c8176]">
              Drag images to reorder. The first image is your storefront cover.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div
                  className={`image-preview-card ${draggedIndex === index ? "image-preview-card-dragging" : ""}`}
                  draggable
                  key={
                    image.kind === "existing"
                      ? image.url
                      : `${image.file.name}-${image.file.lastModified}`
                  }
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (draggedIndex !== null) moveImage(draggedIndex, index);
                    setDraggedIndex(null);
                  }}
                  onDragEnd={() => setDraggedIndex(null)}
                >
                  <img
                    alt={`Product image ${index + 1}`}
                    src={image.kind === "existing" ? image.url : image.preview}
                  />
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
              disabled={save.isPending}
              type="submit"
            >
              {save.isPending
                ? "Saving changes..."
                : `Save product · ${money(form.price)}`}
            </button>
          </section>
        </form>
      </div>
    </main>
  );
}
