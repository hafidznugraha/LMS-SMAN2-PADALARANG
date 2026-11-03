"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { loginUser, getRedirectPathByRole } from "@/lib/auth";
import { AltchaWidget, AltchaHandle } from "@/components/ui/altcha";

export default function LoginPage() {
  const router = useRouter();
  const altchaRef = useRef<AltchaHandle | null>(null);
  const [altchaPayload, setAltchaPayload] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "1") {
        setIsExpired(true);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setErrorMessage("Username dan password wajib diisi");
      return;
    }

    const isAltchaEnabled = process.env.NEXT_PUBLIC_ENABLE_ALTCHA !== "false";
    const finalAltcha = altchaPayload || altchaRef.current?.value || "";
    if (isAltchaEnabled && !finalAltcha) {
      setErrorMessage("Silakan selesaikan verifikasi keamanan (CAPTCHA) terlebih dahulu");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(trimmedUsername, trimmedPassword, rememberMe, finalAltcha);
      const defaultPath = getRedirectPathByRole(result.user.role);

      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const fromParam = params.get("from");
        if (
          fromParam &&
          fromParam.startsWith("/") &&
          !fromParam.startsWith("//") &&
          !fromParam.startsWith("/login")
        ) {
          router.push(fromParam);
          return;
        }
      }

      router.push(defaultPath);
    } catch (err: unknown) {
      altchaRef.current?.reset();
      setAltchaPayload(null);
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Terjadi kesalahan saat menghubungi server");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-between sm:justify-center items-center bg-slate-100 sm:p-4 md:p-6">
      <div className="w-full max-w-md min-h-dvh sm:min-h-0 flex flex-col bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden sm:border border-slate-200/80">
        <div className="relative bg-[#1E3A8A] overflow-hidden px-6 pt-12 pb-16 text-center shrink-0">
          <div className="absolute -top-16 -left-16 w-52 h-52 rounded-full bg-[#3B82F6]/30 pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-[#0284C7]/30 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#1D4ED8]/35 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 mb-3 relative">
              <Image
                src="/logo-sman2.png"
                alt="Logo SMAN 2 Padalarang"
                width={48}
                height={48}
                className="object-contain drop-shadow"
                priority
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Selamat Datang!
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 font-medium mt-1 tracking-wide">
              Portal Akademik SMAN 2 Padalarang
            </p>
          </div>
        </div>

        <div className="relative -mt-6 bg-white rounded-t-[36px] sm:rounded-none px-6 pt-8 pb-8 sm:px-8 sm:py-8 flex-1 flex flex-col justify-between z-10 shadow-lg sm:shadow-none">
          <div className="space-y-4">
            {isExpired && !errorMessage && (
              <div
                role="alert"
                className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-800 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-medium">
                  Sesi Anda telah berakhir demi keamanan. Silakan masuk kembali ke sistem.
                </span>
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-1"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span className="font-medium">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 px-1" htmlFor="username">
                  Username atau Email
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="w-full bg-[#F3F4F6] border-0 focus:bg-white focus:ring-2 focus:ring-blue-900/30 rounded-2xl px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 px-1" htmlFor="password">
                  Kata Sandi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="flex-1 bg-[#F3F4F6] border-0 focus:bg-white focus:ring-2 focus:ring-blue-900/30 rounded-2xl px-5 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-12 h-12 shrink-0 bg-[#F3F4F6] hover:bg-slate-200/80 active:scale-95 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-900/30"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-xs text-slate-600 select-none cursor-pointer">
                    Ingat saya
                  </label>
                </div>
                <span className="text-[11px] text-slate-400">Default: password123</span>
              </div>

              <div className="flex justify-center items-center w-full pt-1 pb-1">
                <AltchaWidget
                  ref={altchaRef}
                  onStateChange={(p) => setAltchaPayload(p)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-full bg-[#1E3A8A] hover:bg-blue-950 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md shadow-blue-950/20 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memverifikasi...
                  </span>
                ) : (
                  "Masuk ke Sistem"
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-4">
            <p className="text-[11px] text-slate-400 font-medium">
              LMS SMAN 2 Padalarang &bull; Tahun Ajaran 2026/2027
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
