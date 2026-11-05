"use client";

import React, { useRef } from "react";
import Image from "next/image";
import {
  Printer,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Award,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SiswaInfo {
  id: string;
  nis: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: string;
}

export interface PresensiItem {
  no: number;
  nisn: string;
  nis: string;
  nama: string;
  rombel: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  total: number;
  persentase: string;
}

export interface LaporanItem {
  id_laporan?: string;
  nama: string;
  nis: string;
  nisn: string;
  nilai_pengetahuan: number | null;
  nilai_keterampilan: number | null;
  rata_rata: number | null;
  catatan_wali: string;
  status_laporan: string;
}

export interface RekapRombelModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaKelas: string;
  jurusan: string;
  tingkat: number;
  teacherName: string;
  teacherNip?: string;
  semester?: string;
  tahunAjaran?: string;
  siswaList: SiswaInfo[];
  presensiList: PresensiItem[];
  laporanList: LaporanItem[];
}

export function RekapRombelModal({
  isOpen,
  onClose,
  namaKelas,
  jurusan,
  tingkat,
  teacherName,
  teacherNip = "1234292722091345",
  semester = "Semester Ganjil",
  tahunAjaran = "2026/2027",
  siswaList,
  presensiList,
  laporanList,
}: RekapRombelModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalSiswa = siswaList.length || presensiList.length || 3;
  const countLaki = siswaList.filter((s) => s.jenis_kelamin?.toLowerCase() === "laki-laki").length;
  const countPerempuan = siswaList.filter((s) => s.jenis_kelamin?.toLowerCase() === "perempuan").length;

  // Hitung siswa yang butuh perhatian khusus (alpa > 0 atau kehadiran < 80% atau nilai < 75)
  const siswaPerhatianKhusus = presensiList
    .map((p) => {
      const lap = laporanList.find((l) => l.nis === p.nis || l.nisn === p.nisn);
      const persenNum = parseFloat(p.persentase?.replace("%", "") || "100");
      const nilaiRata = lap?.rata_rata ?? null;

      const alasan: string[] = [];
      if (p.alpa > 0) alasan.push(`Tercatat ${p.alpa} kali alpa/tanpa keterangan`);
      if (persenNum < 80) alasan.push(`Persentase kehadiran di bawah 80% (${p.persentase})`);
      if (nilaiRata !== null && nilaiRata > 0 && nilaiRata < 75) alasan.push(`Rata-rata nilai ${nilaiRata} (di bawah KKM 75)`);
      if (p.terlambat > 1) alasan.push(`Sering terlambat (${p.terlambat} kali)`);

      return {
        nama: p.nama,
        nis: p.nis,
        nisn: p.nisn,
        alasan,
      };
    })
    .filter((s) => s.alasan.length > 0);

  // Status kelengkapan rapor
  const catatanTerisi = laporanList.filter(
    (l) => l.catatan_wali && l.catatan_wali.trim() !== ""
  ).length;
  const raporDisahkan = laporanList.filter(
    (l) => l.status_laporan === "DisahkanKurikulum"
  ).length;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    const tanggalCetak = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<style>
  body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid #94a3b8; padding: 6px 10px; }
  th { background-color: #1e3a8a; color: white; font-weight: bold; text-align: center; }
  .title-main { font-size: 14pt; font-weight: bold; text-align: center; }
  .subtitle { font-size: 11pt; text-align: center; color: #475569; }
  .sec-header { background-color: #e2e8f0; font-weight: bold; font-size: 11pt; padding: 6px; }
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .bold { font-weight: bold; }
  .badge-success { background-color: #dcfce7; color: #15803d; font-weight: bold; }
  .badge-warning { background-color: #fef3c7; color: #b45309; font-weight: bold; }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="7" class="title-main">LAPORAN REKAPITULASI PEMBINAAN KELAS (ROMBEL)</td>
    </tr>
    <tr>
      <td colspan="7" class="subtitle">SMA NEGERI 2 PADALARANG &bull; TAHUN AJARAN ${tahunAjaran}</td>
    </tr>
  </table>

  <table>
    <tr class="sec-header"><td colspan="4">I. IDENTITAS KELAS & WALI KELAS</td></tr>
    <tr>
      <td class="bold" width="25%">Rombongan Belajar (Kelas)</td>
      <td width="35%">${namaKelas} (Tingkat ${tingkat} - ${jurusan})</td>
      <td class="bold" width="20%">Semester</td>
      <td width="20%">${semester}</td>
    </tr>
    <tr>
      <td class="bold">Nama Wali Kelas</td>
      <td>${teacherName}</td>
      <td class="bold">Tahun Ajaran</td>
      <td>${tahunAjaran}</td>
    </tr>
    <tr>
      <td class="bold">NIP Wali Kelas</td>
      <td>${teacherNip}</td>
      <td class="bold">Tanggal Cetak</td>
      <td>${tanggalCetak}</td>
    </tr>
  </table>

  <table>
    <tr class="sec-header"><td colspan="5">II. JUMLAH SISWA TERDAFTAR</td></tr>
    <tr>
      <td class="bold">Total Siswa</td>
      <td colspan="4">${totalSiswa} Orang (${countLaki} Laki-laki, ${countPerempuan} Perempuan)</td>
    </tr>
    <tr>
      <th>No</th>
      <th>NIS</th>
      <th>NISN</th>
      <th>Nama Lengkap Peserta Didik</th>
      <th>Jenis Kelamin</th>
    </tr>
    ${siswaList
      .map(
        (s, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${s.nis || "-"}</td>
      <td>${s.nisn || "-"}</td>
      <td>${s.nama_lengkap}</td>
      <td class="text-center">${s.jenis_kelamin || "-"}</td>
    </tr>`
      )
      .join("")}
  </table>

  <table>
    <tr class="sec-header"><td colspan="8">III. REKAPITULASI KEHADIRAN SISWA</td></tr>
    <tr>
      <th>No</th>
      <th>Nama Siswa</th>
      <th>Hadir (H)</th>
      <th>Sakit (S)</th>
      <th>Izin (I)</th>
      <th>Alpa (A)</th>
      <th>Terlambat (T)</th>
      <th>Persentase Kehadiran</th>
    </tr>
    ${presensiList
      .map(
        (p, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${p.nama}</td>
      <td class="text-center">${p.hadir}</td>
      <td class="text-center">${p.sakit}</td>
      <td class="text-center">${p.izin}</td>
      <td class="text-center">${p.alpa}</td>
      <td class="text-center">${p.terlambat}</td>
      <td class="text-center bold">${p.persentase}</td>
    </tr>`
      )
      .join("")}
  </table>

  <table>
    <tr class="sec-header"><td colspan="6">IV. RINGKASAN PERKEMBANGAN NILAI MATA PELAJARAN</td></tr>
    <tr>
      <th>No</th>
      <th>Nama Siswa</th>
      <th>Nilai Pengetahuan</th>
      <th>Nilai Keterampilan</th>
      <th>Rata-rata Akhir</th>
      <th>Status Rapor</th>
    </tr>
    ${laporanList
      .map(
        (l, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td>${l.nama}</td>
      <td class="text-center">${l.nilai_pengetahuan ?? "-"}</td>
      <td class="text-center">${l.nilai_keterampilan ?? "-"}</td>
      <td class="text-center bold">${l.rata_rata ?? "-"}</td>
      <td class="text-center">${l.status_laporan || "Draf"}</td>
    </tr>`
      )
      .join("")}
  </table>

  <table>
    <tr class="sec-header"><td colspan="4">V. DAFTAR SISWA YANG MEMBUTUHKAN PERHATIAN KHUSUS</td></tr>
    ${
      siswaPerhatianKhusus.length === 0
        ? `<tr><td colspan="4" class="badge-success">Tidak ada siswa yang memerlukan perhatian khusus. Seluruh siswa berada dalam kategori aman.</td></tr>`
        : `
    <tr>
      <th>No</th>
      <th>Nama Siswa</th>
      <th>NIS</th>
      <th>Catatan / Alasan Perhatian Khusus</th>
    </tr>
    ${siswaPerhatianKhusus
      .map(
        (sk, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="bold">${sk.nama}</td>
      <td>${sk.nis}</td>
      <td style="color: #b45309;">${sk.alasan.join("; ")}</td>
    </tr>`
      )
      .join("")}
    `
    }
  </table>

  <table>
    <tr class="sec-header"><td colspan="3">VI. STATUS PENYELESAIAN RAPORT</td></tr>
    <tr>
      <td class="bold" width="35%">Catatan Wali Kelas</td>
      <td colspan="2">${catatanTerisi} dari ${totalSiswa} siswa telah diisi catatan (${Math.round(
      (catatanTerisi / (totalSiswa || 1)) * 100
    )}%)</td>
    </tr>
    <tr>
      <td class="bold">Status Pengesahan Kurikulum</td>
      <td colspan="2">${raporDisahkan} dari ${totalSiswa} siswa telah disahkan kurikulum</td>
    </tr>
  </table>

  <br/><br/>
  <table>
    <tr>
      <td colspan="3" class="text-center" width="50%">
        Mengetahui,<br/>
        Kepala SMA Negeri 2 Padalarang<br/><br/><br/><br/>
        <strong>Drs. Herman Wijaya, M.M</strong><br/>
        NIP. 196804121995011002
      </td>
      <td colspan="4" class="text-center" width="50%">
        Padalarang, ${tanggalCetak}<br/>
        Wali Kelas ${namaKelas}<br/><br/><br/><br/>
        <strong>${teacherName}</strong><br/>
        NIP. ${teacherNip}
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const blob = new Blob([htmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Laporan_Rekap_Rombel_${namaKelas.replace(/\s+/g, "_")}_${new Date().toISOString().substring(0, 10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      {/* Global CSS khusus untuk print agar hanya mencetak dokumen laporan */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #rekap-rombel-print-area,
          #rekap-rombel-print-area * {
            visibility: visible !important;
          }
          #rekap-rombel-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Header Dialog Modal */}
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Dokumen Rekapitulasi Rombel: {namaKelas}
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan resmi pembinaan kelas untuk arsip dan penyerahan ke sekolah
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadExcel}
                className="gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel (.xls)</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs bg-[#1E3A8A] hover:bg-blue-950 text-white"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Area Dokumen Resmi (Bisa di-print dan di-preview) */}
          <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white space-y-6">
            <div
              id="rekap-rombel-print-area"
              ref={printAreaRef}
              className="space-y-6 text-slate-900 font-sans"
            >
              {/* KOP RESMI SEKOLAH */}
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 relative shrink-0">
                    <Image
                      src="/logo-sman2.png"
                      alt="Logo SMAN 2 Padalarang"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Pemerintah Daerah Provinsi Jawa Barat &bull; Dinas Pendidikan
                    </h3>
                    <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                      SMA NEGERI 2 PADALARANG
                    </h1>
                    <p className="text-[11px] text-slate-600">
                      Jl. Cihaliwung No. 2, Kertamulya, Kec. Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-blue-950 border-t border-slate-300 pt-2 inline-block px-4">
                    LAPORAN REKAPITULASI PEMBINAAN KELAS (ROMBEL)
                  </h2>
                </div>
              </div>

              {/* 1. IDENTITAS KELAS, WALI KELAS, SEMESTER, TAHUN AJARAN */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  I. Identitas Kelas & Wali Kelas
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs px-2">
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Rombongan Belajar:</span>
                    <span className="font-bold text-slate-900">{namaKelas} (Tingkat {tingkat} - {jurusan})</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Semester:</span>
                    <span className="font-semibold text-slate-900">{semester}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Nama Wali Kelas:</span>
                    <span className="font-bold text-slate-900">{teacherName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Tahun Ajaran:</span>
                    <span className="font-semibold text-slate-900">{tahunAjaran}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">NIP Wali Kelas:</span>
                    <span className="text-slate-900">{teacherNip}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Tanggal Laporan:</span>
                    <span className="text-slate-900">{tanggalHariIni}</span>
                  </div>
                </div>
              </section>

              {/* 2. JUMLAH SISWA YANG TERDAFTAR */}
              <section className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    II. Jumlah Siswa Terdaftar
                  </h3>
                  <span className="text-xs font-bold text-blue-900">
                    Total: {totalSiswa} Siswa ({countLaki} Laki-laki, {countPerempuan} Perempuan)
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">NISN</th>
                        <th className="py-2 px-3">Nama Lengkap Peserta Didik</th>
                        <th className="py-2 px-3 text-center">Jenis Kelamin</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {siswaList.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono">{s.nis || "-"}</td>
                          <td className="py-2 px-3 font-mono">{s.nisn || "-"}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{s.nama_lengkap}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{s.jenis_kelamin || "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 3. REKAP KEHADIRAN SISWA */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  III. Rekapitulasi Kehadiran Siswa
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">Nama Peserta Didik</th>
                        <th className="py-2 px-2 text-center text-emerald-700">Hadir</th>
                        <th className="py-2 px-2 text-center text-blue-700">Sakit</th>
                        <th className="py-2 px-2 text-center text-amber-700">Izin</th>
                        <th className="py-2 px-2 text-center text-rose-700">Alpa</th>
                        <th className="py-2 px-2 text-center text-slate-600">Terlambat</th>
                        <th className="py-2 px-3 text-center">Persentase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {presensiList.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{p.nama}</td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700">{p.hadir}</td>
                          <td className="py-2 px-2 text-center text-blue-700">{p.sakit}</td>
                          <td className="py-2 px-2 text-center text-amber-700">{p.izin}</td>
                          <td className="py-2 px-2 text-center font-bold text-rose-700">{p.alpa}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{p.terlambat}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{p.persentase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 4. RINGKASAN PERKEMBANGAN NILAI MATA PELAJARAN */}
              <section className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    IV. Ringkasan Perkembangan Nilai Mata Pelajaran
                  </h3>
                  <span className="text-xs text-slate-600">
                    Status: <strong className="text-blue-900">8 / 12 Mapel Menyetor Nilai</strong>
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3 text-center">Nilai Pengetahuan</th>
                        <th className="py-2 px-3 text-center">Nilai Keterampilan</th>
                        <th className="py-2 px-3 text-center">Rata-Rata Akhir</th>
                        <th className="py-2 px-3 text-center">Status Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {laporanList.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{l.nama}</td>
                          <td className="py-2 px-3 text-center">{l.nilai_pengetahuan ?? "-"}</td>
                          <td className="py-2 px-3 text-center">{l.nilai_keterampilan ?? "-"}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-900">{l.rata_rata ?? "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {l.status_laporan === "DisahkanKurikulum" ? "Disahkan" : "Ditinjau Wali"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 5. DAFTAR SISWA YANG MEMBUTUHKAN PERHATIAN KHUSUS */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  V. Daftar Siswa Membutuhkan Perhatian Khusus
                </h3>
                {siswaPerhatianKhusus.length === 0 ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p>
                      <strong>Kondisi Rombel Aman:</strong> Tidak ada siswa yang memerlukan perhatian khusus mendesak.
                      Seluruh siswa memiliki tingkat kehadiran di atas batas aman (&ge;80%) dan tidak memiliki rekor alpa/pelanggaran berat.
                    </p>
                  </div>
                ) : (
                  <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-100/70 text-amber-900 font-semibold border-b border-amber-200">
                        <tr>
                          <th className="py-2 px-3 text-center w-12">No</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">NIS</th>
                          <th className="py-2 px-3">Catatan Evaluasi / Indikator Perhatian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {siswaPerhatianKhusus.map((sk, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-center font-medium">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{sk.nama}</td>
                            <td className="py-2 px-3 font-mono">{sk.nis}</td>
                            <td className="py-2 px-3 text-amber-900 font-medium">
                              {sk.alasan.join(" • ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* 6. STATUS PENYELESAIAN RAPORT */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  VI. Status Penyelesaian Raport
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Pengisian Catatan Wali Kelas:</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {catatanTerisi} dari {totalSiswa} Siswa Terisi (
                      {Math.round((catatanTerisi / (totalSiswa || 1)) * 100)}%)
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Pengesahan oleh Kurikulum:</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {raporDisahkan} dari {totalSiswa} Siswa Disahkan
                    </div>
                  </div>
                </div>
              </section>

              {/* KOLOM TANDA TANGAN RESMI */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
                <div className="space-y-16">
                  <p>
                    Mengetahui,<br />
                    Kepala SMA Negeri 2 Padalarang
                  </p>
                  <div>
                    <p className="font-bold underline">Drs. Herman Wijaya, M.M</p>
                    <p className="text-slate-500">NIP. 196804121995011002</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>
                    Padalarang, {tanggalHariIni}<br />
                    Wali Kelas {namaKelas}
                  </p>
                  <div>
                    <p className="font-bold underline">{teacherName}</p>
                    <p className="text-slate-500">NIP. {teacherNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Modal Action Buttons */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
            <span className="text-xs text-slate-500">
              Dokumen ini memuat data rekapitulasi kelas {namaKelas} terkini.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Tutup
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadExcel}
                className="gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs bg-[#1E3A8A] hover:bg-blue-950 text-white"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
