"use client";

import { getStoredUser, AuthUser } from "@/lib/auth";
import { fetchAPI } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { UserCheck, Calendar, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AbsensiItem {
  siswa_id: string;
  tanggal: string;
  status: string;
}

export default function KehadiranKelasPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [rekapKehadiran, setRekapKehadiran] = useState({
  hadir: 0,
  sakit: 0,
  izin: 0,
  alfa: 0,
  terlambat: 0,
});
  const [dataAbsensi, setDataAbsensi] = useState<AbsensiItem[]>([]);
  const [tanggalAbsensi, setTanggalAbsensi] = useState("");
  const daftarTanggal = [
    ...new Set(dataAbsensi.map((item) => item.tanggal)),
  ].sort((a, b) => b.localeCompare(a));
  useEffect(() => {
  const rekap = {
    hadir: 0,
    sakit: 0,
    izin: 0,
    alfa: 0,
    terlambat: 0,
  };

  dataAbsensi
    .filter((item) => item.tanggal === tanggalAbsensi)
    .forEach((item) => {
      const status = item.status.toLowerCase();

      if (status === "hadir") rekap.hadir++;
      else if (status === "sakit") rekap.sakit++;
      else if (status === "izin") rekap.izin++;
      else if (status === "alpa" || status === "alfa") rekap.alfa++;
      else if (status === "terlambat") rekap.terlambat++;
    });

  setRekapKehadiran(rekap);
}, [tanggalAbsensi, dataAbsensi]);
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
        const absensiResponse = await fetchAPI<{
          success: boolean;
          data: AbsensiItem[];
        }>(
          `/absensi/kelas/${encodeURIComponent(kelasIdBinaan)}`
        );

        console.log("Data absensi kelas:", absensiResponse.data);

        if (absensiResponse.success && Array.isArray(absensiResponse.data)) {
         setDataAbsensi(absensiResponse.data);
         const tanggalTerbaru = absensiResponse.data
            .map((item) => item.tanggal)
            .sort()
            .reverse()[0];

          setTanggalAbsensi(tanggalTerbaru || "");
      
        } else {
          setDataAbsensi([]);
        }
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
            <span>Rekapitulasi Kehadiran
                  {tanggalAbsensi
                    ? ` (${tanggalAbsensi})`
                    : " (Belum Ada Data)"}</span>
          </div>

          <select
            value={tanggalAbsensi}
            onChange={(e) => setTanggalAbsensi(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {daftarTanggal.map((tanggal) => (
              <option key={tanggal} value={tanggal}>
                {tanggal}
              </option>
            ))}
          </select>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-800">{rekapKehadiran.hadir}</div>
              <div className="text-xs font-semibold text-emerald-700 mt-1">Hadir (H)</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="text-2xl font-bold text-blue-800">{rekapKehadiran.sakit}</div>
              <div className="text-xs font-semibold text-blue-700 mt-1">Sakit (S)</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="text-2xl font-bold text-amber-800">{rekapKehadiran.izin}</div>
              <div className="text-xs font-semibold text-amber-700 mt-1">Izin (I)</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <div className="text-2xl font-bold text-rose-800">{rekapKehadiran.alfa}</div>
              <div className="text-xs font-semibold text-rose-700 mt-1">Alfa (A)</div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200">
            <div className="text-2xl font-bold text-orange-800">
              {rekapKehadiran.terlambat}
            </div>
            <div className="text-xs font-semibold text-orange-700 mt-1">
              Terlambat (T)
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}