"use client";

import { getStoredUser, AuthUser } from "@/lib/auth";
import { fetchAPI } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { UserCheck, Calendar, ArrowLeft, Loader2, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AbsensiItem {
  id: string;
  id_absensi: string;
  nama_siswa: string;
  nis: string;
  status_kehadiran: string;
  waktu: string;
  keterangan: string;
}

export default function KehadiranKelasPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalSiswa, setTotalSiswa] = useState<number>(0);
  const [absensiList, setAbsensiList] = useState<AbsensiItem[]>([]);
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

        const [siswaRes, absensiRes] = await Promise.all([
          fetchAPI<{ success: boolean; data: any[] }>(
            `/master/siswa?kelas_id=${encodeURIComponent(kelasIdBinaan)}`
          ),
          fetchAPI<{ success: boolean; data: AbsensiItem[] }>(
            `/guru/absensi?kelas_id=${encodeURIComponent(kelasIdBinaan)}`
          ),
        ]);

        if (siswaRes.success && Array.isArray(siswaRes.data)) {
          setTotalSiswa(siswaRes.data.length);
        } else {
          setTotalSiswa(0);
        }

        if (absensiRes.success && Array.isArray(absensiRes.data)) {
          setAbsensiList(absensiRes.data);
        } else {
          setAbsensiList([]);
        }
      } catch (err) {
        console.error("Gagal memuat data kehadiran:", err);
        setTotalSiswa(0);
        setAbsensiList([]);
      } finally {
        setLoading(false);
      }
    };

    if (kelasIdBinaan) {
      fetchKehadiranData();
    } else {
      setTotalSiswa(0);
      setAbsensiList([]);
      setLoading(false);
    }
  }, [kelasIdBinaan]);

  const hadirCount = absensiList.filter((a) => a.status_kehadiran.toLowerCase() === "hadir").length;
  const sakitCount = absensiList.filter((a) => a.status_kehadiran.toLowerCase() === "sakit").length;
  const izinCount = absensiList.filter((a) => a.status_kehadiran.toLowerCase() === "izin").length;
  const alfaCount = absensiList.filter(
    (a) => a.status_kehadiran.toLowerCase() === "alfa" || a.status_kehadiran.toLowerCase() === "alpa"
  ).length;

  const displayTotal = totalSiswa > 0 ? totalSiswa : absensiList.length;

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

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-blue-900" />
            <span>Rekapitulasi Kehadiran Hari Ini</span>
          </div>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Total Siswa Terdaftar: {loading ? "..." : displayTotal} Orang
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Memuat data presensi dari server...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-800">{hadirCount}</div>
                <div className="text-xs font-semibold text-emerald-700 mt-1">Hadir (H)</div>
              </div>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-800">{sakitCount}</div>
                <div className="text-xs font-semibold text-blue-700 mt-1">Sakit (S)</div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <div className="text-2xl font-bold text-amber-800">{izinCount}</div>
                <div className="text-xs font-semibold text-amber-700 mt-1">Izin (I)</div>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <div className="text-2xl font-bold text-rose-800">{alfaCount}</div>
                <div className="text-xs font-semibold text-rose-700 mt-1">Alfa (A)</div>
              </div>
            </div>

            {absensiList.length > 0 && (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 mt-4">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">NIS</th>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {absensiList.map((item) => {
                      const st = item.status_kehadiran.toLowerCase();
                      const badgeClass =
                        st === "hadir"
                          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                          : st === "sakit"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : st === "izin"
                          ? "bg-amber-100 text-amber-700 border-amber-200"
                          : "bg-rose-100 text-rose-700 border-rose-200";

                      return (
                        <tr key={item.id_absensi || item.nis} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-800">{item.nama_siswa}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{item.nis || "-"}</td>
                          <td className="py-3 px-4 flex items-center gap-1 text-slate-500">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.waktu || "-"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}
                            >
                              {item.status_kehadiran}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 truncate max-w-xs">
                            {item.keterangan || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
