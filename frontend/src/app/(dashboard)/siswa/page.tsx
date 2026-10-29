import React from "react";
import { BookOpen, ClipboardList, CheckCircle2, UserCheck, Upload, Award } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";
import { Button } from "@/components/ui/button";

export default function SiswaDashboardPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Selamat Pagi, Laura 👏
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Kelas XII IPA 1 • Semester Ganjil 2025/2026
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Materi Dipelajari"
          value="24"
          subtitle="dari 36 materi"
          icon={BookOpen}
          variant="primary"
        />
        <MetricCard
          title="Tugas Selesai"
          value="18"
          subtitle="3 menunggu"
          icon={ClipboardList}
          variant="white"
        />
        <MetricCard
          title="Nilai Rata-rata"
          value="85"
          subtitle="Kuis selesai: 12"
          icon={Award}
          variant="success"
        />
        <MetricCard
          title="Kehadiran"
          value="95%"
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
                <p className="text-xs text-slate-500">Catat kehadiran hari ini</p>
              </div>
            </div>
            <Button size="sm" variant="secondary">
              Rekam
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
            <Button size="sm" variant="primary">
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
