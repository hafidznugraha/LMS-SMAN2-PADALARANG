"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ClipboardList, CheckCircle2, UserCheck, Upload, Award, Calendar, Clock, ArrowRight } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";
import { useSiswaDashboard } from "@/hooks/useSiswaDashboard";
import { useSiswaJadwal } from "@/hooks/useSiswaJadwal";
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

export default function SiswaDashboardPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useSiswaDashboard();

  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
  const namaHariIni = days[new Date().getDay()];
  const { data: jadwalData } = useSiswaJadwal(namaHariIni);

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
  const jadwalHariIni = Array.isArray(jadwalData?.items) ? jadwalData.items : [];

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
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Aksi Cepat</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Absen Masuk</h4>
                <p className="text-xs text-slate-500">
                  {sudahAbsen
                    ? `Tercatat: ${statusAbsen}${jamAbsen ? ` • ${jamAbsen}` : ""}`
                    : "Catat kehadiran hari ini"}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={sudahAbsen}
              onClick={() => router.push("/siswa/absensi")}
            >
              {sudahAbsen ? "Tercatat" : "Rekam"}
            </Button>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Upload Tugas</h4>
                <p className="text-xs text-slate-500">Kumpulkan tugas yang sudah selesai</p>
              </div>
            </div>
            <Button size="sm" variant="primary" onClick={() => router.push("/siswa/tugas")}>
              Kirim
            </Button>
          </div>
        </div>
      </div>

      {/* Widget Jadwal Pelajaran Hari Ini */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#142d72]" />
            <h3 className="text-sm font-semibold text-slate-800">
              Jadwal Pelajaran Hari Ini ({namaHariIni})
            </h3>
          </div>
          <Link
            href="/siswa/jadwal"
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
          >
            <span>Lihat Jadwal Mingguan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {jadwalHariIni.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-500 shadow-xs">
            {namaHariIni === "Minggu"
              ? "Hari Minggu libur akhir pekan. Tidak ada sesi kegiatan belajar mengajar hari ini."
              : `Belum ada sesi pelajaran yang dijadwalkan untuk hari ${namaHariIni}.`}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {jadwalHariIni.map((j) => (
              <div
                key={j.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-400 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1 font-mono font-bold text-slate-800 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-blue-900" />
                      {j.jam_mulai.slice(0, 5)} - {j.jam_selesai.slice(0, 5)} WIB
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                      {j.ruang || "Ruang Kelas"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">
                    {j.nama_mapel}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 truncate">
                    {j.nama_guru}
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    {j.kode_mapel}
                  </span>
                  <Link
                    href={`/siswa/materi?search=${encodeURIComponent(j.nama_mapel)}`}
                    className="text-[11px] font-semibold text-blue-700 hover:underline"
                  >
                    Buka Materi &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}