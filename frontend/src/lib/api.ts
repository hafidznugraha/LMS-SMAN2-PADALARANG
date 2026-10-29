import { getStoredToken, updateStoredAccessToken, clearAuthSession } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export class ApiClientError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  token?: string;
  _retry?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

async function performSilentRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    const newToken = json?.data?.access_token;
    if (typeof newToken === "string" && newToken) {
      updateStoredAccessToken(newToken);
      return newToken;
    }
    return null;
  } catch {
    return null;
  }
}

function handleSessionExpiration() {
  clearAuthSession();
  if (typeof window !== "undefined") {
    const isLoginPage = window.location.pathname.startsWith("/login");
    if (!isLoginPage) {
      const fromPath = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?expired=1&from=${fromPath}`;
    }
  }
}

export async function fetchAPI<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, _retry = false, ...rest } = options;

  const authToken = token || getStoredToken();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (authToken) {
    requestHeaders["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: requestHeaders,
    credentials: "include",
    ...rest,
  });

  if (response.status === 401) {
    if (!_retry && !endpoint.startsWith("/auth/")) {
      if (!refreshPromise) {
        refreshPromise = performSilentRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;

      if (newToken) {
        return fetchAPI<T>(endpoint, {
          ...options,
          token: newToken,
          _retry: true,
        });
      }
    }

    if (!endpoint.startsWith("/auth/")) {
      handleSessionExpiration();
    }
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || "Terjadi kesalahan saat memproses permintaan";
    throw new ApiClientError(errorMsg, response.status, json?.data);
  }

  return json as T;
}
