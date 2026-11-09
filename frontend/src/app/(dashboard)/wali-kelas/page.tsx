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
  Loader2,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { getStoredUser, getStoredToken, AuthUser } from "@/lib/auth";
import { formatNamaWithGelar } from "@/lib/utils";
import { getApiBaseUrl, fetchAPI } from "@/lib/api";
import {
  RekapRombelModal,
  SiswaInfo,
  PresensiItem,
  LaporanItem,
} from "@/components/modals/RekapRombelModal";

export default function WaliKelasDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [totalSiswa, setTotalSiswa] = useState<number | null>(null);
  const [catatanCount, setCatatanCount] = useState<number>(0);
  const [isRekapModalOpen, setIsRekapModalOpen] = useState<boolean>(false);

  const [siswaList, setSiswaList] = useState<SiswaInfo[]>([]);
  const [presensiList, setPresensiList] = useState<PresensiItem[]>([]);
  
  const [absensiHarian, setAbsensiHarian] = useState<
    { tanggal: string; status: string }[]
  >([]);

  const [laporanList, setLaporanList] = useState<LaporanItem[]>([]);
  const [progresNilai, setProgresNilai] = useState({
  total_mapel: 0,
  mapel_lengkap: 0,
  persentase: 0,
});
  const [loadingData, setLoadingData] = useState<boolean>(false);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const teacherGelar = (currentUser?.extra?.gelar as string) || "";
  const teacherName = currentUser?.nama_lengkap
    ? formatNamaWithGelar(currentUser.nama_lengkap, teacherGelar)
    : "Guru Pembina";
  const teacherNip = (currentUser?.extra as any)?.nip || "1234292722091345";
  const kelas = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelas = kelas?.nama_kelas || "X IPS 2";
  const jurusan = kelas?.jurusan || "IPS";
  const tingkat = kelas?.tingkat || 10;
  const kelasId = kelas?.id;

  useEffect(() => {
    if (!kelasId) return;

    const loadRealData = async () => {
      try {
        setLoadingData(true);
        const token = getStoredToken();

        // 1. Ambil data master siswa di rombel
        const resSiswa = await fetchAPI<{ success: boolean; data: any[] }>(
          `/master/siswa?kelas_id=${encodeURIComponent(kelasId)}`
        );
        if (resSiswa?.success && Array.isArray(resSiswa.data)) {
          setTotalSiswa(resSiswa.data.length);
          const mapped: SiswaInfo[] = resSiswa.data.map((s) => ({
            id: s.id,
            nis: s.nis || "",
            nisn: s.nisn || "",
            nama_lengkap: s.user?.nama_lengkap || s.nama || "-",
            jenis_kelamin: s.jenis_kelamin || "-",
          }));
          setSiswaList(mapped);
        }
        
        const resProgresNilai = await fetchAPI<{
          success: boolean;
          data: {
            total_mapel: number;
            mapel_lengkap: number;
            persentase: number;
          };
        }>(`/laporan/progres-nilai/${encodeURIComponent(kelasId)}`);

        console.log("Data progres nilai kelas:", resProgresNilai);

        if (resProgresNilai.success && resProgresNilai.data) {
          setProgresNilai(resProgresNilai.data);
        }

        // 2. Ambil data laporan akademik (leger/raport)
        const resLaporan = await fetchAPI<{ success: boolean; data: any[] }>(
          `/laporan/kelas/${encodeURIComponent(kelasId)}`
        );
        if (resLaporan?.success && Array.isArray(resLaporan.data)) {
          console.log("DATA LAPORAN DARI API:", resLaporan.data);
          const filled = resLaporan.data.filter(
            (l: any) => l.catatan_wali && l.catatan_wali.trim() !== ""
          ).length;
          setCatatanCount(filled);
          setLaporanList(
            resLaporan.data.map((l: any) => ({
              id_laporan: l.id_laporan,
              nama: l.nama || "-",
              nis: l.nis || "",
              nisn: l.nisn || "",
              nilai_pengetahuan: l.pengetahuan ?? null,
              nilai_keterampilan: l.keterampilan ?? null,
              rata_rata: l.rata_rata,
              catatan_wali: l.catatan_wali || "",
              status_laporan: l.status_laporan || "Draf",
            }))
          );
        }
        
        
        const resAbsensiHarian = await fetchAPI<{
          success: boolean;
          data: { tanggal: string; status: string }[];
        }>(
          `/absensi/kelas/${encodeURIComponent(kelasId)}`
        );

        if (
          resAbsensiHarian.success &&
          Array.isArray(resAbsensiHarian.data)
        ) {
          setAbsensiHarian(resAbsensiHarian.data);
        } else {
          setAbsensiHarian([]);
        }

        // 3. Ambil data presensi rombel dari endpoint export-csv
        const resAbsensi = await fetch(
          `${getApiBaseUrl()}/absensi/export-csv?kelas_id=${encodeURIComponent(kelasId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (resAbsensi.ok) {
          const rawCsv = await resAbsensi.text();
          const lines = rawCsv.split(/\r?\n/).filter((l) => l.trim() !== "");
          if (lines.length > 1) {
            const rows = lines.slice(1);
            const targetLower = (namaKelas || "").toLowerCase();
            const filteredRows = rows.filter((row) => {
              const cols = row.split(",");
              return (
                (cols[4] || "").toLowerCase().includes(targetLower) ||
                row.toLowerCase().includes(targetLower)
              );
            });

            const parsed: PresensiItem[] = filteredRows.map((row, idx) => {
              const cols = row.split(",");
              return {
                no: idx + 1,
                nisn: cols[1]?.trim() || "",
                nis: cols[2]?.trim() || "",
                nama: cols[3]?.trim() || "",
                rombel: cols[4]?.trim() || namaKelas,
                hadir: parseInt(cols[5]) || 0,
                sakit: parseInt(cols[6]) || 0,
                izin: parseInt(cols[7]) || 0,
                alpa: parseInt(cols[8]) || 0,
                terlambat: parseInt(cols[9]) || 0,
                total: parseInt(cols[10]) || 0,
                persentase: cols[11]?.trim() || "100%",
              };
            });
            setPresensiList(parsed);
          }
        }
      } catch (err) {
        console.error("Gagal memuat statistik riil rombel:", err);
      } finally {
        setLoadingData(false);
      }
    };

    loadRealData();
  }, [kelasId, namaKelas]);

  const displayTotal = totalSiswa !== null ? totalSiswa : 3;
  
  const totalHadirRombel = presensiList.reduce(
    (total, siswa) => total + siswa.hadir + siswa.terlambat,
    0
  );

  const totalPresensiRombel = presensiList.reduce(
    (total, siswa) => total + siswa.total,
    0
  );

  const persentaseKehadiranRombel =
    totalPresensiRombel > 0
      ? `${Math.round((totalHadirRombel / totalPresensiRombel) * 100)}%`
      : "-";
    
  const jumlahPerhatianKhusus = presensiList.filter((siswa) => {
    if (siswa.total === 0) return false;

    const persentase =
      ((siswa.hadir + siswa.terlambat) / siswa.total) * 100;

    return persentase < 80;
  }).length;

  
  const jumlahRaporDisahkan = laporanList.filter(
    (laporan) => laporan.status_laporan === "DisahkanKurikulum"
  ).length;

  const totalRapor = laporanList.length;

  const semuaRaporDisahkan =
    totalRapor > 0 && jumlahRaporDisahkan === totalRapor;

  
  const tanggalHariIni = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Jakarta",
  });

  const dataHariIni = absensiHarian.filter(
    (item) => item.tanggal === tanggalHariIni
  );

  const rekapHariIni = {
    hadir: dataHariIni.filter(
      (item) => item.status.toLowerCase() === "hadir"
    ).length,
    sakit: dataHariIni.filter(
      (item) => item.status.toLowerCase() === "sakit"
    ).length,
    izin: dataHariIni.filter(
      (item) => item.status.toLowerCase() === "izin"
    ).length,
    alfa: dataHariIni.filter(
      (item) => ["alfa", "alpa"].includes(item.status.toLowerCase())
    ).length,
    terlambat: dataHariIni.filter(
      (item) => item.status.toLowerCase() === "terlambat"
    ).length,
  };


  return (
    <div className="space-y-6">
      {/* Modal Laporan Rekap Rombel Resmi */}
      <RekapRombelModal
        isOpen={isRekapModalOpen}
        onClose={() => setIsRekapModalOpen(false)}
        namaKelas={namaKelas}
        jurusan={jurusan}
        tingkat={tingkat}
        teacherName={teacherName}
        teacherNip={teacherNip}
        semester="Semester Ganjil"
        tahunAjaran="2026/2027"
        siswaList={siswaList}
        presensiList={presensiList}
        laporanList={laporanList}
        progresNilai={progresNilai}
      />

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
            <span>Tingkat {tingkat} ({jurusan})</span>
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
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5 bg-[#1E3A8A] hover:bg-blue-950 text-white shadow-xs"
            onClick={() => setIsRekapModalOpen(true)}
          >
            <FileText className="w-4 h-4" />
            <span>Unduh Rekap Rombel</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Siswa Binaan"
          value={String(displayTotal)}
          subtitle={`Rombel ${namaKelas}`}
          icon={Users}
          variant="primary"
        />
        
        <MetricCard
          title="Kehadiran Rombel"
          value={persentaseKehadiranRombel}
          subtitle="Rata-rata kehadiran dari data tersedia"
          icon={UserCheck}
          variant="success"
        />

        
        <MetricCard
          title="Progres Nilai Mapel"
          value={`${progresNilai.mapel_lengkap} / ${progresNilai.total_mapel}`}
          subtitle="Mapel dengan nilai seluruh siswa lengkap"
          icon={Award}
          variant="cyan"
        />

        <MetricCard
          title="Perhatian Khusus"
          value={String(jumlahPerhatianKhusus)}
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
            <span className="text-xs text-slate-500 font-medium">{displayTotal} Siswa Terdaftar</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                <div className="text-xl font-bold text-emerald-800">
                  {rekapHariIni.hadir}
                </div>
                <div className="text-[11px] font-semibold text-emerald-700">Hadir</div>
              </div>
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200/60">
                <div className="text-xl font-bold text-blue-800">
                  {rekapHariIni.sakit}
                </div>
                <div className="text-[11px] font-semibold text-blue-700">Sakit (S)</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60">
                <div className="text-xl font-bold text-amber-800">
                  {rekapHariIni.izin}
                </div>
                <div className="text-[11px] font-semibold text-amber-700">Izin (I)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="text-xl font-bold text-slate-800">
                  {rekapHariIni.alfa}
                </div>
                <div className="text-[11px] font-semibold text-slate-600">Alfa (A)</div>
              </div>
            </div>

            
            {!loadingData && dataHariIni.length === 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Belum ada data presensi untuk hari ini ({tanggalHariIni}).
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Data presensi harian siswa yang dikelola dan divalidasi oleh Anda selaku Wali Kelas.
              </span>
              <Link
                href="/wali-kelas/kehadiran"
                className="font-bold text-blue-900 hover:text-blue-700 flex items-center gap-1 shrink-0 ml-3"
              >
                Lihat Detail <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
              <span className="text-slate-700">
                Kelengkapan Nilai Mata Pelajaran
              </span>
              <span className="text-blue-900">
                {Math.round(progresNilai.persentase)}% ({progresNilai.mapel_lengkap}/{progresNilai.total_mapel})
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-blue-900 rounded-full transition-all duration-300"
                style={{ width: `${progresNilai.persentase}%` }}
              />
            </div>
          </div>


            <div className="space-y-2.5 pt-2">
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Catatan Wali Kelas</div>
                  <div className="text-[11px] text-slate-500">
                    {catatanCount} dari {displayTotal} siswa telah diisi catatan
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[10px]">
                  {catatanCount === displayTotal ? "Selesai" : "Proses"}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">Pengesahan Kurikulum</div>
                  
                  <div className="text-[11px] text-slate-500">
                    {totalRapor > 0
                      ? `${jumlahRaporDisahkan} dari ${totalRapor} rapor siswa telah disahkan Kurikulum`
                      : "Belum ada data rapor siswa"}
                  </div>

                </div>
                
                <span
                  className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${
                    semuaRaporDisahkan
                      ? "bg-green-100 text-green-800"
                      : jumlahRaporDisahkan > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {semuaRaporDisahkan
                    ? "Selesai"
                    : jumlahRaporDisahkan > 0
                    ? "Sebagian Disahkan"
                    : "Belum Disahkan"}
                </span>

              </div>
            </div>

            <Link href="/wali-kelas/raport" className="w-full block">
              <Button className="w-full text-xs font-semibold shadow-xs" size="sm">
                Buka Buku Leger {namaKelas}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
