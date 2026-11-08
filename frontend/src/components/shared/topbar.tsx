"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  User as UserIcon,
  BookOpen,
  ClipboardList,
  UserCheck,
  CheckCircle2,
  Clock,
  Check,
  X,
} from "lucide-react";
import { useNotifikasi } from "@/hooks/useNotifikasi";
import { NotifikasiItem } from "@/services/notifikasiService";

interface TopbarProps {
  onToggleMobileNav?: () => void;
  userRole?: string;
  userName?: string;
}

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return "Baru saja";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} jam yang lalu`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} hari yang lalu`;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function Topbar({
  onToggleMobileNav,
  userRole = "Siswa",
  userName = "Pengguna",
}: TopbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { items, unreadCount, markAsRead, markAllAsRead } = useNotifikasi(15000);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleItemClick = (notif: NotifikasiItem) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsDropdownOpen(false);
    if (notif.tautan) {
      router.push(notif.tautan);
    }
  };

  const renderIcon = (tipe: string) => {
    switch (tipe.toLowerCase()) {
      case "materi":
        return <BookOpen className="w-4 h-4 text-blue-700" />;
      case "tugas":
        return <ClipboardList className="w-4 h-4 text-amber-600" />;
      case "absensi":
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case "nilai":
        return <CheckCircle2 className="w-4 h-4 text-indigo-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

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
            <h1 className="text-sm font-bold text-slate-900 leading-tight">
              SMAN 2 Padalarang LMS
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Sistem Informasi Pembelajaran Terpadu
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="relative p-2 text-slate-600 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-900 transition-colors cursor-pointer"
            aria-label="Pemberitahuan"
            aria-expanded={isDropdownOpen}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isDropdownOpen && (
            <>
              {/* Backdrop untuk Mobile Bottom Drawer */}
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 sm:hidden animate-in fade-in duration-200"
                onClick={() => setIsDropdownOpen(false)}
                aria-hidden="true"
              />

              {/* Panel Notifikasi: Bottom Drawer di Mobile (< sm), Floating Dropdown di Desktop (>= sm) */}
              <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-4 pb-8 max-h-[85dvh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:absolute sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-full sm:mt-2 sm:w-96 sm:max-h-96 sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-xl sm:p-4 sm:pb-4 sm:animate-in sm:fade-in sm:zoom-in-95">
                {/* Grab Handle Indikator Sheet Mobile */}
                <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto -mt-1 mb-3 shrink-0" />

                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">Notifikasi</h4>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full">
                        {unreadCount} Baru
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllAsRead()}
                        className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer transition-colors p-1 rounded-md hover:bg-blue-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tandai Semua Dibaca</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="sm:hidden p-1.5 -mr-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      aria-label="Tutup Notifikasi"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 overflow-y-auto mt-2 pr-1 overscroll-contain flex-1">
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
                      <p className="text-xs font-semibold text-slate-600">
                        Belum ada notifikasi baru
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pemberitahuan materi baru kelas Anda akan muncul di sini
                      </p>
                    </div>
                  ) : (
                    items.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleItemClick(notif)}
                        className={`p-3.5 sm:p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 my-1 min-h-[48px] ${
                          notif.is_read
                            ? "bg-transparent hover:bg-slate-50 active:bg-slate-100"
                            : "bg-blue-50/70 hover:bg-blue-50 active:bg-blue-100/80 border border-blue-100/70"
                        }`}
                      >
                        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-xs mt-0.5 shrink-0">
                          {renderIcon(notif.tipe)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {notif.judul}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                            {notif.pesan}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">
                            {formatRelativeTime(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xs">
            <UserIcon className="w-5 h-5" />
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {userName}
            </p>
            <p className="text-[11px] text-slate-500 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
