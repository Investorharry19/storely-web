import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import type {
  AuthSession,
  ApiResponse,
  LoginInput,
  SignupInput,
  VerifyOtpInput,
} from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://storely-server.onrender.com/api/v1";
const ACCESS_TOKEN_KEY = "storely.accessToken";
const REFRESH_TOKEN_KEY = "storely.refreshToken";
const USER_KEY = "storely.user";

type TokenResponse = Partial<AuthSession> & { token?: string };
type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const isBrowser = () => typeof window !== "undefined";

const getStored = (key: string) =>
  isBrowser() ? window.localStorage.getItem(key) : null;

const saveSession = (session: AuthSession) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

let accessToken: string | null = null;
let refreshToken: string | null = null;
let sessionSnapshotKey: string | null = null;
let sessionSnapshot: AuthSession | null = null;

const getAccessToken = () => accessToken ?? getStored(ACCESS_TOKEN_KEY);
const getRefreshToken = () => refreshToken ?? getStored(REFRESH_TOKEN_KEY);

export const setAuthTokens = (
  token: string | null,
  nextRefreshToken?: string | null,
) => {
  accessToken = token;
  if (nextRefreshToken !== undefined) refreshToken = nextRefreshToken;
  if (!isBrowser()) return;

  if (token) window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  if (nextRefreshToken !== undefined) {
    if (nextRefreshToken)
      window.localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
    else window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

export const clearSession = () => {
  accessToken = null;
  refreshToken = null;
  if (!isBrowser()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
};

export const getSession = (): AuthSession | null => {
  const accessToken = getStored(ACCESS_TOKEN_KEY);
  const refreshToken = getStored(REFRESH_TOKEN_KEY);
  const rawUser = getStored(USER_KEY);
  const snapshotKey = `${accessToken}\0${refreshToken}\0${rawUser}`;

  if (snapshotKey === sessionSnapshotKey) return sessionSnapshot;
  sessionSnapshotKey = snapshotKey;
  sessionSnapshot = null;

  if (!accessToken || !refreshToken || !rawUser) return null;

  try {
    sessionSnapshot = { accessToken, refreshToken, user: JSON.parse(rawUser) };
    return sessionSnapshot;
  } catch {
    clearSession();
    return null;
  }
};

const axiosInstance = axios.create({ baseURL: API_URL, withCredentials: true });
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const toApiError = (error: AxiosError<unknown>) => {
  const body =
    error.response?.data && typeof error.response.data === "object"
      ? (error.response.data as { message?: string; code?: string })
      : {};
  return new ApiError(
    body.message ?? error.message,
    error.response?.status ?? 0,
    body.code,
  );
};

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isRefreshRoute = originalRequest?.url?.includes("/auth/refresh");
    if (error.response?.status !== 401 || !originalRequest || isRefreshRoute) {
      return Promise.reject(toApiError(error));
    }
    if (originalRequest._retry) return Promise.reject(toApiError(error));

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push((token) => {
          originalRequest.headers.set("Authorization", `Bearer ${token}`);
          axiosInstance(originalRequest).then(resolve).catch(reject);
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;
    try {
      const storedRefreshToken = getRefreshToken();
      if (!storedRefreshToken) throw toApiError(error);
      const response = await axiosInstance.post<TokenResponse>(
        "/auth/refresh",
        { refreshToken: storedRefreshToken },
      );
      const nextAccessToken =
        response.data.accessToken ?? response.data.token ?? null;
      if (!nextAccessToken) throw new Error("Refresh response has no token");

      setAuthTokens(
        nextAccessToken,
        response.data.refreshToken ?? storedRefreshToken,
      );
      refreshSubscribers.forEach((subscriber) => subscriber(nextAccessToken));
      refreshSubscribers = [];
      originalRequest.headers.set("Authorization", `Bearer ${nextAccessToken}`);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      clearSession();
      return Promise.reject(
        refreshError instanceof AxiosError
          ? toApiError(refreshError)
          : refreshError,
      );
    } finally {
      isRefreshing = false;
    }
  },
);

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

export const requests = {
  get: <T>(url: string, params?: Record<string, unknown>) =>
    axiosInstance.get<T>(url, { params }).then(responseBody),
  post: <T>(url: string, body?: unknown) =>
    axiosInstance.post<T>(url, body).then(responseBody),
  put: <T>(url: string, body?: unknown) =>
    axiosInstance.put<T>(url, body).then(responseBody),
  delete: <T>(url: string) => axiosInstance.delete<T>(url).then(responseBody),
  patch: <T>(url: string, body?: unknown) =>
    axiosInstance.patch<T>(url, body).then(responseBody),
  postForm: <T>(url: string, body: FormData) =>
    axiosInstance.post<T>(url, body).then(responseBody),
  patchFileForm: <T>(url: string, body: FormData) =>
    axiosInstance.patch<T>(url, body).then(responseBody),
  patchForm: <T>(url: string, body: unknown) =>
    axiosInstance.patch<T>(url, body).then(responseBody),
};

export const authApi = {
  async login(input: LoginInput) {
    const body = await requests.post<ApiResponse<never> & AuthSession>(
      "/auth/login",
      input,
    );
    saveSession(body);
    return body;
  },
  async signup(input: SignupInput) {
    return requests.post<ApiResponse<null> & { message: string }>(
      "/auth/signup",
      input,
    );
  },
  async verifyOtp(input: VerifyOtpInput) {
    const body = await requests.post<ApiResponse<never> & AuthSession>(
      "/auth/verify-otp",
      input,
    );
    if (input.purpose === "SIGNUP") saveSession(body);
    return body;
  },
  resendOtp(email: string) {
    return requests.post<ApiResponse<null> & { message: string }>(
      "/auth/resend-otp",
      { email, purpose: "SIGNUP" },
    );
  },
  logout() {
    const session = getSession();
    clearSession();
    if (!session) return Promise.resolve();
    return requests
      .post("/auth/logout", { refreshToken: session.refreshToken })
      .catch(() => undefined);
  },
};
