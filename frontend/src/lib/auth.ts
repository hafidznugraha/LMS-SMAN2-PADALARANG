import { UserRole } from "@/types";

export interface KelasBinaanInfo {
  id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
}

export interface AuthUserExtra {
  guru_id?: string;
  nip?: string;
  gelar?: string;
  no_telepon?: string;
  is_wali_kelas?: boolean;
  kelas_binaan?: KelasBinaanInfo[];
  siswa_id?: string;
  nis?: string;
  nisn?: string;
  kelas?: unknown;
  [key: string]: unknown;
}

export interface AuthUser {
  id: string;
  username: string;
  nama_lengkap: string;
  email: string;
  role: UserRole;
  extra?: AuthUserExtra;
}

export interface LoginResult {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

function setCookie(name: string, value: string, days: number = 7) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const matches = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") + "=([^;]*)")
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

export function setAuthSession(data: LoginResult, rememberMe: boolean = false) {
  const days = rememberMe ? 30 : 1;
  setCookie("lms_access_token", data.access_token, days);
  setCookie("lms_role", data.user.role, days);
  setCookie("lms_username", data.user.username, days);
  setCookie("lms_nama", data.user.nama_lengkap, days);

  if (typeof window !== "undefined") {
    localStorage.setItem("lms_user", JSON.stringify(data.user));
    localStorage.setItem("lms_access_token", data.access_token);
  }
}

export function updateStoredAccessToken(newToken: string) {
  setCookie("lms_access_token", newToken, 1);
  if (typeof window !== "undefined") {
    localStorage.setItem("lms_access_token", newToken);
  }
}

export function clearAuthSession() {
  deleteCookie("lms_access_token");
  deleteCookie("lms_role");
  deleteCookie("lms_username");
  deleteCookie("lms_nama");

  if (typeof window !== "undefined") {
    localStorage.removeItem("lms_user");
    localStorage.removeItem("lms_access_token");
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("lms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lms_access_token") || getCookie("lms_access_token");
}

export async function loginUser(
  identifier: string,
  password: string,
  rememberMe: boolean = false,
  altchaPayload: string = ""
): Promise<LoginResult> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      identifier: identifier.trim(),
      password: password.trim(),
      remember_me: rememberMe,
      altcha: altchaPayload,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Username atau password salah");
  }

  const result: LoginResult = data.data;
  setAuthSession(result, rememberMe);
  return result;
}

export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch (err) {
    console.error("Gagal logout dari server:", err);
  } finally {
    clearAuthSession();
  }
}

export function getRedirectPathByRole(role: UserRole): string {
  switch (role) {
    case "kurikulum":
      return "/admin/jadwal";
    case "guru":
    case "wali_kelas":
      return "/guru";
    case "siswa":
      return "/siswa";
    default:
      return "/login";
  }
}
