import { requests } from "./client";
import type { ApiDataResponse } from "./types";

export type OwnerOrderItem = {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
};
export type OwnerOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string | null;
  totalAmount: number | string;
  status: "NEW" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  createdAt: string;
  items: OwnerOrderItem[];
};
export type OrderFilters = {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  customerName?: string;
};
export type OrdersResult = {
  orders: OwnerOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const queryString = (filters: OrderFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  return params.toString();
};

export const ordersApi = {
  list: (filters: OrderFilters = {}) =>
    requests.get<ApiDataResponse<OrdersResult>>(
      `/orders?${queryString({ limit: 20, ...filters })}`,
    ),
  get: (orderId: string) =>
    requests.get<ApiDataResponse<OwnerOrder>>(`/orders/${orderId}`),
  updateStatus: (orderId: string, status: OwnerOrder["status"]) =>
    requests.patch<ApiDataResponse<OwnerOrder>>(`/orders/${orderId}/status`, {
      status,
    }),
};
