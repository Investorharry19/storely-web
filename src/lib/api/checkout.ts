import { requests } from "./client";
import type { ApiDataResponse } from "./types";

export type CheckoutItem = {
  itemId: string;
  itemType: "product" | "service";
  quantity: number;
};

export type CheckoutInput = {
  businessSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  items: CheckoutItem[];
};

export type CheckoutResult = {
  orderId: string;
  totalAmount: number | string;
  paymentUrl: string;
  reference: string;
};

export type PaymentResult = {
  orderId: string;
  status: string;
};

export const checkoutApi = {
  initialize: (input: CheckoutInput) =>
    requests.post<ApiDataResponse<CheckoutResult>>("/checkout", input),
  verify: (reference: string) =>
    requests.get<ApiDataResponse<PaymentResult>>(
      `/checkout/verify?reference=${encodeURIComponent(reference)}`,
    ),
};
