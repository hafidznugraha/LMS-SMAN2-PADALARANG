"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  CheckCircle2,
  UserCheck,
  Award,
  AlarmClock,
  Clock,
  MapPin,
  ArrowRight,
} from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { useSiswaDashboard } from "@/hooks/useSiswaDashboard";
import { useNotifikasi } from "@/hooks/useNotifikasi";
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
  onClick,
}: {
  icon: React.ElementType;
  judul: string;
  nilai: string;
  keterangan?: string;
  tone?: "default" | "warning";
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3.5 shadow-xs ${
        onClick ? "cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all" : ""
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
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
      {onClick && <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />}
    </div>
  );
}

export default function SiswaDashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSiswaDashboard();
  const { items: notifItems, markAsRead: markNotifRead } = useNotifikasi();

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
  const unreadMateriNotif = notifItems.find(
    (n) => !n.is_read && n.tipe?.toLowerCase() === "materi"
  );

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

      {unreadMateriNotif && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-2xl p-4.5 text-white shadow-md border border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 text-blue-200 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="inline-block text-[10px] font-bold tracking-wider uppercase bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full mb-1 border border-blue-400/20">
                Materi Baru Tersedia
              </span>
              <h4 className="text-sm font-bold text-white leading-snug truncate">
                {unreadMateriNotif.judul}
              </h4>
              <p className="text-xs text-blue-100/90 mt-0.5 line-clamp-1 leading-relaxed">
                {unreadMateriNotif.pesan}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              size="sm"
              className="bg-white text-blue-950 hover:bg-blue-50 font-bold shadow-xs cursor-pointer text-xs"
              onClick={() => {
                markNotifRead(unreadMateriNotif.id);
                router.push(unreadMateriNotif.tautan || "/siswa/materi");
              }}
            >
              <span>Pelajari Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

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
            onClick={() => router.push("/siswa/absensi")}
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
            onClick={() => router.push("/siswa/tugas")}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Jadwal Hari Ini</h3>
            <span className="text-xs text-slate-500">({data.hari_ini || "Hari ini"})</span>
          </div>
          <Link
            href="/siswa/jadwal"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Jadwal Mingguan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
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
