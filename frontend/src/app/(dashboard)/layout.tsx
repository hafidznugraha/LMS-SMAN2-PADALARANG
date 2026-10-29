"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { getStoredUser, AuthUser } from "@/lib/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const role = currentUser?.role || "siswa";
  const userName = currentUser?.nama_lengkap || "Pengguna";

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "kurikulum":
        return "Kurikulum (Admin)";
      case "guru":
        return "Guru Pendidik";
      case "wali_kelas":
        return "Wali Kelas";
      case "siswa":
        return "Siswa";
      default:
        return "Pengguna";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:shrink-0">
        <Sidebar role={role} />
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
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
          userRole={getRoleLabel(role)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
