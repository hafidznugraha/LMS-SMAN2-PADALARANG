"use client";

import { getStoredUser, AuthUser } from "@/lib/auth";
import { fetchAPI } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { UserCheck, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function KehadiranKelasPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

    const kelas = currentUser?.extra?.kelas_binaan?.[0];
    const namaKelas = kelas?.nama_kelas || "X IPS 2";
    const kelasIdBinaan = kelas?.id || "";

  useEffect(() => {
  const fetchKehadiranData = async () => {
    try {
      setLoading(true);

      const response = await fetchAPI<{
        success: boolean;
        data: any[];
      }>(
        `/master/siswa?kelas_id=${encodeURIComponent(kelasIdBinaan)}`
      );

      if (response.success && Array.isArray(response.data)) {
        setTotalSiswa(response.data.length);
      } else {
        setTotalSiswa(0);
      }
    } catch (err) {
      console.error("Gagal memuat data kehadiran:", err);
      setTotalSiswa(0);
    } finally {
      setLoading(false);
    }
  };

  if (kelasIdBinaan) {
    fetchKehadiranData();
  } else {
    setTotalSiswa(0);
    setLoading(false);
  }
}, [kelasIdBinaan]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            Kehadiran Kelas Binaan: {namaKelas}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi presensi harian siswa berdasarkan validasi guru pengampu mata pelajaran.
          </p>
        </div>
        <Link href="/wali-kelas">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ringkasan</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-900" />
            <span>Rekapitulasi Kehadiran Hari Ini</span>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Total Siswa Terdaftar: {loading ? "..." : totalSiswa} Orang
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Memuat data presensi dari server...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-800">{totalSiswa}</div>
              <div className="text-xs font-semibold text-emerald-700 mt-1">Hadir (H)</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">0</div>
              <div className="text-xs font-semibold text-blue-700 mt-1">Sakit (S)</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-2xl font-bold text-amber-800">0</div>
              <div className="text-xs font-semibold text-amber-700 mt-1">Izin (I)</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="text-2xl font-bold text-rose-800">0</div>
              <div className="text-xs font-semibold text-rose-700 mt-1">Alfa (A)</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}