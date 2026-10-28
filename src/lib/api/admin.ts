import { requests } from "./client";
import type { ApiResponse, DashboardMetrics } from "./types";

export const adminApi = {
  getDashboardMetrics: () =>
    requests.get<ApiResponse<DashboardMetrics>>("/admin/metrics/dashboard"),
};
