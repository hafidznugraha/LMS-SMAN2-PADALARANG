"use client";

import React from "react";
import { BookOpen, ClipboardList, CheckCircle2, UserCheck, Award, AlarmClock, Clock, MapPin } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { useSiswaDashboard } from "@/hooks/useSiswaDashboard";
import { sapaan } from "@/lib/utils";

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-xl bg-slate-200 animate-pulse" />
        <div className="h-4 w-48 rounded-xl bg-slate-200 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  judul,
  nilai,
  keterangan,
  tone = "default",
}: {
  icon: React.ElementType;
  judul: string;
  nilai: string;
  keterangan?: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shadow-xs">
      <div
        className={
          tone === "warning"
            ? "w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0"
            : "w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0"
        }
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{judul}</p>
        <p className="text-sm font-bold text-slate-900">{nilai}</p>
        {keterangan && <p className="text-xs text-slate-500 mt-0.5">{keterangan}</p>}
      </div>
    </div>
  );
}

export default function SiswaDashboardPage() {
  const { data, isLoading, isError, refetch } = useSiswaDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <div className="max-w-6xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-700">Gagal memuat dashboard.</p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const namaDepan = data.nama_lengkap.split(" ")[0];
  const periode = data.semester ? ` • Semester ${data.semester} ${data.tahun_ajaran}` : "";

  const sudahAbsen = data.absen_hari_ini.sudah;
  const statusAbsen = data.absen_hari_ini.status
    ? data.absen_hari_ini.status.charAt(0).toUpperCase() + data.absen_hari_ini.status.slice(1)
    : "";
  const jamAbsen = data.absen_hari_ini.waktu_masuk?.slice(0, 5);

  const jadwal = data.jadwal_hari_ini ?? [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          {sapaan()}, {namaDepan} 👏
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Kelas {data.nama_kelas || "-"}
          {periode}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Materi Tersedia"
          value={data.materi_tersedia}
          subtitle={`${data.jumlah_mapel} mata pelajaran`}
          icon={BookOpen}
          variant="primary"
        />
        <MetricCard
          title="Tugas Selesai"
          value={data.tugas_selesai}
          subtitle={
            data.tugas_mendesak > 0
              ? `${data.tugas_menunggu} menunggu • ${data.tugas_mendesak} mendesak`
              : `${data.tugas_menunggu} menunggu`
          }
          icon={ClipboardList}
          variant="white"
        />
        <MetricCard
          title="Nilai Rata-rata"
          value={data.rata_rata_nilai ?? "-"}
          subtitle={`${data.tugas_dinilai} tugas dinilai`}
          icon={Award}
          variant="success"
        />
        <MetricCard
          title="Kehadiran"
          value={data.hari_tercatat > 0 ? `${data.kehadiran_persen}%` : "-"}
          subtitle="Bulan ini"
          icon={CheckCircle2}
          variant="white"
        />
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Ringkasan Hari Ini</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow
            icon={UserCheck}
            judul="Absensi hari ini"
            nilai={sudahAbsen ? statusAbsen : "Belum tercatat"}
            keterangan={sudahAbsen && jamAbsen ? `Tercatat pukul ${jamAbsen} WIB` : undefined}
          />
          <InfoRow
            icon={AlarmClock}
            judul="Tugas yang menunggu"
            nilai={`${data.tugas_menunggu} tugas`}
            keterangan={
              data.tugas_mendesak > 0
                ? `${data.tugas_mendesak} tenggat dalam 48 jam`
                : "Tidak ada tenggat dalam 48 jam"
            }
            tone={data.tugas_mendesak > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Jadwal Hari Ini</h3>
          <span className="text-xs text-slate-500">{data.hari_ini}</span>
        </div>

        {jadwal.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-700">Tidak ada jadwal pelajaran hari ini.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {jadwal.map((j) => {
              const berlangsung = j.status === "berlangsung";
              const selesai = j.status === "selesai";
              return (
                <li
                  key={j.id}
                  className={
                    "bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-xs " +
                    (berlangsung ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200/80") +
                    (selesai ? " opacity-60" : "")
                  }
                >
                  <div className="shrink-0 w-[68px] text-center">
                    <p className="text-sm font-bold text-slate-900">{j.jam_mulai}</p>
                    <p className="text-xs text-slate-500">{j.jam_selesai}</p>
                  </div>
                  <div className="min-w-0 flex-1 border-l border-slate-200 pl-4">
                    <p className="text-sm font-bold text-slate-900 truncate">{j.nama_mapel}</p>
                    <p className="text-xs text-slate-500 truncate">{j.nama_guru}</p>
                    {j.ruang && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {j.ruang}
                      </p>
                    )}
                  </div>
                  <span
                    className={
                      "shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full " +
                      (berlangsung
                        ? "bg-blue-100 text-blue-800"
                        : selesai
                          ? "bg-slate-100 text-slate-500"
                          : "bg-amber-50 text-amber-700")
                    }
                  >
                    <Clock className="w-3 h-3" />
                    {berlangsung ? "Berlangsung" : selesai ? "Selesai" : "Akan datang"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}