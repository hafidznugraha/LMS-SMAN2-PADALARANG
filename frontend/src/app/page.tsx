"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getStoredToken, getStoredUser, getCookie, getRedirectPathByRole } from "@/lib/auth";
import type { UserRole } from "@/types";

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let target = "/login";
    const token = getStoredToken();
    if (token) {
      const cookieRole = getCookie("lms_role");
      const user = getStoredUser();
      const role = (cookieRole || user?.role || "") as UserRole;
      target = getRedirectPathByRole(role);
    }

    router.prefetch(target);

    const p1 = setTimeout(() => setProgress(65), 250);
    const p2 = setTimeout(() => setProgress(100), 850);
    const redirectTimer = setTimeout(() => {
      router.replace(target);
    }, 1200);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 select-none">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white border border-slate-200/90 shadow-md p-3 mx-auto transition-transform duration-500 ease-out hover:scale-105">
          <Image
            src="/logo-sman2.png"
            alt="Logo SMAN 2 Padalarang"
            width={64}
            height={64}
            className="w-full h-full object-contain"
            priority
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">SMAN 2 Padalarang</h1>
          <p className="text-sm text-slate-600 mt-1">Learning Management System Terpadu</p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-3">
          <div
            className="w-44 h-1.5 bg-slate-200/80 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-blue-900 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-wide">
            Memuat portal pembelajaran...
          </p>
        </div>
      </div>
    </main>
  );
}
