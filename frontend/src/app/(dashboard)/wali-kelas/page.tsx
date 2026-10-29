"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Award,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { getStoredUser, AuthUser } from "@/lib/auth";

export default function WaliKelasDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const teacherName = currentUser?.nama_lengkap || "Guru Pembina";
  const kelas = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelas = kelas?.nama_kelas || "XII IPA 1";
  const jurusan = kelas?.jurusan || "MIPA";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pembinaan Kelas: {namaKelas} 📋
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300/60">
              Wali Kelas
            </span>
            <span>•</span>
            <span className="font-semibold text-slate-800">{teacherName}</span>
            <span>•</span>
            <span>Tingkat {kelas?.tingkat || 12} ({jurusan})</span>
            <span>•</span>
            <span className="text-slate-500">Semester Ganjil 2026/2027</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/guru">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Buka Menu Mengajar</span>
            </Button>
          </Link>
          <Button variant="primary" size="sm" className="gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Unduh Rekap Rombel</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Siswa Binaan"
          value="32"
          subtitle={`Rombel ${namaKelas}`}
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Kehadiran Rombel"
          value="96.5%"
          subtitle="Rata-rata kehadiran bulan ini"
          icon={UserCheck}
          variant="success"
        />
        <MetricCard
          title="Progres Nilai Mapel"
          value="8 / 12"
          subtitle="Mapel telah menyetor nilai"
          icon={Award}
          variant="cyan"
        />
        <MetricCard
          title="Perhatian Khusus"
          value="2"
          subtitle="Siswa dengan catatan absensi"
          icon={AlertTriangle}
          variant="white"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-900" />
              Monitoring Kehadiran Siswa Hari Ini ({namaKelas})
            </h2>
            <span className="text-xs text-slate-500 font-medium">32 Siswa Terdaftar</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <div className="text-xl font-bold text-emerald-800">30</div>
                <div className="text-[11px] font-semibold text-emerald-700">Hadir</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60">
                <div className="text-xl font-bold text-blue-800">1</div>
                <div className="text-[11px] font-semibold text-blue-700">Sakit (S)</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                <div className="text-xl font-bold text-amber-800">1</div>
                <div className="text-[11px] font-semibold text-amber-700">Izin (I)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xl font-bold text-slate-800">0</div>
                <div className="text-[11px] font-semibold text-slate-600">Alfa (A)</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Data presensi direkapitulasi secara otomatis dari validasi guru pengampu mata pelajaran.
              </span>
              <button
                type="button"
                className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-3"
              >
                Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shadow-md flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-blue-200 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Dual Role: Pengajar & Pembina</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                Anda juga mengajar mata pelajaran?
              </h3>
              <p className="text-xs text-blue-100/80">
                Akses materi ajar, pembuatan tugas, dan input nilai mata pelajaran Anda di panel guru pengampu.
              </p>
            </div>
            <Link href="/guru">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-blue-950 hover:bg-blue-50 border-0 text-xs shrink-0 ml-4 font-semibold"
              >
                Ke Menu Guru
              </Button>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Progres Leger & Nilai Rapor
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
              Semester Ganjil
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Kelengkapan Nilai Mata Pelajaran</span>
                <span className="text-blue-900">67% (8/12)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-900 rounded-full w-2/3" />
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Catatan Wali Kelas</div>
                  <div className="text-[11px] text-slate-500">12 dari 32 siswa telah diisi catatan</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  Proses
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Pengesahan Kurikulum</div>
                  <div className="text-[11px] text-slate-500">Menunggu penyelesaian nilai seluruh guru</div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-semibold text-[10px]">
                  Terkunci
                </span>
              </div>
            </div>

            <Button className="w-full text-xs font-semibold shadow-xs" size="sm">
              Buka Buku Leger {namaKelas}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
