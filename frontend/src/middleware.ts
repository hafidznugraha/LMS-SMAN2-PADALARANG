import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("lms_access_token")?.value;
  const role = request.cookies.get("lms_role")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/siswa") ||
    pathname.startsWith("/guru");

  if (isAuthRoute) {
    if (token && role) {
      let destination = "/siswa";
      if (role === "kurikulum") destination = "/admin/jadwal";
      else if (role === "guru" || role === "wali_kelas") destination = "/guru";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (isProtectedRoute) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin") && role !== "kurikulum") {
      const target = (role === "guru" || role === "wali_kelas") ? "/guru" : "/siswa";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith("/guru") && role !== "guru" && role !== "wali_kelas") {
      const target = role === "kurikulum" ? "/admin/jadwal" : "/siswa";
      return NextResponse.redirect(new URL(target, request.url));
    }

    if (pathname.startsWith("/siswa") && role !== "siswa") {
      const target = role === "kurikulum" ? "/admin/jadwal" : "/guru";
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/admin/:path*",
    "/siswa/:path*",
    "/guru/:path*",
  ],
};
