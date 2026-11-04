"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Users,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  Download,
  AlertCircle,
  PhoneCall,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { fetchAPI, getApiBaseUrl } from "@/lib/api";
import { getStoredToken } from "@/lib/auth";
import {
  AbsensiSummary,
  AbsensiRombelRekap,
  AbsensiPeringatanItem,
  AbsensiDetailItem,
} from "@/types";

export default function AdminAbsensiPage() {
  const [activeTab, setActiveTab] = useState<"rombel" | "peringatan" | "log">("rombel");
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRombelFilter, setSelectedRombelFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const [summaryData, setSummaryData] = useState<AbsensiSummary>({
    total_siswa: 12,
    rata_rata_kehadiran: 90.0,
    total_hadir_hari_ini: 10,
    total_sakit_hari_ini: 0,
    total_izin_hari_ini: 1,
    total_alpa_hari_ini: 0,
    total_terlambat_hari_ini: 1,
    tanggal_hari_ini: "2026-11-04",
    rombel_rekap: [],
  });

  const [alerts, setAlerts] = useState<AbsensiPeringatanItem[]>([]);
  const [detailLogs, setDetailLogs] = useState<AbsensiDetailItem[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rekapRes, alertsRes, logsRes] = await Promise.all([
        fetchAPI<{ data: AbsensiSummary }>("/absensi/rekap"),
        fetchAPI<{ data: AbsensiPeringatanItem[] }>("/absensi/peringatan"),
        fetchAPI<{ data: AbsensiDetailItem[] }>("/absensi/kelas/all"),
      ]);

      if (rekapRes && rekapRes.data) {
        setSummaryData(rekapRes.data);
      }
      if (alertsRes && alertsRes.data) {
        setAlerts(alertsRes.data);
      }
      if (logsRes && logsRes.data) {
        setDetailLogs(logsRes.data);
      }
    } catch {
      toast.error("Gagal memuat data presensi dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const token = getStoredToken();
      const res = await fetch(`${getApiBaseUrl()}/absensi/export-csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Gagal mengunduh berkas rekap presensi CSV");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rekap_presensi_sman2_padalarang_${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rekapitulasi presensi berhasil diunduh dalam format CSV");
    } catch (err: any) {
      toast.error(err?.message || "Gagal mengunduh CSV");
    } finally {
      setExporting(false);
    }
  };

  const filteredLogs = detailLogs.filter((log) => {
    const matchesSearch =
      log.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.nisn.includes(searchQuery) ||
      log.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRombel =
      selectedRombelFilter === "all" || log.nama_kelas === selectedRombelFilter;

    const matchesStatus =
      selectedStatusFilter === "all" || log.status === selectedStatusFilter;

    return matchesSearch && matchesRombel && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
            <span>Beranda</span>
            <span>/</span>
            <span>Kurikulum</span>
            <span>/</span>
            <span className="text-slate-600">Monitoring Presensi</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <UserCheck className="w-7 h-7 text-[#1E3A8A]" />
              Rekapitulasi Presensi Sekolah Lintas Kelas
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-[#1E3A8A] rounded-full border border-blue-200">
              FR-ABS-04
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Monitoring tingkat kehadiran harian, akumulasi absensi per rombongan belajar, dan sistem deteksi dini kedisiplinan siswa.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>{exporting ? "Mengunduh..." : "Ekspor Rekap CSV"}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 shadow-sm"
          >
            <Clock className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Rata-rata Kehadiran"
          value={`${summaryData.rata_rata_kehadiran}%`}
          subtitle="Tingkat partisipasi belajar sekolah"
          variant="cyan"
          icon={UserCheck}
        />

        <MetricCard
          title="Hadir Hari Ini"
          value={`${summaryData.total_hadir_hari_ini} Siswa`}
          subtitle={`Termasuk ${summaryData.total_terlambat_hari_ini} siswa terlambat`}
          variant="success"
          icon={CheckCircle2}
        />

        <MetricCard
          title="Sakit & Izin Hari Ini"
          value={`${summaryData.total_sakit_hari_ini + summaryData.total_izin_hari_ini} Siswa`}
          subtitle="Terkonfirmasi dengan surat keterangan"
          variant="white"
          icon={Clock}
        />

        <MetricCard
          title="Siswa Perlu Perhatian"
          value={`${alerts.length} Siswa`}
          subtitle="Alpa berturut-turut atau kehadiran < 85%"
          variant="primary"
          icon={ShieldAlert}
        />
      </div>

      {alerts.length > 0 && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Peringatan Dini Kedisiplinan Siswa: Ditemukan {alerts.length} Siswa Memerlukan Pembinaan
              </h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Terdapat siswa dengan akumulasi ketidakhadiran (alpa/bolos) yang melampaui ambang batas toleransi kurikulum. Tindakan proaktif bersama Wali Kelas dan Guru BK disarankan.
              </p>
            </div>
          </div>

          <Button
            variant="pill"
            size="sm"
            onClick={() => setActiveTab("peringatan")}
            className="shrink-0 self-start md:self-center"
          >
            <span>Tinjau Siswa Bermasalah</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("rombel")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "rombel"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Rekapitulasi per Rombel ({summaryData.rombel_rekap.length} Kelas)</span>
        </button>

        <button
          onClick={() => setActiveTab("peringatan")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "peringatan"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Deteksi Dini & Konseling ({alerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("log")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "log"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Log Presensi Harian Siswa</span>
        </button>
      </div>

      {activeTab === "rombel" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryData.rombel_rekap.map((rombel) => {
              const isLow = rombel.persen_kehadiran < 85;
              return (
                <div
                  key={rombel.kelas_id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900">{rombel.nama_kelas}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          {rombel.jurusan}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Wali Kelas: <span className="font-semibold text-slate-800">{rombel.wali_kelas}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-lg font-black ${
                          isLow ? "text-amber-600" : "text-emerald-700"
                        }`}
                      >
                        {rombel.persen_kehadiran}%
                      </span>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Kehadiran
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                      <span>Progres Kehadiran Rombel</span>
                      <span>{rombel.total_siswa} Peserta Didik</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full ${
                          isLow ? "bg-amber-500" : "bg-emerald-600"
                        }`}
                        style={{ width: `${Math.min(rombel.persen_kehadiran, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5 text-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Hadir</p>
                      <p className="text-xs font-bold text-slate-900">{rombel.hadir}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Sakit</p>
                      <p className="text-xs font-bold text-blue-800">{rombel.sakit}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Izin</p>
                      <p className="text-xs font-bold text-amber-700">{rombel.izin}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Alpa</p>
                      <p className={`text-xs font-bold ${rombel.alpa > 0 ? "text-red-600" : "text-slate-400"}`}>
                        {rombel.alpa}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Telat</p>
                      <p className="text-xs font-bold text-purple-700">{rombel.terlambat}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "peringatan" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Daftar Deteksi Dini & Rekomendasi Konseling BK
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Peserta didik dengan ketidakhadiran berulang atau persentase kehadiran di bawah ambang batas kelulusan rapor.
              </p>
            </div>
            <span className="text-xs px-3 py-1 bg-amber-50 text-amber-900 font-semibold rounded-full border border-amber-200 self-start md:self-auto">
              Total {alerts.length} Siswa Terdeteksi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">NISN / NIS</th>
                  <th className="px-5 py-3.5">Nama Peserta Didik</th>
                  <th className="px-5 py-3.5">Rombel & Wali</th>
                  <th className="px-5 py-3.5 text-center">Alpa</th>
                  <th className="px-5 py-3.5 text-center">S/I</th>
                  <th className="px-5 py-3.5 text-center">Presensi %</th>
                  <th className="px-5 py-3.5">Tingkat Risiko</th>
                  <th className="px-5 py-3.5">Catatan Indikasi Terakhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alerts.map((item) => (
                  <tr key={item.siswa_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap font-mono text-xs">
                      <p className="font-semibold text-slate-900">{item.nisn}</p>
                      <p className="text-slate-400">NIS: {item.nis}</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-bold text-slate-900">{item.nama_siswa}</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs">
                      <p className="font-semibold text-slate-800">{item.nama_kelas}</p>
                      <p className="text-slate-500">{item.wali_kelas}</p>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                        {item.jumlah_alpa}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-center text-xs text-slate-600 font-semibold">
                      {item.jumlah_sakit} S / {item.jumlah_izin} I
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-center">
                      <span
                        className={`text-sm font-bold ${
                          item.persen_kehadiran < 70
                            ? "text-red-600"
                            : item.persen_kehadiran < 85
                            ? "text-amber-600"
                            : "text-emerald-700"
                        }`}
                      >
                        {item.persen_kehadiran}%
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          item.tingkat_risiko.includes("Tinggi")
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{item.tingkat_risiko}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600 max-w-xs">
                      <p className="truncate" title={item.catatan_terakhir}>
                        {item.catatan_terakhir || "Belum ada catatan pembinaan"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "log" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, NISN, atau kelas..."
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={selectedRombelFilter}
                onChange={(e) => setSelectedRombelFilter(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="all">Semua Rombel</option>
                {summaryData.rombel_rekap.map((r) => (
                  <option key={r.kelas_id} value={r.nama_kelas}>
                    {r.nama_kelas}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-800"
              >
                <option value="all">Semua Status</option>
                <option value="hadir">Hadir</option>
                <option value="terlambat">Terlambat</option>
                <option value="sakit">Sakit</option>
                <option value="izin">Izin</option>
                <option value="alpa">Alpa</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">NISN</th>
                  <th className="px-5 py-3.5">Nama Peserta Didik</th>
                  <th className="px-5 py-3.5">Rombel</th>
                  <th className="px-5 py-3.5">Waktu Masuk</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Catatan / Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm">
                      Tidak ada catatan presensi yang sesuai dengan kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const statusBadgeClass = {
                      hadir: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      terlambat: "bg-purple-50 text-purple-700 border-purple-200",
                      sakit: "bg-blue-50 text-blue-700 border-blue-200",
                      izin: "bg-amber-50 text-amber-700 border-amber-200",
                      alpa: "bg-red-50 text-red-700 border-red-200",
                    }[log.status] || "bg-slate-50 text-slate-700 border-slate-200";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono font-semibold text-slate-900">
                          {log.tanggal}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-600">
                          {log.nisn}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-900">
                          {log.nama_siswa}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-800">
                          {log.nama_kelas}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-600">
                          {log.waktu_masuk || "-"}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${statusBadgeClass}`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">
                          {log.catatan || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
