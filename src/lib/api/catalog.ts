import { requests } from "./client";
import type { ApiDataResponse } from "./types";

export type OwnerProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string | null;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrls: Array<{ url: string } | string>;
};

export type ProductInput = {
  name: string;
  description?: string;
  price: number;
  category?: string;
  stockQuantity: number;
  isAvailable: boolean;
  imageUrls: string[];
};

export type ProductCreateInput = Omit<
  ProductInput,
  "imageUrls" | "isAvailable"
> & {
  images: File[];
  isAvailable?: boolean;
};

export type ProductImageOrder =
  | { type: "existing"; url: string }
  | { type: "new"; index: number };

export const catalogApi = {
  getProducts: () =>
    requests.get<ApiDataResponse<OwnerProduct[]>>("/catalog/products"),
  createProduct: (input: ProductCreateInput) => {
    const body = new FormData();
    body.append("name", input.name);
    body.append("description", input.description ?? "");
    body.append("price", String(input.price));
    body.append("category", input.category ?? "");
    body.append("stockQuantity", String(input.stockQuantity));
    input.images.forEach((image) => body.append("images", image));
    return requests.postForm<ApiDataResponse<OwnerProduct>>(
      "/catalog/products",
      body,
    );
  },
  updateProduct: (
    productId: string,
    input: Partial<ProductInput> & {
      images?: File[];
      imageOrder?: ProductImageOrder[];
    },
  ) => {
    if (!input.images && !input.imageOrder) {
      const { images: _images, imageOrder: _order, ...json } = input;
      return requests.patch<ApiDataResponse<OwnerProduct>>(
        `/catalog/products/${productId}`,
        json,
      );
    }
    const body = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (key === "images" || value === undefined) return;
      body.append(
        key,
        key === "imageOrder" ? JSON.stringify(value) : String(value),
      );
    });
    input.images?.forEach((image) => body.append("images", image));
    return requests.patchFileForm<ApiDataResponse<OwnerProduct>>(
      `/catalog/products/${productId}`,
      body,
    );
  },
  getProduct: (productId: string) =>
    requests.get<ApiDataResponse<OwnerProduct>>(
      `/catalog/products/${productId}`,
    ),
  deleteProduct: (productId: string) =>
    requests.delete<ApiDataResponse<null>>(`/catalog/products/${productId}`),
};

export const getCatalogImage = (
  image: OwnerProduct["imageUrls"][number] | undefined,
) => (typeof image === "string" ? image : image?.url);
