"use client";

import React from "react";
import Link from "next/link";
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
import { logoutUser } from "@/lib/auth";

interface SidebarProps {
  role?: "siswa" | "guru" | "wali_kelas" | "kurikulum";
  className?: string;
  onCloseMobile?: () => void;
}

export function Sidebar({ role = "siswa", className, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.push("/login");
  };

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
      { href: "/admin/siswa", label: "Data Siswa", icon: Users },
      { href: "/admin/guru", label: "Data Guru", icon: User },
    ],
  }[role];

  return (
    <aside className={cn("flex flex-col h-full bg-[#1E3A8A] text-white", className)}>
      <div className="p-6 border-b border-blue-800/60">
        <h2 className="text-lg font-bold tracking-tight">LMS SMA</h2>
        <p className="text-xs text-blue-200 mt-0.5">Sistem Pembelajaran SMAN 2</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
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
