import { requests } from "./client";
import type { ApiResponse } from "./types";

export type StoreImage = string | { url: string };

export type StoreProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  stockQuantity: number;
  imageUrls: StoreImage[];
};

export type StoreProductDetail = StoreProduct & {
  businessName: string;
  storeUrl: string;
};

export type StoreService = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  priceType: "FIXED" | "STARTING_FROM" | string;
  category: string | null;
  imageUrl: string | null;
};

export type Storefront = {
  id: string;
  name: string;
  slug: string;
  type: "PRODUCT" | "SERVICE" | "HYBRID" | string;
  category: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  location: string | null;
  logoUrl: string | null;
  isActive: boolean;
  products: StoreProduct[];
  services: StoreService[];
  storeUrl: string;
};

export const storefrontApi = {
  getBySlug: (slug: string) =>
    requests.get<ApiResponse<Storefront>>(`/store/${encodeURIComponent(slug)}`),
  getProduct: (slug: string, productId: string) =>
    requests.get<ApiResponse<StoreProductDetail>>(
      `/store/${encodeURIComponent(slug)}/products/${encodeURIComponent(productId)}`,
    ),
};

export const getStoreImage = (image: StoreImage | undefined) =>
  typeof image === "string" ? image : image?.url;
