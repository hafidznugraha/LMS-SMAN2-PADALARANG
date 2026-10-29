import { getStoredToken } from "./auth";

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
}

export async function fetchAPI<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers = {}, ...rest } = options;

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
    ...rest,
  });

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = json?.message || "Terjadi kesalahan saat memproses permintaan";
    throw new ApiClientError(errorMsg, response.status, json?.data);
  }

  return json as T;
}
