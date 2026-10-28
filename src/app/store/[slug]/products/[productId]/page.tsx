"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Swiper as SwiperInstance } from "swiper";
import { Thumbs } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { getStoreImage, storefrontApi } from "@/lib/api/storefront";
import { useCart } from "@/lib/cart";

const formatPrice = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function ProductDetailPage() {
  const params = useParams<{ slug: string; productId: string }>();
  const cart = useCart();
  const [added, setAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null);
  const productQuery = useQuery({
    queryKey: ["storefront", params.slug, "product", params.productId],
    queryFn: () => storefrontApi.getProduct(params.slug, params.productId),
    enabled: Boolean(params.slug && params.productId),
  });
  const product = productQuery.data?.data;
  const images =
    product?.imageUrls
      .map((item) => getStoreImage(item))
      .filter((item): item is string => Boolean(item)) ?? [];
  const image = images[activeImageIndex] ?? images[0];
  const inStock = Boolean(product && product.stockQuantity > 0);

  const addToCart = () => {
    if (!product || !inStock) return;
    const accepted = cart.addItem({
      itemId: product.id,
      itemType: "product",
      businessSlug: params.slug,
      businessName: product.businessName,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      stockQuantity: product.stockQuantity,
      imageUrl: image,
    });
    setAdded(accepted);
  };

  if (productQuery.isPending) {
    return (
      <main className="store-shell">
        <p className="text-sm text-[#70675d]">Loading product...</p>
      </main>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <main className="store-shell">
        <div className="max-w-md border border-[#e2c7bb] bg-[#fff8f4] p-8">
          <p className="eyebrow text-[#a04b2b]">Storely marketplace</p>
          <h1 className="mt-3 font-serif text-4xl">Product not found.</h1>
          <p className="mt-4 text-sm leading-6 text-[#70675d]">
            This product may have been removed or is no longer available.
          </p>
          <Link className="button-dark mt-7" href={`/store/${params.slug}`}>
            Back to store
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="store-shell">
      <div className="mx-auto max-w-6xl">
        <nav className="flex items-center justify-between border-b border-[#ded5ca] pb-7">
          <Link className="font-serif text-2xl" href="/">
            storely<span className="text-[#a04b2b]">.</span>
          </Link>
          <Link
            className="text-sm font-semibold text-[#70675d] hover:text-[#a04b2b]"
            href={`/store/${params.slug}`}
          >
            Back to {product.businessName}
          </Link>
        </nav>

        <div className="grid gap-12 py-12 md:grid-cols-[1.05fr_.95fr] md:items-start md:py-20">
          <div>
            {images.length > 0 ? (
              <>
                <Swiper
                  className="product-detail-image"
                  modules={[Thumbs]}
                  onSlideChange={(swiper) =>
                    setActiveImageIndex(swiper.activeIndex)
                  }
                  spaceBetween={12}
                  thumbs={{
                    swiper:
                      thumbsSwiper && !thumbsSwiper.destroyed
                        ? thumbsSwiper
                        : null,
                  }}
                >
                  {images.map((galleryImage, index) => (
                    <SwiperSlide key={`${galleryImage}-${index}`}>
                      <Image
                        src={galleryImage}
                        alt={`${product.name}, image ${index + 1}`}
                        fill
                        priority={index === 0}
                        sizes="(max-width: 768px) 100vw, 55vw"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {images.length > 1 ? (
                  <Swiper
                    className="mt-4"
                    modules={[Thumbs]}
                    onSwiper={setThumbsSwiper}
                    slidesPerView="auto"
                    spaceBetween={12}
                    watchSlidesProgress
                  >
                    {images.map((thumbnail, index) => (
                      <SwiperSlide
                        className="!h-20 !w-20"
                        key={`${thumbnail}-${index}`}
                      >
                        <div
                          aria-label={`Preview image ${index + 1}`}
                          className={`relative h-20 w-20 overflow-hidden border-2 bg-[#f1ebe4] ${
                            activeImageIndex === index
                              ? "border-[#a04b2b]"
                              : "border-transparent opacity-65"
                          }`}
                        >
                          <Image
                            src={thumbnail}
                            alt={`${product.name}, thumbnail ${index + 1}`}
                            fill
                            sizes="80px"
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : null}
              </>
            ) : (
              <div className="product-detail-image">
                <span className="font-serif text-8xl text-[#c6b8a9]">
                  {product.name.slice(0, 1)}
                </span>
              </div>
            )}
          </div>

          <section className="md:pt-6">
            <p className="eyebrow text-[#a04b2b]">
              {product.category ?? "Featured product"}
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-none tracking-tight sm:text-7xl">
              {product.name}
            </h1>
            <p className="mt-6 text-2xl font-semibold text-[#a04b2b]">
              {formatPrice(product.price)}
            </p>
            <div className="my-8 border-y border-[#ded5ca] py-7">
              <p className="text-base leading-7 text-[#70675d]">
                {product.description ??
                  "A considered product from this Storely seller."}
              </p>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                {inStock
                  ? `${product.stockQuantity} available`
                  : "Currently unavailable"}
              </span>
              <span className="text-[#70675d]">
                Ships from {product.businessName}
              </span>
            </div>
            <button
              onClick={addToCart}
              className="button-dark mt-8 w-full disabled:cursor-not-allowed disabled:bg-[#b9b0a6]"
              disabled={!inStock}
              type="button"
            >
              {!inStock
                ? "Out of stock"
                : added
                  ? "Added to cart"
                  : "Add to cart"}
            </button>
            {cart.itemCount > 0 ? (
              <Link
                className="mt-4 block text-center text-sm font-semibold text-[#a04b2b] hover:underline"
                href="/checkout"
              >
                View cart ({cart.itemCount})
              </Link>
            ) : null}
            <p className="mt-4 text-center text-xs leading-5 text-[#8c8176]">
              Checkout and delivery options are provided by the store owner.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
