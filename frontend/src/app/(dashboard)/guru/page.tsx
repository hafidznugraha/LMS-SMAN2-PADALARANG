"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  ClipboardCheck,
  HelpCircle,
  UserCheck,
  Upload,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  BookOpen,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { getStoredUser, AuthUser } from "@/lib/auth";

export default function GuruDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const teacherName = currentUser?.nama_lengkap || "Dr. Siti Aminah, M.Pd";
  const isWali = Boolean(
    currentUser?.extra?.is_wali_kelas ||
      (currentUser?.extra?.kelas_binaan && currentUser.extra.kelas_binaan.length > 0) ||
      currentUser?.role === "wali_kelas"
  );
  const kelasBinaan = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelasBinaan = kelasBinaan?.nama_kelas || "XII IPA 1";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Selamat Datang, {teacherName} 👏
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
              Guru Pengampu
            </span>
            {isWali && (
              <>
                <span>•</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300/60">
                  Wali Kelas {namaKelasBinaan}
                </span>
              </>
            )}
            <span>•</span>
            <span>NIP: {currentUser?.extra?.nip || "198505152010012001"}</span>
            <span>•</span>
            <span className="font-medium text-slate-800">Mata Pelajaran: Matematika Peminatan</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <Upload className="w-4 h-4" />
            <span>Upload Materi</span>
          </Button>
          <Button variant="primary" size="sm" className="gap-1.5">
            <PlusCircle className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </Button>
        </div>
      </div>

      {isWali && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30">
                Tugas Tambahan Aktif
              </span>
              <span>Semester Ganjil 2026/2027</span>
            </div>
            <h2 className="text-base font-bold text-white">
              Wali Kelas: Rombel {namaKelasBinaan}
            </h2>
            <p className="text-xs text-emerald-100/80">
              Pantau rekap absensi harian dan kelola catatan rapor buku leger kelas binaan Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link href="/wali-kelas">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-emerald-950 hover:bg-emerald-50 border-0 text-xs font-semibold gap-1.5"
              >
                <span>Kelola Kelas Binaan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Kelas"
          value="5"
          subtitle="Kelas Binaan & Reguler"
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Tugas Perlu Dinilai"
          value="64"
          subtitle="Menunggu evaluasi guru"
          icon={ClipboardCheck}
          variant="white"
        />
        <MetricCard
          title="Kuis Aktif"
          value="3"
          subtitle="Sesi penilaian berlangsung"
          icon={HelpCircle}
          variant="cyan"
        />
        <MetricCard
          title="Kehadiran Siswa Hari Ini"
          value="95%"
          subtitle="800 dari 823 siswa hadir"
          icon={UserCheck}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-900" />
              Jadwal Mengajar Hari Ini (Senin)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Semester Ganjil 2026/2027</span>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                    XII IPA 1
                  </span>
                  <span className="text-xs text-slate-500 font-medium">32 Siswa</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Matematika Peminatan</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    07:00 - 09:00 WIB
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Ruang R.XII-1
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center">
                <Button variant="secondary" size="sm" className="text-xs">
                  Absensi Kelas
                </Button>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                    XII IPA 3
                  </span>
                  <span className="text-xs text-slate-500 font-medium">30 Siswa</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Matematika Peminatan</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-700" />
                    09:30 - 11:30 WIB
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Ruang R.XII-3
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:self-center">
                <Button variant="secondary" size="sm" className="text-xs">
                  Absensi Kelas
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-amber-600" />
              Tugas Perlu Dinilai
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
              2 Tugas Menunggu
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
            <div className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Latihan Matriks dan Determinan Ordo 3x3
                  </h4>
                  <p className="text-[11px] text-slate-500">Kelas XII IPA 1</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                  28/32 Mengumpulkan
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400">Tenggat: Kemarin, 23:59 WIB</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 focus:outline-none"
                >
                  Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Analisis Limit Fungsi Aljabar Tak Hingga
                  </h4>
                  <p className="text-[11px] text-slate-500">Kelas XII IPA 3</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-md shrink-0">
                  18/30 Mengumpulkan
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-400">Tenggat: Hari Ini, 18:00 WIB</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 focus:outline-none"
                >
                  Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-200">
                <BookOpen className="w-4 h-4 text-sky-300" />
                <span>Distribusi Bahan Ajar</span>
              </div>
              <p className="text-xs font-bold text-white">Kelola Berkas Materi Pelajaran</p>
            </div>
            <Button variant="secondary" size="sm" className="text-xs bg-white text-blue-950 hover:bg-blue-50 border-0">
              Lihat Materi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
