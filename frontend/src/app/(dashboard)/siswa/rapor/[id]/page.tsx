"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiswaRapor } from "@/hooks/useSiswaNilai";
import { formatTanggal } from "@/lib/utils";

const angka = (n: number | null | undefined) =>
  n == null ? "-" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

const CETAK_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  body > *:not(.print-portal) { display: none !important; }
  .print-portal { position: static !important; overflow: visible !important; background: #fff !important; }
}
`;

export default function RaporPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: r, isLoading, isError } = useSiswaRapor(id);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isi = isLoading ? (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /> Memuat rapor...
    </div>
  ) : isError || !r ? (
    <div className="py-24 text-center">
      <p className="text-sm text-slate-700">Rapor tidak ditemukan atau belum disahkan.</p>
      <Button className="mt-3" size="sm" variant="secondary" onClick={() => router.push("/siswa/nilai")}>
        Kembali
      </Button>
    </div>
  ) : (
    <article className="bg-white mx-auto max-w-[210mm] p-6 sm:p-10 text-slate-900 shadow-sm print:shadow-none print:p-0 text-[13px] leading-relaxed">
      <header className="text-center border-b-2 border-slate-900 pb-3">
        {r.nama_sekolah && <h1 className="text-lg font-bold uppercase">{r.nama_sekolah}</h1>}
        {(r.alamat_sekolah || r.telepon_sekolah) && (
          <p className="text-xs text-slate-600">
            {[r.alamat_sekolah, r.telepon_sekolah && `Telp. ${r.telepon_sekolah}`].filter(Boolean).join(" • ")}
          </p>
        )}
      </header>

      <h2 className="text-center font-bold mt-4 uppercase tracking-wide">Laporan Hasil Belajar (Rapor)</h2>
      <p className="text-center text-xs text-slate-600">
        Semester {r.semester} • Tahun Ajaran {r.tahun_ajaran}
      </p>

      <dl className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto_1fr] gap-x-3 gap-y-1 mt-4">
        <dt className="text-slate-500">Nama</dt>
        <dd className="font-semibold">{r.nama_siswa}</dd>
        <dt className="text-slate-500">Kelas</dt>
        <dd className="font-semibold">{r.kelas || "-"}</dd>
        <dt className="text-slate-500">NIS / NISN</dt>
        <dd className="font-semibold">
          {r.nis} / {r.nisn}
        </dd>
        <dt className="text-slate-500">Wali Kelas</dt>
        <dd className="font-semibold">{r.wali_kelas || "-"}</dd>
      </dl>

      <h3 className="font-bold mt-5 mb-1.5">A. Nilai Mata Pelajaran</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100">
              {["No", "Mata Pelajaran", "Tugas", "UH", "UTS", "UAS", "Nilai Akhir", "Predikat"].map((h) => (
                <th key={h} className="border border-slate-400 px-2 py-1.5 text-center font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.nilai_mapel.length === 0 ? (
              <tr>
                <td colSpan={8} className="border border-slate-400 px-2 py-3 text-center text-slate-500">
                  Belum ada nilai pada semester ini.
                </td>
              </tr>
            ) : (
              r.nilai_mapel.map((m, i) => (
                <tr key={m.kode}>
                  <td className="border border-slate-400 px-2 py-1.5 text-center">{i + 1}</td>
                  <td className="border border-slate-400 px-2 py-1.5">{m.nama}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center">{angka(m.tugas)}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center">{angka(m.uh)}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center">{angka(m.uts)}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center">{angka(m.uas)}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center font-semibold">{angka(m.nilai_akhir)}</td>
                  <td className="border border-slate-400 px-2 py-1.5 text-center font-semibold">{m.predikat}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50">
              <td colSpan={6} className="border border-slate-400 px-2 py-1.5 text-right font-semibold">
                Rata-rata akhir
              </td>
              <td className="border border-slate-400 px-2 py-1.5 text-center font-bold">{angka(r.rata_rata)}</td>
              <td className="border border-slate-400 px-2 py-1.5 text-center font-bold">{r.predikat || "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {(r.nilai_pengetahuan != null || r.nilai_keterampilan != null) && (
        <p className="text-xs text-slate-600 mt-1.5">
          Pengetahuan: <b>{angka(r.nilai_pengetahuan)}</b> • Keterampilan: <b>{angka(r.nilai_keterampilan)}</b>
        </p>
      )}

      {r.deskripsi_nilai && (
        <>
          <h3 className="font-bold mt-5 mb-1">B. Deskripsi Capaian</h3>
          <p className="border border-slate-400 rounded px-3 py-2">{r.deskripsi_nilai}</p>
        </>
      )}

      <h3 className="font-bold mt-5 mb-1.5">{r.deskripsi_nilai ? "C" : "B"}. Kehadiran</h3>
      <table className="border-collapse text-xs">
        <tbody>
          {[
            ["Sakit", r.kehadiran.sakit],
            ["Izin", r.kehadiran.izin],
            ["Tanpa keterangan (Alpa)", r.kehadiran.alpa],
          ].map(([label, nilai]) => (
            <tr key={label as string}>
              <td className="border border-slate-400 px-3 py-1.5">{label}</td>
              <td className="border border-slate-400 px-3 py-1.5 text-center w-20">{nilai} hari</td>
            </tr>
          ))}
          <tr>
            <td className="border border-slate-400 px-3 py-1.5 font-semibold">Persentase kehadiran</td>
            <td className="border border-slate-400 px-3 py-1.5 text-center font-semibold">
              {r.kehadiran.total > 0 ? `${r.kehadiran.persen}%` : "-"}
            </td>
          </tr>
        </tbody>
      </table>

      {r.catatan_wali && (
        <>
          <h3 className="font-bold mt-5 mb-1">{r.deskripsi_nilai ? "D" : "C"}. Catatan Wali Kelas</h3>
          <p className="border border-slate-400 rounded px-3 py-2">{r.catatan_wali}</p>
        </>
      )}

      <div className="grid grid-cols-2 gap-6 mt-10 text-center text-xs break-inside-avoid">
        <div>
          <p>Wali Kelas</p>
          <div className="h-16" />
          <p className="font-semibold underline">{r.wali_kelas || "........................"}</p>
          {r.wali_nip && <p>NIP. {r.wali_nip}</p>}
        </div>
        <div>
          <p>Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-semibold underline">{r.kepala_sekolah || "........................"}</p>
          {r.nip_kepala_sekolah && <p>NIP. {r.nip_kepala_sekolah}</p>}
        </div>
      </div>

      {r.disahkan_pada && (
        <p className="text-[11px] text-slate-500 text-center mt-6">
          Disahkan {formatTanggal(r.disahkan_pada, true)}
          {r.disahkan_oleh ? ` oleh ${r.disahkan_oleh}` : ""}
        </p>
      )}
    </article>
  );

  return createPortal(
    <div className="print-portal fixed inset-0 z-[100] overflow-auto bg-slate-100 print:bg-white">
      <style>{CETAK_CSS}</style>
      <div className="print:hidden sticky top-0 z-10 flex items-center justify-between gap-2 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3">
        <Button variant="secondary" size="sm" onClick={() => router.push("/siswa/nilai")}>
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Button>
        <Button size="sm" onClick={() => window.print()} disabled={!r}>
          <Printer className="w-4 h-4" /> Cetak / Simpan PDF
        </Button>
      </div>
      <div className="p-3 sm:p-6 print:p-0">{isi}</div>
    </div>,
    document.body,
  );
}