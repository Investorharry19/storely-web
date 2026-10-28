"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { businessApi } from "@/lib/api/business";
import {
  catalogApi,
  getCatalogImage,
  type OwnerProduct,
  type ProductInput,
} from "@/lib/api/catalog";
import { ApiError, getSession } from "@/lib/api/client";
import { BUSINESS_CATEGORIES } from "@/lib/business-categories";

const emptyProduct: ProductInput = {
  name: "",
  description: "",
  price: 0,
  category: "",
  stockQuantity: 0,
  isAvailable: true,
  imageUrls: [""],
};
const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function ManageStorePage() {
  const session = useSyncExternalStore(
    () => () => undefined,
    getSession,
    () => null,
  );
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductInput>(emptyProduct);
  const [images, setImages] = useState<File[]>([]);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(
    null,
  );
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<OwnerProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const business = useQuery({
    queryKey: ["business", "me"],
    queryFn: businessApi.getMine,
    enabled: Boolean(session),
  });
  const products = useQuery({
    queryKey: ["catalog", "products"],
    queryFn: catalogApi.getProducts,
    enabled: Boolean(session && business.data?.data),
  });
  const save = useMutation({
    mutationFn: (input: { form: ProductInput; images: File[] }) =>
      editing
        ? catalogApi.updateProduct(editing.id, input.form)
        : catalogApi.createProduct({ ...input.form, images: input.images }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] });
      setForm(emptyProduct);
      setImages([]);
      setEditing(null);
      setShowForm(false);
    },
    onError: (caught: Error) => setError(caught.message),
  });
  const remove = useMutation({
    mutationFn: catalogApi.deleteProduct,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
    onError: (caught: Error) => setError(caught.message),
  });
  const toggle = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      catalogApi.updateProduct(id, { isAvailable }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["catalog", "products"] }),
    onError: (caught: Error) => setError(caught.message),
  });
  const store = business.data?.data;
  const categoryOptions =
    form.category &&
    !BUSINESS_CATEGORIES.includes(
      form.category as (typeof BUSINESS_CATEGORIES)[number],
    )
      ? [form.category, ...BUSINESS_CATEGORIES]
      : BUSINESS_CATEGORIES;
  const imagePreviews = useMemo(
    () => images.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [images],
  );

  useEffect(
    () => () =>
      imagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url)),
    [imagePreviews],
  );

  const addImages = (selectedFiles: File[]) => {
    const availableSlots = 5 - images.length;
    const invalidType = selectedFiles.some(
      (file) => !file.type.startsWith("image/"),
    );
    const invalidSize = selectedFiles.some(
      (file) => file.size > 5 * 1024 * 1024,
    );
    if (invalidType) setError("Only image files are allowed.");
    else if (invalidSize) setError("Each image must be 5 MB or smaller.");
    else if (selectedFiles.length > availableSlots)
      setError(
        `You can add ${availableSlots} more image${availableSlots === 1 ? "" : "s"}.`,
      );
    const nextFiles = selectedFiles
      .filter(
        (file) =>
          file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024,
      )
      .filter(
        (file) =>
          !images.some(
            (existing) =>
              existing.name === file.name && existing.size === file.size,
          ),
      )
      .slice(0, availableSlots);
    setImages((current) => [...current, ...nextFiles]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((current) =>
      current.filter((_, fileIndex) => fileIndex !== index),
    );
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length || fromIndex === toIndex)
      return;
    setImages((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const openCreate = () => {
    setEditing(null);
    setForm(emptyProduct);
    setImages([]);
    setError("");
    setShowForm(true);
  };
  const openEdit = (product: OwnerProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      price: Number(product.price),
      category: product.category ?? "",
      stockQuantity: product.stockQuantity,
      isAvailable: product.isAvailable,
      imageUrls: [getCatalogImage(product.imageUrls[0]) ?? ""],
    });
    setImages([]);
    setError("");
    setShowForm(true);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || form.name.trim().length < 2)
      return setError("Product name must be at least 2 characters.");
    if (!editing && images.length === 0)
      return setError("Upload at least one product image.");
    if (images.length > 5)
      return setError("You can upload a maximum of 5 images.");
    if (images.some((image) => !image.type.startsWith("image/")))
      return setError("Only image files are allowed.");
    if (images.some((image) => image.size > 5 * 1024 * 1024))
      return setError("Each image must be 5 MB or smaller.");
    save.mutate({ form: { ...form, name: form.name.trim() }, images });
  };

  if (!session)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow text-[#a04b2b]">Store owner portal</p>
          <h1 className="mt-3 font-serif text-4xl">Manage your store.</h1>
          <Link className="button-dark mt-7" href="/owner/login">
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  if (business.isPending)
    return (
      <main className="auth-shell">
        <p className="text-sm text-[#70675d]">Loading your store...</p>
      </main>
    );
  if (business.error instanceof ApiError && business.error.status === 404)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow text-[#a04b2b]">One last step</p>
          <h1 className="mt-3 font-serif text-4xl">Create your storefront.</h1>
          <Link className="button-dark mt-7" href="/owner/onboarding">
            Set up my store
          </Link>
        </div>
      </main>
    );
  if (business.isError || !store)
    return (
      <main className="auth-shell">
        <p className="text-sm text-[#a04b2b]">
          {business.error?.message ?? "Unable to load your store."}
        </p>
      </main>
    );

  return (
    <main className="owner-shell">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between border-b border-[#ded5ca] pb-6">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <div className="flex items-center gap-4">
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
            <Link
              className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
              href={`/store/${store.slug}`}
            >
              View storefront
            </Link>
            <span className="text-sm text-[#70675d]">
              {session.user.fullName}
            </span>
          </div>
        </nav>
        <header className="flex flex-col justify-between gap-5 py-10 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#a04b2b]">Owner workspace</p>
            <h1 className="mt-3 font-serif text-5xl">{store.name}</h1>
            <p className="mt-3 text-sm text-[#70675d]">
              Manage the products customers see in your store.
            </p>
          </div>
          <Link className="button-dark" href="/owner/manage/products/new">
            Add product
          </Link>
        </header>
        {showForm ? (
          <section className="border border-[#d9d0c4] bg-[#fffdf9] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow text-[#a04b2b]">
                  {editing ? "Edit product" : "New product"}
                </p>
                <h2 className="mt-2 font-serif text-3xl">
                  {editing ? editing.name : "Add an item"}
                </h2>
              </div>
              <button
                className="text-sm text-[#70675d] hover:text-[#a04b2b]"
                onClick={() => setShowForm(false)}
                type="button"
              >
                Close
              </button>
            </div>
            <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
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
              <label className="field-label sm:col-span-2">
                Product images
                {editing ? (
                  <div className="image-existing-note">
                    {form.imageUrls[0]
                      ? "The existing product image is kept while editing."
                      : "No product image is currently saved."}
                  </div>
                ) : (
                  <>
                    <div
                      className="image-upload-zone"
                      onClick={() => imageInputRef.current?.click()}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        addImages(Array.from(event.dataTransfer.files));
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          imageInputRef.current?.click();
                      }}
                    >
                      <span className="image-upload-icon">+</span>
                      <span className="font-semibold">
                        Choose images or drop them here
                      </span>
                      <span className="text-xs text-[#8c8176]">
                        PNG, JPG, WEBP up to 5 MB each
                      </span>
                      <input
                        ref={imageInputRef}
                        accept="image/*"
                        className="sr-only"
                        multiple
                        onChange={(event) =>
                          addImages(Array.from(event.target.files ?? []))
                        }
                        type="file"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#8c8176]">
                      <span>{images.length}/5 images selected</span>
                      {images.length > 0 && images.length < 5 ? (
                        <button
                          className="font-semibold text-[#a04b2b] hover:underline"
                          onClick={() => imageInputRef.current?.click()}
                          type="button"
                        >
                          Add more images
                        </button>
                      ) : null}
                    </div>
                    {imagePreviews.length > 0 ? (
                      <div
                        className="image-preview-grid"
                        aria-label="Selected product images"
                      >
                        {imagePreviews.map((preview, index) => (
                          <div
                            className={`image-preview-card ${draggedImageIndex === index ? "image-preview-card-dragging" : ""}`}
                            draggable
                            key={`${preview.file.name}-${preview.file.lastModified}`}
                            onDragStart={() => setDraggedImageIndex(index)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              if (draggedImageIndex !== null)
                                moveImage(draggedImageIndex, index);
                              setDraggedImageIndex(null);
                            }}
                            onDragEnd={() => setDraggedImageIndex(null)}
                          >
                            <img
                              src={preview.url}
                              alt={`Selected product image ${index + 1}`}
                            />
                            <span className="image-preview-order">
                              {index + 1}
                            </span>
                            <button
                              className="image-preview-remove"
                              aria-label={`Remove image ${index + 1}`}
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
                    ) : null}
                  </>
                )}
              </label>
              <label className="field-label sm:col-span-2">
                Description
                <textarea
                  className="field-input min-h-24"
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
              {error ? (
                <p className="text-sm text-[#a04b2b] sm:col-span-2">{error}</p>
              ) : null}
              <div className="sm:col-span-2">
                <button
                  className="button-dark"
                  disabled={save.isPending}
                  type="submit"
                >
                  {save.isPending
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Add product"}
                </button>
              </div>
            </form>
          </section>
        ) : null}
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow text-[#70675d]">Catalog</p>
              <h2 className="mt-2 font-serif text-3xl">Your products</h2>
            </div>
            <span className="text-sm text-[#70675d]">
              {products.data?.data.length ?? 0} items
            </span>
          </div>
          {products.isPending ? (
            <p className="py-8 text-sm text-[#70675d]">Loading products...</p>
          ) : products.isError ? (
            <p className="py-8 text-sm text-[#a04b2b]">
              {products.error.message}
            </p>
          ) : !products.data?.data.length ? (
            <div className="border border-dashed border-[#cfc4b7] bg-[#fffdf9] p-10 text-center">
              <h3 className="font-serif text-2xl">Your catalog is empty.</h3>
              <p className="mt-2 text-sm text-[#70675d]">
                Add your first product to make it visible in your storefront.
              </p>
              <Link
                className="button-dark mt-6"
                href="/owner/manage/products/new"
              >
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.data.data.map((product) => {
                const image = getCatalogImage(product.imageUrls[0]);
                return (
                  <article
                    className="border border-[#d9d0c4] bg-[#fffdf9]"
                    key={product.id}
                  >
                    {image ? (
                      <div className="owner-product-image">
                        <Image
                          alt=""
                          fill
                          sizes="(max-width: 640px) 100vw, 33vw"
                          src={image}
                          style={{ objectFit: "cover" }}
                          className="owner-product-image-main"
                        />
                      </div>
                    ) : null}
                    <div className="p-5">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="mt-1 text-sm text-[#70675d]">
                            {product.category || "Uncategorized"}
                          </p>
                        </div>
                        <p className="font-semibold text-[#a04b2b]">
                          {money(product.price)}
                        </p>
                      </div>
                      <p className="mt-4 text-sm text-[#70675d]">
                        {product.stockQuantity} in stock
                      </p>
                      <div className="mt-5 flex items-center justify-between gap-2">
                        <Link
                          className="text-sm font-semibold text-[#a04b2b] hover:underline"
                          href={`/owner/manage/products/${product.id}/edit`}
                        >
                          Edit
                        </Link>
                        <button
                          className="text-sm text-[#70675d] hover:text-[#a04b2b]"
                          onClick={() =>
                            toggle.mutate({
                              id: product.id,
                              isAvailable: !product.isAvailable,
                            })
                          }
                          type="button"
                        >
                          {product.isAvailable ? "Hide" : "Show"}
                        </button>
                        <button
                          className="text-sm text-[#a04b2b] hover:underline"
                          onClick={() => {
                            if (window.confirm(`Delete ${product.name}?`))
                              remove.mutate(product.id);
                          }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
