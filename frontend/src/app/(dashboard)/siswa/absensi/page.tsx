"use client";

import React, { useState } from "react";
import { CalendarCheck, ChevronLeft, ChevronRight, Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAbsenMandiri, useSiswaAbsensi } from "@/hooks/useSiswaAbsensi";
import { cn } from "@/lib/utils";
import type { SiswaAbsensiRiwayat } from "@/types/api";

const STATUS = {
  hadir: { label: "Hadir", huruf: "H", dot: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-700" },
  terlambat: { label: "Terlambat", huruf: "T", dot: "bg-sky-600", pill: "bg-sky-100 text-sky-700" },
  sakit: { label: "Sakit", huruf: "S", dot: "bg-amber-400", pill: "bg-amber-100 text-amber-700" },
  izin: { label: "Izin", huruf: "I", dot: "bg-orange-500", pill: "bg-orange-100 text-orange-700" },
  alpa: { label: "Alpa", huruf: "A", dot: "bg-red-500", pill: "bg-red-100 text-red-700" },
} as const;
type StatusKey = keyof typeof STATUS;

const FALLBACK = { label: "-", huruf: "?", dot: "bg-slate-400", pill: "bg-slate-100 text-slate-600" };
const info = (s: string) => STATUS[s as StatusKey] ?? FALLBACK;

const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function shiftBulan(bulan: string, delta: number) {
  const [y, m] = bulan.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelBulan(bulan: string) {
  const [y, m] = bulan.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
    new Date(y, m - 1, 15),
  );
}

function hariTanggal(tgl: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${tgl}T00:00:00Z`));
}

function Kalender({
  bulan,
  hariIni,
  riwayat,
}: {
  bulan: string;
  hariIni: string;
  riwayat: SiswaAbsensiRiwayat[];
}) {
  const [y, m] = bulan.split("-").map(Number);
  const jumlahHari = new Date(y, m, 0).getDate();
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; 
  const peta = new Map(riwayat.map((r) => [r.tanggal, r]));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {NAMA_HARI.map((h, i) => (
          <div
            key={h}
            className={cn(
              "text-center text-[11px] font-semibold py-1",
              i >= 5 ? "text-red-400" : "text-slate-500",
            )}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`kosong-${i}`} />
        ))}
        {Array.from({ length: jumlahHari }, (_, i) => i + 1).map((d) => {
          const tgl = `${bulan}-${String(d).padStart(2, "0")}`;
          const rec = peta.get(tgl);
          const akhirPekan = (offset + d - 1) % 7 >= 5;
          const st = rec ? info(rec.status) : null;
          return (
            <div
              key={tgl}
              title={rec ? `${st!.label}${rec.waktu_masuk ? ` • ${rec.waktu_masuk}` : ""}` : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 min-h-12",
                akhirPekan ? "bg-slate-50 text-slate-400" : "bg-white text-slate-700",
                tgl === hariIni && "ring-2 ring-blue-500",
              )}
            >
              <span className="text-xs font-medium">{d}</span>
              {st ? (
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    st.dot,
                  )}
                >
                  {st.huruf}
                </span>
              ) : (
                <span className="w-6 h-6" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SiswaAbsensiPage() {
  const [bulan, setBulan] = useState<string | undefined>(undefined);
  const { data, isLoading, isError, refetch, isFetching } = useSiswaAbsensi(bulan);
  const mutation = useAbsenMandiri();

  const [pilihan, setPilihan] = useState<"hadir" | "sakit" | "izin">("hadir");
  const [keterangan, setKeterangan] = useState("");
  const [error, setError] = useState("");

  function kirim() {
    if (pilihan !== "hadir" && keterangan.trim().length < 3) {
      setError("Keterangan wajib diisi untuk sakit atau izin");
      return;
    }
    setError("");
    mutation.mutate(
      { status: pilihan, catatan: keterangan.trim() },
      {
        onSuccess: (hasil) => {
          toast.success(
            hasil.status === "terlambat"
              ? `Presensi tercatat: Terlambat (${hasil.waktu_masuk})`
              : `Presensi tercatat: ${info(hasil.status).label}`,
          );
          setKeterangan("");
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Gagal mencatat presensi"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-7 w-48 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-700">Gagal memuat data presensi.</p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const { hari_ini: hari, rekap } = data;
  const bulanIni = data.tanggal.slice(0, 7);
  const stHari = hari.sudah ? info(hari.status ?? "") : null;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Presensi</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">{hariTanggal(data.tanggal)}</p>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">Presensi Hari Ini</h3>
            <p className="text-xs text-slate-500">
              Jam masuk {data.jam_masuk} • lewat dari itu dicatat terlambat
            </p>
          </div>
        </div>

        {hari.sudah && stHari ? (
          <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-semibold px-3 py-1 rounded-full", stHari.pill)}>
              {stHari.label}
            </span>
            {hari.waktu_masuk && <span className="text-sm text-slate-600">pukul {hari.waktu_masuk}</span>}
            {hari.catatan && <span className="text-sm text-slate-500">• {hari.catatan}</span>}
          </div>
        ) : hari.bisa_absen ? (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(["hadir", "sakit", "izin"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPilihan(s);
                    setError("");
                  }}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors",
                    pilihan === s
                      ? "border-blue-900 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {info(s).label}
                </button>
              ))}
            </div>

            {pilihan !== "hadir" && (
              <div>
                <label htmlFor="keterangan" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keterangan (wajib)
                </label>
                <textarea
                  id="keterangan"
                  rows={2}
                  maxLength={255}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={pilihan === "sakit" ? "Contoh: demam, surat dokter menyusul" : "Contoh: acara keluarga"}
                  className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
                />
              </div>
            )}

            {error && (
              <p role="alert" className="text-xs font-medium text-red-600">
                {error}
              </p>
            )}

            <Button onClick={kirim} disabled={mutation.isPending} className="w-full sm:w-auto">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {pilihan === "hadir" ? "Absen Masuk" : "Kirim Keterangan"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3 text-sm text-slate-600">
            {hari.alasan ?? "Presensi belum tersedia"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {(["hadir", "terlambat", "sakit", "izin", "alpa"] as const).map((s) => (
          <div key={s} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{rekap[s]}</p>
            <p className="text-xs font-medium text-slate-500">{info(s).label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <CalendarCheck className="w-5 h-5 text-blue-900 shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 capitalize">{labelBulan(data.bulan)}</h3>
              <p className="text-xs text-slate-500">
                {rekap.total > 0 ? `Kehadiran ${rekap.persen}% dari ${rekap.total} hari tercatat` : "Belum ada data"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Bulan sebelumnya"
              onClick={() => setBulan(shiftBulan(data.bulan, -1))}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Bulan berikutnya"
              disabled={data.bulan >= bulanIni}
              onClick={() => setBulan(shiftBulan(data.bulan, 1))}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <Kalender bulan={data.bulan} hariIni={data.tanggal} riwayat={data.riwayat} />
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
          {(Object.keys(STATUS) as StatusKey[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className={cn(
                  "w-4 h-4 rounded-full text-[10px] font-bold text-white flex items-center justify-center",
                  STATUS[s].dot,
                )}
              >
                {STATUS[s].huruf}
              </span>
              {STATUS[s].label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <h3 className="text-base font-semibold text-slate-900 p-4 md:p-5 pb-3">Riwayat</h3>
        {data.riwayat.length === 0 ? (
          <p className="px-5 pb-6 text-sm text-slate-500">Belum ada presensi di bulan ini.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.riwayat.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 md:px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800">{hariTanggal(r.tanggal)}</p>
                  {r.catatan && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.catatan}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r.waktu_masuk && <span className="text-xs text-slate-500">{r.waktu_masuk}</span>}
                  <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", info(r.status).pill)}>
                    {info(r.status).label}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}