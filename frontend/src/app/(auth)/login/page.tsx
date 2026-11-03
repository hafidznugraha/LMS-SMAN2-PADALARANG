"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

    const isAltchaEnabled = process.env.NEXT_PUBLIC_ENABLE_ALTCHA === "true";
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

  const setDemoAccount = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword("password123");
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100/70 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-xs mb-3 p-2">
            <Image
              src="/logo-sman2.png"
              alt="Logo SMAN 2 Padalarang"
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="inline-block px-3 py-0.5 bg-blue-50 text-blue-900 text-[11px] font-bold rounded-full border border-blue-200/70 mb-2 tracking-wide uppercase">
            SMAN 2 Padalarang
          </span>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">LOGIN</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Silakan masukkan kredensial akun akademik Anda
          </p>
        </div>

        {isExpired && !errorMessage && (
          <div
            role="alert"
            className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 animate-in fade-in slide-in-from-top-1"
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
            className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="username">
              Username atau Email
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Contoh: kurikulum_herman atau siswa_laura"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="password">
              Kata Sandi
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi"
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-[38px] text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900 cursor-pointer"
              />
              <label htmlFor="remember" className="text-xs text-slate-600 select-none cursor-pointer">
                Ingat saya selama 30 hari
              </label>
            </div>
            <span className="text-[11px] text-slate-400">Default: password123</span>
          </div>

          {process.env.NEXT_PUBLIC_ENABLE_ALTCHA === "true" && (
            <div className="pt-1">
              <AltchaWidget
                ref={altchaRef}
                onStateChange={(p) => setAltchaPayload(p)}
              />
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-2 h-12 text-sm font-semibold shadow-md shadow-blue-900/10"
            size="md"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memverifikasi...
              </span>
            ) : (
              "Masuk ke Sistem"
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Pilih Akun Demo Uji Coba:
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoAccount("kurikulum_herman")}
              className="text-center p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
            >
              <div className="font-bold text-slate-800 group-hover:text-blue-900">Kurikulum</div>
              <div className="text-slate-500 text-[10px] truncate">Herman W.</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("guru_sitiaminah")}
              className="text-center p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
            >
              <div className="font-bold text-slate-800 group-hover:text-blue-900">Guru</div>
              <div className="text-slate-500 text-[10px] truncate">Dr. Siti A.</div>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount("siswa_laura")}
              className="text-center p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
            >
              <div className="font-bold text-slate-800 group-hover:text-blue-900">Siswa</div>
              <div className="text-slate-500 text-[10px] truncate">Laura F.</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
