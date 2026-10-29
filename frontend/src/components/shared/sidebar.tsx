"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  HelpCircle,
  UserCheck,
  User,
  Calendar,
  Award,
  Users,
  Building2,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { logoutUser, getStoredUser, AuthUser } from "@/lib/auth";

interface SidebarProps {
  role?: "siswa" | "guru" | "wali_kelas" | "kurikulum";
  className?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ role = "siswa", className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

  const isTeacherRole = role === "guru" || role === "wali_kelas";
  const isWali =
    isTeacherRole &&
    (Boolean(currentUser?.extra?.is_wali_kelas) ||
      Boolean(currentUser?.extra?.kelas_binaan && currentUser.extra.kelas_binaan.length > 0) ||
      currentUser?.role === "wali_kelas" ||
      role === "wali_kelas");

  const kelasBinaanName = currentUser?.extra?.kelas_binaan?.[0]?.nama_kelas;

  const navLinks = {
    siswa: [
      { href: "/siswa", label: "Dashboard", icon: LayoutDashboard },
      { href: "/siswa/materi", label: "Materi", icon: BookOpen },
      { href: "/siswa/tugas", label: "Tugas", icon: ClipboardList },
      { href: "/siswa/kuis", label: "Kuis", icon: HelpCircle },
      { href: "/siswa/absensi", label: "Absensi", icon: UserCheck },
      { href: "/siswa/profil", label: "Profil", icon: User },
    ],
    guru: [
      { href: "/guru", label: "Dashboard", icon: LayoutDashboard },
      { href: "/guru/materi", label: "Materi", icon: BookOpen },
      { href: "/guru/tugas", label: "Tugas", icon: ClipboardList },
      { href: "/guru/kuis", label: "Kuis", icon: HelpCircle },
      { href: "/guru/absensi", label: "Absensi", icon: UserCheck },
      { href: "/guru/nilai", label: "Nilai", icon: Award },
    ],
    wali_kelas: [
      { href: "/wali-kelas", label: "Dashboard", icon: LayoutDashboard },
      { href: "/wali-kelas/kehadiran", label: "Kehadiran Kelas", icon: UserCheck },
      { href: "/wali-kelas/raport", label: "Raport", icon: Award },
    ],
    kurikulum: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/jadwal", label: "Kelola Jadwal", icon: Calendar },
      { href: "/admin/kelas", label: "Data Kelas", icon: Building2 },
      { href: "/admin/mapel", label: "Mata Pelajaran", icon: BookOpen },
      { href: "/admin/siswa", label: "Data Siswa", icon: Users },
      { href: "/admin/guru", label: "Data Guru", icon: User },
    ],
  };

  const effectiveRole = role === "wali_kelas" ? "guru" : role;
  const activeLinks = navLinks[effectiveRole] || navLinks.siswa;

  return (
    <aside className={cn("flex flex-col h-full bg-[#1E3A8A] text-white", className)}>
      <div className="p-5 border-b border-blue-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-1.5 shrink-0 shadow-inner">
          <Image
            src="/logo-sman2.png"
            alt="Logo SMAN 2 Padalarang"
            width={32}
            height={32}
            className="w-full h-full object-contain drop-shadow-sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold tracking-tight text-white leading-tight truncate">SMAN 2 Padalarang</h2>
          <p className="text-[11px] text-blue-200 mt-0.5 truncate">LMS Terpadu</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {activeLinks.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onCloseMobile}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-white text-blue-900 font-semibold shadow-xs"
                  : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isWali && (
          <div className="pt-4 mt-3 border-t border-blue-800/60">
            <div className="px-3.5 pb-2 text-[10px] font-bold tracking-wider text-blue-200 uppercase">
              Wali Kelas {kelasBinaanName ? `(${kelasBinaanName})` : ""}
            </div>
            <div className="space-y-1">
              <Link
                href="/wali-kelas"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/wali-kelas"
                    ? "bg-white text-blue-900 font-semibold shadow-xs"
                    : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
                )}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>Ringkasan Rombel</span>
              </Link>
              <Link
                href="/wali-kelas/kehadiran"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/wali-kelas/kehadiran"
                    ? "bg-white text-blue-900 font-semibold shadow-xs"
                    : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
                )}
              >
                <UserCheck className="w-5 h-5 shrink-0" />
                <span>Kehadiran Kelas</span>
              </Link>
              <Link
                href="/wali-kelas/raport"
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/wali-kelas/raport"
                    ? "bg-white text-blue-900 font-semibold shadow-xs"
                    : "text-blue-100 hover:bg-blue-800/60 hover:text-white"
                )}
              >
                <Award className="w-5 h-5 shrink-0" />
                <span>Raport & Leger</span>
              </Link>
            </div>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-blue-800/60">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-blue-200/90 rounded-xl hover:bg-blue-800/60 hover:text-white transition-colors text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
