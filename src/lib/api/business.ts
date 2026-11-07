import { requests } from "./client";
import type { ApiResponse } from "./types";

export type OwnerBusiness = {
  id: string;
  name: string;
  slug: string;
  type: "PRODUCT" | "SERVICE" | "HYBRID";
  category: string;
  description: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  location: string | null;
  logoUrl: string | null;
  storeUrl: string;
};

export type CreateBusinessInput = {
  name: string;
  type: "PRODUCT" | "SERVICE" | "HYBRID";
  category: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  location?: string;
};

export type UpdateBusinessInput = Partial<CreateBusinessInput>;

export const businessApi = {
  getMine: () => requests.get<ApiResponse<OwnerBusiness>>("/business/me"),
  create: (input: CreateBusinessInput) =>
    requests.post<ApiResponse<OwnerBusiness>>("/business", input),
  update: (input: UpdateBusinessInput) =>
    requests.patch<ApiResponse<OwnerBusiness>>("/business/me", input),
  updateLogo: (logo: File) => {
    const body = new FormData();
    body.append("logo", logo);
    return requests.patchFileForm<ApiResponse<{ logoUrl: string }>>(
      "/business/me/logo",
      body,
    );
  },
  createWithLogo: (input: CreateBusinessInput, logo: File) => {
    const body = new FormData();
    Object.entries(input).forEach(([key, value]) => {
      if (value !== undefined && value !== "") body.append(key, value);
    });
    body.append("logo", logo);
    return requests.postForm<ApiResponse<OwnerBusiness>>("/business", body);
  },
};
