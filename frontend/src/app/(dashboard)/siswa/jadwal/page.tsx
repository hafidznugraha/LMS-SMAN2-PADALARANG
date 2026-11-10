"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  BookOpen,
  ClipboardList,
  CalendarCheck2,
  Coffee,
  ArrowRight,
  Info
} from "lucide-react";
import { useSiswaJadwal } from "@/hooks/useSiswaJadwal";
import { cn, getMapelBadgeClass, formatNamaWithGelar } from "@/lib/utils";
import type { SiswaJadwalItem } from "@/types/api";

const DAFTAR_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

function getHariIni(): "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu" | "Minggu" {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
  const dayIdx = new Date().getDay();
  return days[dayIdx];
}

function cekStatusSesi(hari: string, jamMulai: string, jamSelesai: string): "berlangsung" | "akan_datang" | "selesai" | "beda_hari" {
  const hariIni = getHariIni();
  if (hari !== hariIni) return "beda_hari";

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

  // Normalisasi format jam (e.g., 07:00 atau 07:00:00 -> 07:00)
  const start = jamMulai.slice(0, 5);
  const end = jamSelesai.slice(0, 5);

  if (currentTime >= start && currentTime <= end) {
    return "berlangsung";
  }
  if (currentTime < start) {
    return "akan_datang";
  }
  return "selesai";
}

function hitungDurasiMenit(jamMulai: string, jamSelesai: string): number {
  try {
    const [startH, startM] = jamMulai.slice(0, 5).split(":").map(Number);
    const [endH, endM] = jamSelesai.slice(0, 5).split(":").map(Number);
    const diff = (endH * 60 + endM) - (startH * 60 + startM);
    return diff > 0 ? diff : 90;
  } catch {
    return 90;
  }
}

function JadwalSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="h-7 w-60 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-4 w-80 rounded-xl bg-slate-200 animate-pulse" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 w-24 rounded-xl bg-slate-200 animate-pulse shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function SiswaJadwalPage() {
  const hariIni = getHariIni();
  // Jika hari Minggu, defaultkan ke Senin agar siswa melihat jadwal besok
  const defaultTab = hariIni === "Minggu" ? "Senin" : hariIni;
  const [selectedHari, setSelectedHari] = useState<string>(defaultTab);

  const { data, isLoading, isError, refetch } = useSiswaJadwal();

  const allItems: SiswaJadwalItem[] = useMemo(() => {
    return Array.isArray(data?.items) ? data.items : [];
  }, [data]);

  const filteredItems = useMemo(() => {
    if (selectedHari === "Semua") return allItems;
    return allItems.filter((item) => item.hari.toLowerCase() === selectedHari.toLowerCase());
  }, [allItems, selectedHari]);

  // Cari sesi yang sedang berlangsung hari ini
  const sesiBerlangsung = useMemo(() => {
    if (hariIni === "Minggu") return null;
    return allItems.find((item) => cekStatusSesi(item.hari, item.jam_mulai, item.jam_selesai) === "berlangsung");
  }, [allItems, hariIni]);

  // Hitung jumlah sesi per hari
  const countsPerHari = useMemo(() => {
    const map: Record<string, number> = { Semua: allItems.length };
    DAFTAR_HARI.forEach((h) => {
      map[h] = allItems.filter((i) => i.hari.toLowerCase() === h.toLowerCase()).length;
    });
    return map;
  }, [allItems]);

  if (isLoading) return <JadwalSkeleton />;

  if (isError) {
    return (
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">Gagal memuat jadwal pelajaran.</p>
        <p className="text-xs text-slate-500">Terjadi gangguan saat mengambil data jadwal dari server.</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-semibold hover:bg-blue-800 transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const namaKelas = data?.nama_kelas || "Kelas Siswa";

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <span>Jadwal Pelajaran</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Rombel {namaKelas}
            </span>
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Jadwal kegiatan belajar mengajar resmi yang diatur oleh tim Kurikulum SMAN 2 Padalarang
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200/90 rounded-2xl px-3.5 py-2 shadow-2xs">
          <CalendarIcon className="w-4 h-4 text-blue-900" />
          <span className="text-xs font-bold text-slate-800">
            Hari Ini: <span className="text-blue-950 font-extrabold">{hariIni}</span>
          </span>
        </div>
      </div>

      {/* Banner Sesi Sedang Berlangsung (Jika Ada) */}
      {sesiBerlangsung && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-md">
                  Sedang Berlangsung Sekarang
                </span>
                <span className="text-xs font-mono font-bold">
                  {sesiBerlangsung.jam_mulai.slice(0, 5)} - {sesiBerlangsung.jam_selesai.slice(0, 5)} WIB
                </span>
              </div>
              <h4 className="text-base font-extrabold mt-0.5">{sesiBerlangsung.nama_mapel}</h4>
              <p className="text-xs text-emerald-100">
                Pendidik: {formatNamaWithGelar(sesiBerlangsung.nama_guru, sesiBerlangsung.gelar_guru)} • Ruangan: {sesiBerlangsung.ruang || "Ruang Kelas"}
              </p>
            </div>
          </div>

          <Link
            href={`/siswa/materi`}
            className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-xs flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Akses Materi</span>
          </Link>
        </div>
      )}

      {/* Tab Filter Hari */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setSelectedHari("Semua")}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
            selectedHari === "Semua"
              ? "bg-[#142d72] text-white shadow-xs"
              : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80"
          )}
        >
          <span>Semua Hari</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
              selectedHari === "Semua" ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
            )}
          >
            {countsPerHari["Semua"] || 0}
          </span>
        </button>

        {DAFTAR_HARI.map((hari) => {
          const isActive = selectedHari.toLowerCase() === hari.toLowerCase();
          const isToday = hari.toLowerCase() === hariIni.toLowerCase();
          const count = countsPerHari[hari] || 0;

          return (
            <button
              key={hari}
              onClick={() => setSelectedHari(hari)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5",
                isActive
                  ? "bg-[#142d72] text-white shadow-xs"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80"
              )}
            >
              <span>{hari}</span>
              {isToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Hari Ini" />
              )}
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive ? "bg-white/25 text-white" : "bg-slate-100 text-slate-600"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Daftar Kartu Jadwal */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
            {selectedHari === "Minggu" ? (
              <Coffee className="w-7 h-7 text-amber-500" />
            ) : (
              <CalendarCheck2 className="w-7 h-7 text-slate-400" />
            )}
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-800">
              {selectedHari === "Minggu"
                ? "Hari Minggu (Libur Akhir Pekan)"
                : `Tidak Ada Jadwal Pelajaran untuk Hari ${selectedHari}`}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              {selectedHari === "Minggu"
                ? "Tidak ada kegiatan belajar mengajar pada hari libur. Manfaatkan waktu untuk beristirahat atau mempelajari materi pembelajaran berikutnya."
                : `Belum ada sesi pembelajaran yang dijadwalkan oleh Kurikulum untuk kelas ${namaKelas} pada hari ${selectedHari}.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item, idx) => {
            const statusSesi = cekStatusSesi(item.hari, item.jam_mulai, item.jam_selesai);
            const durasi = hitungDurasiMenit(item.jam_mulai, item.jam_selesai);
            const badgeMapel = getMapelBadgeClass(item.nama_mapel);

            return (
              <div
                key={item.id || idx}
                className={cn(
                  "bg-white rounded-2xl border p-5 transition-all shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md",
                  statusSesi === "berlangsung"
                    ? "border-emerald-500 ring-2 ring-emerald-100 bg-emerald-50/20"
                    : "border-slate-200/90"
                )}
              >
                {/* Bagian Atas: Hari, Jam, Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.hari}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)} WIB
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">({durasi} mnt)</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 leading-snug pt-1">
                      {item.nama_mapel}
                    </h3>
                  </div>

                  {/* Status Pill */}
                  {statusSesi === "berlangsung" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300 animate-pulse shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Sedang Belajar
                    </span>
                  )}
                  {statusSesi === "akan_datang" && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 shrink-0">
                      Akan Datang
                    </span>
                  )}
                  {statusSesi === "selesai" && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium shrink-0">
                      Selesai
                    </span>
                  )}
                </div>

                {/* Bagian Tengah: Guru & Ruangan */}
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <span className="font-semibold">{formatNamaWithGelar(item.nama_guru, item.gelar_guru)}</span>
                      {item.nip_guru && item.nip_guru !== "-" && (
                        <span className="text-[10px] text-slate-400 font-mono block">NIP: {item.nip_guru}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-slate-600 truncate">
                      Ruang: <strong className="text-slate-900 font-bold">{item.ruang || "Ruang Kelas"}</strong>
                    </span>
                  </div>
                </div>

                {/* Bagian Bawah: Pintasan Aksi */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md border", badgeMapel)}>
                    {item.kode_mapel || "MAPEL"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/siswa/materi?search=${encodeURIComponent(item.nama_mapel)}`}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/90 transition-colors flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3 text-slate-500" />
                      <span>Materi</span>
                    </Link>

                    <Link
                      href={`/siswa/tugas`}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200/90 transition-colors flex items-center gap-1"
                    >
                      <ClipboardList className="w-3 h-3 text-slate-500" />
                      <span>Tugas</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
