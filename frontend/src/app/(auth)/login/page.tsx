"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ShieldCheck, BookOpen, Clock, AlertCircle } from "lucide-react";
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

    const finalAltcha = altchaPayload || altchaRef.current?.value || "";
    if (!finalAltcha) {
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
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        <div className="hidden md:flex md:col-span-5 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white p-8 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center mb-6 p-2 shadow-inner">
              <Image
                src="/logo-sman2.png"
                alt="Logo SMAN 2 Padalarang"
                width={48}
                height={48}
                className="w-full h-full object-contain drop-shadow-md"
                priority
              />
            </div>
            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-200 text-xs font-semibold rounded-full border border-blue-400/30 mb-3 tracking-wide">
              SMAN 2 PADALARANG
            </span>
            <h1 className="text-2xl font-black tracking-tight leading-snug">
              Learning Management System
            </h1>
            <p className="text-xs text-blue-100/80 mt-2 leading-relaxed">
              Platform akademik terpadu untuk kurikulum, pendidik, dan peserta didik SMA Negeri 2 Padalarang.
            </p>
          </div>

          <div className="relative z-10 space-y-3.5 my-6">
            <div className="flex items-center gap-3 text-xs text-blue-100/90 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <Clock className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Manajemen jadwal bebas bentrok</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-100/90 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <BookOpen className="w-4 h-4 text-sky-300 shrink-0" />
              <span>Akses materi & tugas real-time</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-100/90 bg-white/5 p-2.5 rounded-xl border border-white/10">
              <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Keamanan sesi berbasis RBAC</span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-blue-200/60 border-t border-white/10 pt-4">
            Tahun Ajaran 2026/2027 • Versi 1.0.0
          </div>
        </div>

        <div className="col-span-1 md:col-span-7 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left mb-6">
              <div className="md:hidden w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-md mb-3 p-2">
                <Image
                  src="/logo-sman2.png"
                  alt="Logo SMAN 2 Padalarang"
                  width={44}
                  height={44}
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">LOGIN</h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masukkan kredensial akun akademik Anda
              </p>
            </div>

            {isExpired && !errorMessage && (
              <div
                role="alert"
                className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 animate-in fade-in slide-in-from-top-1"
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
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in slide-in-from-top-1"
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

              <div className="pt-1">
                <AltchaWidget
                  ref={altchaRef}
                  onStateChange={(p) => setAltchaPayload(p)}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-3 h-12 text-sm font-semibold shadow-md shadow-blue-900/10"
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
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Pilih Akun Demo Uji Coba (Multi-Role):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoAccount("kurikulum_herman")}
                className="text-left p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-900">Kurikulum</div>
                <div className="text-slate-500 text-[10px] truncate">Herman Wijaya</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("guru_sitiaminah")}
                className="text-left p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-900">Guru</div>
                <div className="text-slate-500 text-[10px] truncate">Dr. Siti Aminah</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoAccount("siswa_laura")}
                className="text-left p-2 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-200 transition-all text-[11px] group"
              >
                <div className="font-bold text-slate-800 group-hover:text-blue-900">Siswa</div>
                <div className="text-slate-500 text-[10px] truncate">Laura Firdaus</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
