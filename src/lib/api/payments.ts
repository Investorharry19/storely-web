import { requests } from "./client";
import type { ApiDataResponse } from "./types";

export type PaymentRecord = {
  id: string;
  orderId: string;
  amount: number | string;
  status: "PENDING" | "PAID" | "FAILED";
  method: string | null;
  paystackRef: string | null;
  createdAt: string;
  order: { customerName: string; totalAmount: number | string };
};
export type PaymentsResult = {
  payments: PaymentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
export type PaymentSummary = {
  paidAmount: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
};

export const paymentsApi = {
  list: (status?: string) =>
    requests.get<ApiDataResponse<PaymentsResult>>(
      `/payments?limit=50${status ? `&status=${encodeURIComponent(status)}` : ""}`,
    ),
  summary: () =>
    requests.get<ApiDataResponse<PaymentSummary>>("/payments/summary"),
};
