export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type ApiDataResponse<T> = ApiResponse<T> & {
  data: T;
};

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = LoginInput & {
  fullName: string;
};

export type VerifyOtpInput = {
  email: string;
  code: string;
  purpose: "SIGNUP" | "PASSWORD_RESET";
};

export type DashboardMetrics = {
  totalStores: number;
  pendingUsers: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingPayments: number;
  completedPayments: number;
};

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  isVerified: boolean | string;
  phone: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  createdAt: string;
  lastLogin: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};
