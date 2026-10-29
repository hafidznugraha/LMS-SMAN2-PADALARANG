"use client";

import React from "react";
import Image from "next/image";
import { Menu, Bell, User as UserIcon } from "lucide-react";

interface TopbarProps {
  onToggleMobileNav?: () => void;
  userRole?: string;
  userName?: string;
}

export function Topbar({ onToggleMobileNav, userRole = "Siswa", userName = "Pengguna" }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 bg-white/95 backdrop-blur-sm border-b border-slate-100 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="p-2 text-slate-700 rounded-xl hover:bg-slate-100 lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-900"
          aria-label="Buka Menu Navigasi"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center p-1 shrink-0">
            <Image
              src="/logo-sman2.png"
              alt="Logo SMAN 2 Padalarang"
              width={24}
              height={24}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">SMAN 2 Padalarang LMS</h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">Sistem Informasi Pembelajaran Terpadu</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="relative p-2 text-slate-600 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900"
          aria-label="Pemberitahuan"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xs">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">{userName}</p>
            <p className="text-[11px] text-slate-500 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
