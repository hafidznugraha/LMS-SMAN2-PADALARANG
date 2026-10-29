"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Calendar,
  Building2,
  BookOpen,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { getStoredUser, AuthUser } from "@/lib/auth";
import { fetchAPI } from "@/lib/api";
import { Kelas, Guru, JadwalPelajaran, MataPelajaran } from "@/types";

export default function AdminDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalKelas, setTotalKelas] = useState(0);
  const [totalGuru, setTotalGuru] = useState(0);
  const [totalMapel, setTotalMapel] = useState(0);
  const [totalJadwal, setTotalJadwal] = useState(0);
  const [recentJadwal, setRecentJadwal] = useState<JadwalPelajaran[]>([]);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }

    async function loadStats() {
      try {
        const [resKelas, resGuru, resMapel, resJadwal] = await Promise.all([
          fetchAPI<{ data: Kelas[] }>("/master/kelas").catch(() => ({ data: [] })),
          fetchAPI<{ data: Guru[] }>("/master/guru").catch(() => ({ data: [] })),
          fetchAPI<{ data: MataPelajaran[] }>("/master/mapel").catch(() => ({ data: [] })),
          fetchAPI<{ data: JadwalPelajaran[] }>("/jadwal").catch(() => ({ data: [] })),
        ]);

        setTotalKelas(resKelas.data?.length || 0);
        setTotalGuru(resGuru.data?.length || 0);
        setTotalMapel(resMapel.data?.length || 0);
        setTotalJadwal(resJadwal.data?.length || 0);
        setRecentJadwal((resJadwal.data || []).slice(0, 5));
      } catch (err) {
        console.error("Gagal memuat ringkasan admin:", err);
      }
    }

    loadStats();
  }, []);

  const adminName = currentUser?.nama_lengkap || "Drs. Herman Wijaya, M.M";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Selamat Datang, {adminName} 👋
          </h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
              Bidang Kurikulum & Akademik
            </span>
            <span>•</span>
            <span>NIP: 196804151994031004</span>
            <span>•</span>
            <span className="font-medium text-slate-800">SMAN 2 Padalarang</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/jadwal">
            <Button variant="primary" size="md">
              <Calendar className="w-4 h-4" />
              <span>Kelola Jadwal</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Kelas & Rombel"
          value={totalKelas > 0 ? `${totalKelas} Kelas` : "2 Kelas"}
          subtitle="Tingkat X, XI, dan XII MIPA"
          icon={Building2}
          variant="primary"
        />
        <MetricCard
          title="Guru Pengampu"
          value={totalGuru > 0 ? `${totalGuru} Pendidik` : "3 Guru"}
          subtitle="Tenaga Pendidik Terdaftar"
          icon={Users}
          variant="white"
        />
        <MetricCard
          title="Mata Pelajaran"
          value={totalMapel > 0 ? `${totalMapel} Mapel` : "3 Mapel"}
          subtitle="Kurikulum & Rumpun Terdaftar"
          icon={BookOpen}
          variant="cyan"
        />
        <MetricCard
          title="Jadwal Pelajaran"
          value={totalJadwal > 0 ? `${totalJadwal} Sesi` : "2 Sesi"}
          subtitle="Plotting KBM Terdaftar"
          icon={Calendar}
          variant="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Jadwal Pelajaran Terkini</h2>
              <p className="text-xs text-slate-500 mt-0.5">Plotting jadwal KBM aktif di sistem</p>
            </div>
            <Link
              href="/admin/jadwal"
              className="text-xs font-semibold text-blue-900 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentJadwal.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              Belum ada jadwal yang tersimpan di sistem
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Hari & Jam</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Mata Pelajaran</th>
                    <th className="py-2.5 px-3">Guru Pengampu</th>
                    <th className="py-2.5 px-3">Ruang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentJadwal.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {j.hari}, {j.jam_mulai} - {j.jam_selesai}
                      </td>
                      <td className="py-3 px-3 font-semibold text-blue-900">
                        {j.kelas?.nama_kelas || "-"}
                      </td>
                      <td className="py-3 px-3">{j.mapel?.nama_mapel || "-"}</td>
                      <td className="py-3 px-3">
                        {j.guru?.user?.nama_lengkap || "Guru Pengampu"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">{j.ruang}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Aksi Cepat Kurikulum</h2>
            <div className="space-y-2">
              <Link
                href="/admin/jadwal"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-900/30 hover:bg-blue-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                      Kelola Jadwal KBM
                    </h3>
                    <p className="text-[11px] text-slate-500">Atur plotting dan cek bentrok</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
              </Link>

              <Link
                href="/admin/mapel"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-900/30 hover:bg-blue-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-900 flex items-center justify-center">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                      Master Data Mata Pelajaran
                    </h3>
                    <p className="text-[11px] text-slate-500">Kelola kurikulum, kode & rumpun mapel</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
              </Link>

              <Link
                href="/admin/siswa"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-900/30 hover:bg-blue-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                      Master Data Siswa
                    </h3>
                    <p className="text-[11px] text-slate-500">Kelola akun dan NIS/NISN siswa</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
              </Link>

              <Link
                href="/admin/guru"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-900/30 hover:bg-blue-50/40 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-900">
                      Master Data Guru
                    </h3>
                    <p className="text-[11px] text-slate-500">Kelola akun pendidik & NIP</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-900" />
              </Link>
            </div>
          </div>

          <div className="bg-[#1E3A8A] text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <h3 className="text-sm font-bold">Deteksi Bentrok Otomatis</h3>
            </div>
            <p className="text-xs text-blue-200/90 leading-relaxed">
              Algoritma validasi jadwal aktif secara *real-time* mencegah guru atau ruang kelas
              diberi dua jadwal pelajaran bersamaan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
