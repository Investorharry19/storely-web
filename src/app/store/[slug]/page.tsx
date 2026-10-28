"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStoreImage, storefrontApi } from "@/lib/api/storefront";

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function StorefrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const storefront = useQuery({
    queryKey: ["storefront", slug],
    queryFn: () => storefrontApi.getBySlug(slug),
    enabled: Boolean(slug),
  });
  const store = storefront.data?.data;

  if (storefront.isPending) {
    return (
      <main className="store-shell">
        <p className="text-sm text-[#70675d]">Opening this store...</p>
      </main>
    );
  }

  if (storefront.isError || !store) {
    return (
      <main className="store-shell">
        <div className="max-w-md border border-[#e2c7bb] bg-[#fff8f4] p-8">
          <p className="eyebrow text-[#a04b2b]">Storely marketplace</p>
          <h1 className="mt-3 font-serif text-4xl">
            This store is unavailable.
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#70675d]">
            The link may be incorrect, or this seller is not currently accepting
            visitors.
          </p>
          <Link className="button-dark mt-7" href="/">
            Browse another store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="store-shell">
      <header className="mx-auto max-w-6xl border-b border-[#ded5ca] pb-8">
        <nav className="flex items-center justify-between gap-4">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <a
            className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
            href="#catalog"
          >
            Shop collection
          </a>
        </nav>
        <div className="mt-16 grid gap-10 md:grid-cols-[1.15fr_.85fr] md:items-end">
          <div>
            <p className="eyebrow text-[#a04b2b]">
              {store.category} / {store.location ?? "Online store"}
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[.95] tracking-tight sm:text-8xl">
              {store.name}
            </h1>
          </div>
          <div className="md:pb-2">
            <p className="max-w-md text-base leading-7 text-[#70675d]">
              {store.description ??
                "Thoughtfully selected goods, made available through Storely."}
            </p>
            {store.email ? (
              <a
                className="mt-5 inline-block text-sm font-semibold text-[#a04b2b] underline-offset-4 hover:underline"
                href={`mailto:${store.email}`}
              >
                Contact the store
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl py-12" id="catalog">
        <div className="flex items-end justify-between border-b border-[#ded5ca] pb-4">
          <div>
            <p className="eyebrow text-[#70675d]">The collection</p>
            <h2 className="mt-2 font-serif text-3xl">Available now</h2>
          </div>
          <span className="text-sm text-[#70675d]">
            {store.products.length + store.services.length} items
          </span>
        </div>

        {store.products.length === 0 && store.services.length === 0 ? (
          <p className="py-14 text-sm text-[#70675d]">
            This collection is being refreshed. Check back soon.
          </p>
        ) : (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {store.products.map((product) => {
              const image = getStoreImage(product.imageUrls[0]);
              return (
                <article className="group" key={product.id}>
                  <Link
                    className="product-image"
                    href={`/store/${store.slug}/products/${product.id}`}
                  >
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <span className="font-serif text-5xl text-[#c6b8a9]">
                        {product.name.slice(0, 1)}
                      </span>
                    )}
                  </Link>
                  <div className="mt-4 flex justify-between gap-4">
                    <div>
                      <p className="font-semibold">{product.name}</p>
                      <p className="mt-1 text-sm text-[#70675d]">
                        {product.category ?? "Featured product"}
                      </p>
                    </div>
                    <p className="font-semibold text-[#a04b2b]">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </article>
              );
            })}
            {store.services.map((service) => (
              <article className="group" key={service.id}>
                <div className="product-image">
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <span className="font-serif text-5xl text-[#c6b8a9]">
                      {service.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="mt-4 flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="mt-1 text-sm text-[#70675d]">
                      {service.category ?? "Service"}
                    </p>
                  </div>
                  <p className="font-semibold text-[#a04b2b]">
                    {formatPrice(service.price)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-6xl border-t border-[#ded5ca] py-7 text-sm text-[#70675d]">
        A storefront powered by{" "}
        <Link className="font-semibold text-[#24201c]" href="/">
          storely.
        </Link>
      </footer>
    </main>
  );
}
