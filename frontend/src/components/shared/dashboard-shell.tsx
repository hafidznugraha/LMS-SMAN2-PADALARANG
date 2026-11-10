"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { getStoredUser, AuthUser } from "@/lib/auth";
import { fetchAPI } from "@/lib/api";
import { formatNamaWithGelar } from "@/lib/utils";
import { UserRole } from "@/types";

interface DashboardShellProps {
  role: UserRole;
  children: React.ReactNode;
}

const defaultNames: Record<UserRole, string> = {
  kurikulum: "Drs. Herman Wijaya, M.M",
  guru: "Dr. Siti Aminah, M.Pd",
  wali_kelas: "Budi Santoso, S.Pd",
  siswa: "Laura Firdaus",
};

const roleLabels: Record<UserRole, string> = {
  kurikulum: "Kurikulum (Admin)",
  guru: "Guru Pendidik",
  wali_kelas: "Wali Kelas",
  siswa: "Siswa",
};

export function DashboardShell({ role, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userName, setUserName] = useState<string>(defaultNames[role] || "Pengguna");

  useEffect(() => {
    const user = getStoredUser();
    if (user?.nama_lengkap) {
      const isGuruRole = role === "guru" || role === "wali_kelas" || user.role === "guru" || user.role === "wali_kelas";
      const initialGelar = (user.extra?.gelar as string) || "";
      const formatted = isGuruRole
        ? formatNamaWithGelar(user.nama_lengkap, initialGelar)
        : user.nama_lengkap;
      setUserName(formatted);
    }

    if (role === "guru" || role === "wali_kelas" || user?.role === "guru" || user?.role === "wali_kelas") {
      fetchAPI<{ success: boolean; data?: AuthUser }>("/auth/me")
        .then((res) => {
          if (res?.success && res.data) {
            const profile = res.data;
            const freshGelar = (profile.extra?.gelar as string) || "";
            const formatted = formatNamaWithGelar(profile.nama_lengkap, freshGelar);
            setUserName(formatted);
            if (typeof window !== "undefined") {
              localStorage.setItem("lms_user", JSON.stringify(profile));
            }
          }
        })
        .catch(() => {
        });
    }
  }, [role]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0">
        <Sidebar role={role} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden m-0">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity m-0"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-[#1E3A8A]">
            <Sidebar role={role} onCloseMobile={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Topbar
          onToggleMobileNav={() => setMobileNavOpen(true)}
          userName={userName}
          userRole={roleLabels[role] || "Pengguna"}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
