"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, FolderX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubmitTugasDialog } from "@/components/modules/siswa/submit-tugas-dialog";
import { useSiswaTugas } from "@/hooks/useSiswaTugas";
import { cn, formatTanggal, getMapelBadgeClass } from "@/lib/utils";
import type { SiswaTugas } from "@/types/api";

function sisaWaktu(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Terlewat";
  const jam = Math.floor(diff / 3_600_000);
  if (jam < 1) return `${Math.max(1, Math.floor(diff / 60_000))} menit lagi`;
  if (jam < 48) return `${jam} jam lagi`;
  return `${Math.floor(jam / 24)} hari lagi`;
}

function skorClass(nilai: number) {
  if (nilai >= 85) return "bg-emerald-100 text-emerald-700";
  if (nilai >= 70) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

function TugasSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-28 rounded-2xl bg-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

export default function SiswaTugasPage() {
  const { data, isLoading, isError, refetch } = useSiswaTugas();
  const [tab, setTab] = useState<"aktif" | "dikumpulkan">("aktif");
  const [dipilih, setDipilih] = useState<SiswaTugas | null>(null);

  const { aktif, dikumpulkan, jumlahAktif, jumlahMendesak } = useMemo(() => {
    const semua = data ?? [];
    const belum = semua
      .filter((t) => t.status === "belum")
      // yang masih bisa dikumpulkan di atas, yang terlewat di bawah
      .sort(
        (a, b) =>
          Number(a.lewat_deadline) - Number(b.lewat_deadline) ||
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    const sudah = semua
      .filter((t) => t.status !== "belum")
      .sort(
        (a, b) =>
          new Date(b.pengumpulan?.submitted_at ?? 0).getTime() -
          new Date(a.pengumpulan?.submitted_at ?? 0).getTime(),
      );
    return {
      aktif: belum,
      dikumpulkan: sudah,
      jumlahAktif: belum.filter((t) => !t.lewat_deadline).length,
      jumlahMendesak: belum.filter((t) => t.mendesak).length,
    };
  }, [data]);

  const daftar = tab === "aktif" ? aktif : dikumpulkan;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Tugas</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Kumpulkan tugas sebelum batas waktu berakhir
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center">
          <p className="text-2xl font-bold text-amber-800">{jumlahAktif}</p>
          <p className="text-xs font-medium text-amber-700">Tugas aktif</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center">
          <p className="text-2xl font-bold text-red-700">{jumlahMendesak}</p>
          <p className="text-xs font-medium text-red-600">Mendesak</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">{dikumpulkan.length}</p>
          <p className="text-xs font-medium text-emerald-600">Selesai</p>
        </div>
      </div>

      <div className="inline-flex w-full sm:w-auto rounded-xl bg-slate-100 p-1">
        {(
          [
            ["aktif", "Tugas Aktif"],
            ["dikumpulkan", "Sudah Dikumpulkan"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === key ? "bg-white text-blue-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <TugasSkeleton />
      ) : isError ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-700">Gagal memuat tugas.</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : daftar.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 mt-3">
            {tab === "aktif" ? "Tidak ada tugas aktif" : "Belum ada tugas yang dikumpulkan"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {tab === "aktif"
              ? "Tugas baru dari guru akan muncul di sini."
              : "Tugas yang sudah kamu kumpulkan akan tampil di sini."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {daftar.map((t) => {
            const p = t.pengumpulan;
            return (
              <div
                key={t.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">{t.judul}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                          getMapelBadgeClass(t.nama_mapel),
                        )}
                      >
                        {t.nama_mapel}
                      </span>
                      <span className="text-xs text-slate-500">{t.nama_guru}</span>
                    </div>
                  </div>

                  {t.status === "belum" && t.mendesak && (
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      Mendesak
                    </span>
                  )}
                  {t.status === "belum" && t.lewat_deadline && (
                    <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600">
                      Terlewat
                    </span>
                  )}
                  {t.status === "dinilai" && p?.nilai != null && (
                    <span
                      className={cn(
                        "shrink-0 text-sm font-bold px-3 py-1 rounded-full",
                        skorClass(p.nilai),
                      )}
                    >
                      {p.nilai}
                    </span>
                  )}
                  {t.status === "dikumpulkan" && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Dikumpulkan
                    </span>
                  )}
                </div>

                {t.deskripsi && (
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{t.deskripsi}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                  <div className="space-y-0.5">
                    <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      Deadline: {formatTanggal(t.deadline, true)}
                      {t.status === "belum" && (
                        <span
                          className={cn(
                            "font-semibold",
                            t.lewat_deadline || t.mendesak ? "text-red-600" : "text-slate-600",
                          )}
                        >
                          • {sisaWaktu(t.deadline)}
                        </span>
                      )}
                    </p>
                    {t.format_file && (
                      <p className="text-xs text-slate-500">
                        Format berkas: <span className="font-medium text-slate-700 uppercase">{t.format_file}</span>
                      </p>
                    )}
                    {p && (
                      <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                        <FileText className="w-3.5 h-3.5" />
                        {p.nama_file} • dikumpulkan {formatTanggal(p.submitted_at, true)}
                      </p>
                    )}
                  </div>

                  {t.status === "belum" && !t.lewat_deadline && (
                    <Button size="sm" onClick={() => setDipilih(t)}>
                      Kumpulkan
                    </Button>
                  )}
                  {t.status === "dikumpulkan" && !t.lewat_deadline && (
                    <Button size="sm" variant="secondary" onClick={() => setDipilih(t)}>
                      Ganti jawaban
                    </Button>
                  )}
                </div>

                {p?.feedback_guru && (
                  <div className="mt-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-700">Catatan guru</p>
                    <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-line">{p.feedback_guru}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {dipilih && (
        <SubmitTugasDialog key={dipilih.id} tugas={dipilih} onClose={() => setDipilih(null)} />
      )}
    </div>
  );
}