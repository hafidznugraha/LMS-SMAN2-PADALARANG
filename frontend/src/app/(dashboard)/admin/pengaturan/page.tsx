"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Calendar,
  Building,
  UserCheck,
  Clock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Globe,
  Mail,
  Phone,
  MapPin,
  School,
  Lock,
  Award,
  Sliders,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { fetchAPI } from "@/lib/api";
import { PengaturanSekolah } from "@/types";

export default function PengaturanSekolahPage() {
  const [activeTab, setActiveTab] = useState<"akademik" | "profil" | "pejabat" | "kbm" | "penilaian" | "dapodik">("akademik");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncingDapodik, setSyncingDapodik] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [formData, setFormData] = useState<PengaturanSekolah>({
    id: "",
    nama_sekolah: "SMA Negeri 2 Padalarang",
    npsn: "20227927",
    akreditasi: "A",
    alamat: "Jalan Raya Padalarang No. 45, Kertajaya, Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553",
    telepon: "(022) 6806123",
    email: "info@sman2padalarang.sch.id",
    website: "https://sman2padalarang.sch.id",
    kepala_sekolah: "",
    nip_kepala_sekolah: "",
    waka_kurikulum: "",
    nip_waka_kurikulum: "",
    tahun_ajaran_aktif: "2026/2027",
    semester_aktif: "Ganjil",
    tenggat_kunci_raport: "2026-12-24",
    durasi_kbm_menit: 45,
    jam_masuk: "07:00",
    jam_pulang: "15:30",
    status_sinkronisasi_dapodik: "Terhubung",
    terakhir_sinkron: "",
    kkm_default: 75,
    bobot_tugas: 30,
    bobot_uh: 20,
    bobot_uts: 25,
    bobot_uas: 25,
    batas_predikat_a: 85,
    batas_predikat_b: 75,
    batas_predikat_c: 65,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAPI<{ data: PengaturanSekolah }>("/pengaturan");
      if (res && res.data) {
        const item = res.data;
        let formattedDeadline = "2026-12-24";
        if (item.tenggat_kunci_raport) {
          formattedDeadline = item.tenggat_kunci_raport.substring(0, 10);
        }
        let formattedMasuk = item.jam_masuk || "07:00";
        if (formattedMasuk.length > 5) formattedMasuk = formattedMasuk.substring(0, 5);
        let formattedPulang = item.jam_pulang || "15:30";
        if (formattedPulang.length > 5) formattedPulang = formattedPulang.substring(0, 5);

        setFormData({
          ...item,
          tenggat_kunci_raport: formattedDeadline,
          jam_masuk: formattedMasuk,
          jam_pulang: formattedPulang,
          kkm_default: item.kkm_default !== undefined && item.kkm_default !== null ? Number(item.kkm_default) : 75,
          bobot_tugas: item.bobot_tugas !== undefined && item.bobot_tugas !== null ? Number(item.bobot_tugas) : 30,
          bobot_uh: item.bobot_uh !== undefined && item.bobot_uh !== null ? Number(item.bobot_uh) : 20,
          bobot_uts: item.bobot_uts !== undefined && item.bobot_uts !== null ? Number(item.bobot_uts) : 25,
          bobot_uas: item.bobot_uas !== undefined && item.bobot_uas !== null ? Number(item.bobot_uas) : 25,
          batas_predikat_a: item.batas_predikat_a !== undefined && item.batas_predikat_a !== null ? Number(item.batas_predikat_a) : 85,
          batas_predikat_b: item.batas_predikat_b !== undefined && item.batas_predikat_b !== null ? Number(item.batas_predikat_b) : 75,
          batas_predikat_c: item.batas_predikat_c !== undefined && item.batas_predikat_c !== null ? Number(item.batas_predikat_c) : 65,
        });
      }
    } catch {
      toast.error("Gagal memuat pengaturan dari server, menggunakan data tersimpan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (field: keyof PengaturanSekolah, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const kkm = Number(formData.kkm_default ?? 75);
      const bobotTugas = Number(formData.bobot_tugas ?? 30);
      const bobotUH = Number(formData.bobot_uh ?? 20);
      const bobotUTS = Number(formData.bobot_uts ?? 25);
      const bobotUAS = Number(formData.bobot_uas ?? 25);
      const batasA = Number(formData.batas_predikat_a ?? 85);
      const batasB = Number(formData.batas_predikat_b ?? 75);
      const batasC = Number(formData.batas_predikat_c ?? 65);

      if (kkm < 0 || kkm > 100) {
        toast.error("Nilai KKM Default harus berada dalam rentang 0 - 100");
        return;
      }

      const totalBobot = bobotTugas + bobotUH + bobotUTS + bobotUAS;
      if (Math.abs(totalBobot - 100) > 0.01) {
        toast.error(`Total bobot asesmen harus tepat bernilai 100% (saat ini ${totalBobot.toFixed(1)}%)`);
        return;
      }

      if (batasA <= batasB || batasB <= batasC) {
        toast.error("Ambang batas predikat tidak valid. Urutan harus Batas A > Batas B > Batas C");
        return;
      }

      setSaving(true);
      const payload = {
        nama_sekolah: formData.nama_sekolah,
        npsn: formData.npsn,
        akreditasi: formData.akreditasi,
        alamat: formData.alamat,
        telepon: formData.telepon,
        email: formData.email,
        website: formData.website,
        kepala_sekolah: formData.kepala_sekolah,
        nip_kepala_sekolah: formData.nip_kepala_sekolah,
        waka_kurikulum: formData.waka_kurikulum,
        nip_waka_kurikulum: formData.nip_waka_kurikulum,
        tahun_ajaran_aktif: formData.tahun_ajaran_aktif,
        semester_aktif: formData.semester_aktif,
        tenggat_kunci_raport: formData.tenggat_kunci_raport,
        durasi_kbm_menit: Number(formData.durasi_kbm_menit),
        jam_masuk: formData.jam_masuk.length === 5 ? formData.jam_masuk + ":00" : formData.jam_masuk,
        jam_pulang: formData.jam_pulang.length === 5 ? formData.jam_pulang + ":00" : formData.jam_pulang,
        kkm_default: kkm,
        bobot_tugas: bobotTugas,
        bobot_uh: bobotUH,
        bobot_uts: bobotUTS,
        bobot_uas: bobotUAS,
        batas_predikat_a: batasA,
        batas_predikat_b: batasB,
        batas_predikat_c: batasC,
      };

      const res = await fetchAPI<{ data: PengaturanSekolah }>("/pengaturan", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        toast.success("Pengaturan sekolah berhasil disimpan ke sistem");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan perubahan pengaturan");
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  const handleSyncDapodik = async () => {
    try {
      setSyncingDapodik(true);
      const res = await fetchAPI<{ data: { status: string; terakhir_sinkron: string } }>("/pengaturan/sinkron-dapodik", {
        method: "POST",
      });

      if (res && res.data) {
        setFormData((prev) => ({
          ...prev,
          status_sinkronisasi_dapodik: res.data.status,
          terakhir_sinkron: res.data.terakhir_sinkron,
        }));
        toast.success("Sinkronisasi Dapodik Kemendikbudristek berhasil diselesaikan");
      }
    } catch (err: any) {
      toast.error(err?.message || "Gagal melakukan sinkronisasi dengan Dapodik");
    } finally {
      setSyncingDapodik(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
            <span>Beranda</span>
            <span>/</span>
            <span>Kurikulum</span>
            <span>/</span>
            <span className="text-slate-600">Pengaturan Sekolah</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Settings className="w-7 h-7 text-[#1E3A8A]" />
              Pengaturan Sekolah & Tahun Ajaran
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-[#1E3A8A] rounded-full border border-blue-200">
              FR-MST-03
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Pusat konfigurasi tahun akademik, semester aktif, profil resmi sekolah, jam operasional KBM, dan sinkronisasi Dapodik.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="md"
            onClick={handleSyncDapodik}
            disabled={syncingDapodik}
            className="flex items-center gap-2 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-blue-700 ${syncingDapodik ? "animate-spin" : ""}`} />
            <span>{syncingDapodik ? "Menyinkronkan..." : "Sinkron Dapodik"}</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setShowConfirmModal(true)}
            disabled={saving || loading}
            className="flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1E3A8A] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Tahun Ajaran Aktif</p>
            <p className="text-base font-bold text-slate-900 truncate">{formData.tahun_ajaran_aktif}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Semester Berjalan</p>
            <p className="text-base font-bold text-emerald-700 truncate">Semester {formData.semester_aktif}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Tenggat Verifikasi Raport</p>
            <p className="text-base font-bold text-slate-900 truncate">
              {formData.tenggat_kunci_raport || "24 Des 2026"}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium">Status Dapodik</p>
            <p className="text-base font-bold text-purple-700 truncate">{formData.status_sinkronisasi_dapodik || "Terhubung"}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("akademik")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "akademik"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Tahun Ajaran & Semester</span>
        </button>

        <button
          onClick={() => setActiveTab("profil")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "profil"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <School className="w-4 h-4" />
          <span>Profil Sekolah</span>
        </button>

        <button
          onClick={() => setActiveTab("pejabat")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "pejabat"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Kepengurusan & Raport</span>
        </button>

        <button
          onClick={() => setActiveTab("kbm")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "kbm"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Jadwal & Sesi KBM</span>
        </button>

        <button
          onClick={() => setActiveTab("penilaian")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "penilaian"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Standar Penilaian & KKM</span>
        </button>

        <button
          onClick={() => setActiveTab("dapodik")}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all shrink-0 ${
            activeTab === "dapodik"
              ? "bg-[#1E3A8A] text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Integrasi Dapodik</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {activeTab === "akademik" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Konfigurasi Tahun Ajaran & Siklus Akademik</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengatur kalender akademik aktif yang menjadi acuan jadwal KBM, presensi, penilaian guru, dan leger semester.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Tahun Ajaran Aktif <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.tahun_ajaran_aktif}
                  onChange={(e) => handleChange("tahun_ajaran_aktif", e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                >
                  <option value="2026/2027">2026/2027 (Tahun Ajaran Berjalan)</option>
                  <option value="2025/2026">2025/2026 (Arsip Akademik)</option>
                  <option value="2027/2028">2027/2028 (Tahun Ajaran Depan)</option>
                </select>
                <p className="text-xs text-slate-500">
                  Seluruh rombel, jadwal pelajaran, danleger mengacu pada tahun ajaran aktif ini.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Semester Aktif <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("semester_aktif", "Ganjil")}
                    className={`h-11 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                      formData.semester_aktif === "Ganjil"
                        ? "bg-[#1E3A8A] text-white border-blue-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>Semester 1 (Ganjil)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("semester_aktif", "Genap")}
                    className={`h-11 rounded-xl text-sm font-semibold border flex items-center justify-center gap-2 transition-all ${
                      formData.semester_aktif === "Genap"
                        ? "bg-[#1E3A8A] text-white border-blue-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span>Semester 2 (Genap)</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Perubahan semester memengaruhi kolom kompilasi nilai dan absensi rapor.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Tenggat Penguncian Raport (Finalization Lock) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.tenggat_kunci_raport || "2026-12-24"}
                  onChange={(e) => handleChange("tenggat_kunci_raport", e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                />
                <p className="text-xs text-slate-500">
                  Setelah tanggal ini lewat, pengubahan nilai oleh Guru Mapel otomatis terkunci.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Status Kunci Nilai Otomatis
                </label>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-950 space-y-1">
                    <p className="font-semibold">Proteksi Integritas Nilai Aktif</p>
                    <p className="text-blue-800 leading-relaxed">
                      Sistem mencegah modifikasi sepihak ketika status laporan telah disahkan oleh Waka Kurikulum. Wali kelas hanya dapat mengubah catatan kepribadian sebelum pengesahan final.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "profil" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Identitas Resmi Sekolah</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Data resmi yang akan dicantumkan pada Kop Dokumen Rapor, Leger, dan Surat Keterangan Akademik.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nama Satuan Pendidikan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama_sekolah}
                  onChange={(e) => handleChange("nama_sekolah", e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  NPSN (Nomor Pokok Sekolah Nasional) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.npsn}
                  onChange={(e) => handleChange("npsn", e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Status Akreditasi Sekolah
                </label>
                <select
                  value={formData.akreditasi}
                  onChange={(e) => handleChange("akreditasi", e.target.value)}
                  className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                >
                  <option value="A">A (Unggul / Sangat Baik)</option>
                  <option value="B">B (Baik)</option>
                  <option value="C">C (Cukup)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Nomor Telepon Kantor
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.telepon}
                    onChange={(e) => handleChange("telepon", e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Email Resmi Sekolah
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Website Resmi Sekolah
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Alamat Lengkap Sekolah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <textarea
                    rows={2}
                    value={formData.alamat}
                    onChange={(e) => handleChange("alamat", e.target.value)}
                    className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pejabat" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Kepengurusan & Penandatangan Resmi Raport</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pejabat yang bertindak sebagai pihak berwenang penandatangan buku leger dan lembar rapor resmi semester.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
                  <Building className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Kepala Sekolah</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.kepala_sekolah}
                    onChange={(e) => handleChange("kepala_sekolah", e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={formData.nip_kepala_sekolah}
                    onChange={(e) => handleChange("nip_kepala_sekolah", e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>

              <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 border-b border-slate-200 pb-3">
                  <UserCheck className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Wakil Kepala Sekolah Bidang Kurikulum</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.waka_kurikulum}
                    onChange={(e) => handleChange("waka_kurikulum", e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    NIP Waka Kurikulum
                  </label>
                  <input
                    type="text"
                    value={formData.nip_waka_kurikulum}
                    onChange={(e) => handleChange("nip_waka_kurikulum", e.target.value)}
                    className="w-full h-11 px-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "kbm" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Jadwal Operasional KBM & Jam Pelajaran</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Konfigurasi acuan durasi jam pelajaran yang digunakan pada modul Kelola Jadwal Pelajaran dan Presensi Kelas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Jam Mulai KBM Sekolah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={formData.jam_masuk}
                    onChange={(e) => handleChange("jam_masuk", e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500">Standar jam masuk pagi: 07:00 WIB</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Jam Selesai KBM Sekolah <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="time"
                    value={formData.jam_pulang}
                    onChange={(e) => handleChange("jam_pulang", e.target.value)}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500">Standar kepulangan KBM: 15:30 WIB</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Durasi 1 Jam Pelajaran (JP) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={30}
                    max={60}
                    value={formData.durasi_kbm_menit}
                    onChange={(e) => handleChange("durasi_kbm_menit", Number(e.target.value))}
                    className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white"
                  />
                  <span className="text-sm font-bold text-slate-600 shrink-0">Menit</span>
                </div>
                <p className="text-xs text-slate-500">Standar kurikulum nasional SMA: 45 Menit per JP</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "penilaian" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#1E3A8A]" />
                  Standar Penilaian & KKM (Konfigurasi Kurikulum)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Atur acuan batas KKM, pembobotan komponen asesmen (Tugas, UH, UTS, UAS), serta rentang predikat huruf (A, B, C, D) dinamis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    kkm_default: 75,
                    bobot_tugas: 30,
                    bobot_uh: 20,
                    bobot_uts: 25,
                    bobot_uas: 25,
                    batas_predikat_a: 85,
                    batas_predikat_b: 75,
                    batas_predikat_c: 65,
                  }));
                  toast.info("Standar penilaian diatur ulang ke acuan default SMAN 2 Padalarang");
                }}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 underline self-start sm:self-auto cursor-pointer"
              >
                Reset ke Standar Default
              </button>
            </div>

            {/* KKM Section */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#1E3A8A]" />
                <span>Kriteria Ketuntasan Minimal (KKM) Satuan Pendidikan</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Batas Nilai KKM <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.kkm_default ?? 75}
                      onChange={(e) => handleChange("kkm_default", Number(e.target.value))}
                      className="w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white font-mono"
                    />
                    <span className="text-sm font-bold text-slate-600 shrink-0">Poin</span>
                  </div>
                  <p className="text-xs text-slate-500">Standar resmi kelulusan kompetensi SMAN 2 Padalarang</p>
                </div>

                <div className="md:col-span-2 p-4 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-950 space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5 text-blue-900">
                    <AlertCircle className="w-4 h-4 text-blue-700 shrink-0" />
                    Penerapan KKM Terpadu
                  </p>
                  <p className="text-slate-600 leading-relaxed">
                    Nilai KKM yang ditentukan oleh Kurikulum di sini akan dijadikan patokan kelulusan kompetensi pada Modul Guru (indikator tuntas/remedial), Leger Nilai Wali Kelas, Portal Nilai Siswa, serta verifikasi pengesahan Raport Akademik.
                  </p>
                </div>
              </div>
            </div>

            {/* Bobot Asesmen Section */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <Calculator className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Komposisi Pembobotan Asesmen Pembelajaran</span>
                </div>
                <div>
                  {Math.abs(((formData.bobot_tugas ?? 30) + (formData.bobot_uh ?? 20) + (formData.bobot_uts ?? 25) + (formData.bobot_uas ?? 25)) - 100) < 0.01 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Total Bobot: 100% (Valid)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Total: {((formData.bobot_tugas ?? 30) + (formData.bobot_uh ?? 20) + (formData.bobot_uts ?? 25) + (formData.bobot_uas ?? 25)).toFixed(1)}% (Harus 100%)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-700">
                    Tugas & Portofolio <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formData.bobot_tugas ?? 30}
                      onChange={(e) => handleChange("bobot_tugas", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Tugas mandiri & kelompok</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-700">
                    Ulangan Harian (UH) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formData.bobot_uh ?? 20}
                      onChange={(e) => handleChange("bobot_uh", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Formatif & kuis periodik</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-700">
                    UTS (Tengah Semester) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formData.bobot_uts ?? 25}
                      onChange={(e) => handleChange("bobot_uts", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Sumatif tengah semester</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="text-xs font-semibold text-slate-700">
                    UAS (Akhir Semester) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={formData.bobot_uas ?? 25}
                      onChange={(e) => handleChange("bobot_uas", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-blue-800 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Sumatif akhir semester</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                <span className="font-medium">Formula Nilai Akhir Mata Pelajaran:</span>
                <code className="font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded border border-slate-200">
                  NA = (Tugas×{formData.bobot_tugas ?? 30}% + UH×{formData.bobot_uh ?? 20}% + UTS×{formData.bobot_uts ?? 25}% + UAS×{formData.bobot_uas ?? 25}%)
                </code>
              </div>
            </div>

            {/* Predikat Rentang Section */}
            <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-slate-900">
                  <Sliders className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Ambang Batas & Skala Predikat Nilai Huruf</span>
                </div>
                {Number(formData.batas_predikat_a ?? 85) > Number(formData.batas_predikat_b ?? 75) &&
                Number(formData.batas_predikat_b ?? 75) > Number(formData.batas_predikat_c ?? 65) ? (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Skala Hierarkis Valid (A &gt; B &gt; C)
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Hierarki Tidak Valid: Wajib A &gt; B &gt; C
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                  <label className="text-xs font-bold text-emerald-900">
                    Batas Minimal Predikat A (Sangat Baik) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.batas_predikat_a ?? 85}
                      onChange={(e) => handleChange("batas_predikat_a", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-emerald-800">Skor</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">Nilai ≥ {formData.batas_predikat_a ?? 85} mendapat predikat A</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-blue-50/50 border border-blue-200">
                  <label className="text-xs font-bold text-blue-900">
                    Batas Minimal Predikat B (Baik) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.batas_predikat_b ?? 75}
                      onChange={(e) => handleChange("batas_predikat_b", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-blue-300 rounded-lg text-sm font-bold text-blue-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-blue-800">Skor</span>
                  </div>
                  <p className="text-[11px] text-blue-700">Nilai ≥ {formData.batas_predikat_b ?? 75} mendapat predikat B</p>
                </div>

                <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-50/50 border border-amber-200">
                  <label className="text-xs font-bold text-amber-900">
                    Batas Minimal Predikat C (Cukup) <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.batas_predikat_c ?? 65}
                      onChange={(e) => handleChange("batas_predikat_c", Number(e.target.value))}
                      className="w-full h-10 px-3 bg-white border border-amber-300 rounded-lg text-sm font-bold text-amber-900 font-mono focus:ring-2 focus:ring-amber-600 focus:outline-none"
                    />
                    <span className="text-xs font-bold text-amber-800">Skor</span>
                  </div>
                  <p className="text-[11px] text-amber-700">Nilai ≥ {formData.batas_predikat_c ?? 65} mendapat predikat C</p>
                </div>
              </div>

              {/* Dynamic Predicate Interval Visualization */}
              <div className="pt-2">
                <p className="text-xs font-semibold text-slate-700 mb-2.5">Pratinjau Rentang Predikat Akademik Kurikulum:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-center space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-emerald-600 text-white font-bold text-xs rounded-full">
                      Predikat A
                    </span>
                    <p className="text-base font-extrabold text-emerald-900 font-mono">
                      ≥ {formData.batas_predikat_a ?? 85}
                    </p>
                    <p className="text-[11px] font-medium text-emerald-700">Sangat Baik (Istimewa)</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 text-center space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-blue-600 text-white font-bold text-xs rounded-full">
                      Predikat B
                    </span>
                    <p className="text-base font-extrabold text-blue-900 font-mono">
                      {formData.batas_predikat_b ?? 75} - {(Number(formData.batas_predikat_a ?? 85) - 0.1).toFixed(1)}
                    </p>
                    <p className="text-[11px] font-medium text-blue-700">Baik (Memuaskan)</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-center space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-amber-600 text-white font-bold text-xs rounded-full">
                      Predikat C
                    </span>
                    <p className="text-base font-extrabold text-amber-900 font-mono">
                      {formData.batas_predikat_c ?? 65} - {(Number(formData.batas_predikat_b ?? 75) - 0.1).toFixed(1)}
                    </p>
                    <p className="text-[11px] font-medium text-amber-700">Cukup (Kriteria Minimal)</p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-center space-y-1">
                    <span className="inline-block px-2.5 py-0.5 bg-rose-600 text-white font-bold text-xs rounded-full">
                      Predikat D
                    </span>
                    <p className="text-base font-extrabold text-rose-900 font-mono">
                      &lt; {formData.batas_predikat_c ?? 65}
                    </p>
                    <p className="text-[11px] font-medium text-rose-700">Kurang (Wajib Remedial)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dapodik" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Integrasi Sinkronisasi Dapodik Kemendikbudristek</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Penyelarasan basis data peserta didik, pendidik, dan rombongan belajar dengan server Dapodik terpusat.
              </p>
            </div>

            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-sm font-bold text-slate-900">
                    Status Server: {formData.status_sinkronisasi_dapodik || "Terhubung"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                  Koneksi API Dapodik SMAN 2 Padalarang aktif. Anda dapat memicu pembaruan data master secara berkala untuk memastikan data siswa, NISN, dan penugasan guru selaras dengan pusat.
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Sinkronisasi Terakhir: {formData.terakhir_sinkron || "4 November 2026, 18:00 WIB"}
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleSyncDapodik}
                disabled={syncingDapodik}
                className="flex items-center gap-2 shadow-sm shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${syncingDapodik ? "animate-spin" : ""}`} />
                <span>{syncingDapodik ? "Proses Sinkronisasi..." : "Sinkronkan Sekarang"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSave}
        title="Simpan Konfigurasi Sekolah?"
        message="Perubahan pada Tahun Ajaran, Semester, Jam KBM, maupun Standar Penilaian Kurikulum akan langsung diterapkan ke seluruh sistem LMS SMAN 2 Padalarang."
        confirmText="Ya, Simpan Perubahan"
        variant="primary"
      />
    </div>
  );
}
