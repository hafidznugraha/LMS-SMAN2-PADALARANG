"use client";

import React, { useState } from "react";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Username atau password salah");
      return;
    }

    setLoading(true);
    // Simulasi autentikasi
    setTimeout(() => {
      setLoading(false);
      if (password !== "password123") {
        setErrorMessage("Username atau password salah");
      } else {
        window.location.href = "/siswa";
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-xs mb-3">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">LOGIN</h2>
          <p className="text-xs text-slate-500 mt-1">LMS SMAN 2 Padalarang</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="sr-only" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Input Username"
              className="w-full bg-slate-100/90 border border-slate-200 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Input Password"
              className="w-full bg-slate-100/90 border border-slate-200 focus:bg-white focus:border-blue-900 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-blue-900 border-slate-300 focus:ring-blue-900"
            />
            <label htmlFor="remember" className="text-xs text-slate-600 select-none">
              Ingat saya?
            </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={loading} className="w-full mt-2" size="md">
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          {/* Error Message Alert */}
          {errorMessage && (
            <p className="text-center text-xs font-semibold text-red-600 pt-2 animate-fade-in">
              ▲ {errorMessage}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
