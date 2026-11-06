"use client";

import React from "react";
import Link from "next/link";
import { Award, FileText, FolderX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiswaNilai, useSiswaRaporList } from "@/hooks/useSiswaNilai";
import { cn, formatTanggal, getMapelBadgeClass } from "@/lib/utils";

const JENIS: Record<string, string> = {
  Tugas: "Tugas",
  UlanganHarian: "Ulangan Harian",
  UTS: "UTS",
  UAS: "UAS",
};

const angka = (n: number | null | undefined) =>
  n == null ? "-" : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(n);

function skorClass(n: number) {
  if (n >= 85) return "bg-emerald-100 text-emerald-700";
  if (n >= 70) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function SiswaNilaiPage() {
  const nilai = useSiswaNilai();
  const rapor = useSiswaRaporList();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Nilai & Rapor</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Hasil belajar kamu per mata pelajaran</p>
      </div>

      {/* Rapor */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-800">Rapor Semester</h3>
        {rapor.isLoading ? (
          <div className="h-20 rounded-2xl bg-slate-200 animate-pulse" />
        ) : rapor.isError ? (
          <p className="text-sm text-red-600">Gagal memuat daftar rapor.</p>
        ) : (rapor.data ?? []).length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm text-slate-600">
            Belum ada rapor yang disahkan. Rapor akan muncul di sini setelah disahkan oleh Kurikulum.
          </div>
        ) : (
          rapor.data!.map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    Semester {r.semester} {r.tahun_ajaran}
                  </p>
                  <p className="text-xs text-slate-500">
                    Rata-rata {angka(r.rata_rata)} • Predikat {r.predikat || "-"}
                    {r.disahkan_pada ? ` • Disahkan ${formatTanggal(r.disahkan_pada)}` : ""}
                  </p>
                </div>
              </div>
              <Link href={`/siswa/rapor/${r.id}`}>
                <Button size="sm">Lihat Rapor</Button>
              </Link>
            </div>
          ))
        )}
      </section>

      {/* Nilai */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Nilai per Mata Pelajaran</h3>
          {nilai.data?.rata_rata != null && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-900">
              <Award className="w-3.5 h-3.5" />
              Rata-rata {angka(nilai.data.rata_rata)}
            </span>
          )}
        </div>

        {nilai.isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : nilai.isError ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-700">Gagal memuat nilai.</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => nilai.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : nilai.data!.mapel.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-800 mt-3">Belum ada nilai</p>
            <p className="text-xs text-slate-500 mt-1">Nilai dari guru akan tampil di sini.</p>
          </div>
        ) : (
          nilai.data!.mapel.map((m) => (
            <div key={m.mapel_id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-3 p-4">
                <span
                  className={cn(
                    "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                    getMapelBadgeClass(m.nama_mapel),
                  )}
                >
                  {m.nama_mapel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rata-rata</span>
                  <span className={cn("text-sm font-bold px-3 py-1 rounded-full", skorClass(m.rata_rata))}>
                    {angka(m.rata_rata)} • {m.predikat}
                  </span>
                </div>
              </div>
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {m.items.map((it) => (
                  <li key={it.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">{JENIS[it.jenis] ?? it.jenis}</p>
                        <p className="text-xs text-slate-500">{formatTanggal(it.created_at)}</p>
                      </div>
                      <span className={cn("text-sm font-bold px-3 py-1 rounded-full", skorClass(it.skor))}>
                        {angka(it.skor)}
                        {it.huruf ? ` • ${it.huruf}` : ""}
                      </span>
                    </div>
                    {it.feedback && <p className="text-xs text-slate-500 mt-1.5">{it.feedback}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}