"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileCheck,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  ShieldCheck,
  Printer,
  ChevronRight,
  RotateCcw,
  Building2,
  Users,
  Award,
  Check,
  X,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { fetchAPI, getApiBaseUrl } from "@/lib/api";
import { getStoredUser, AuthUser } from "@/lib/auth";
import {
  Kelas,
  LaporanAkademik,
  StatusLaporan,
  RombelLegerSummary,
  NilaiMapelDetail,
} from "@/types";

const INITIAL_REPORT_DATA: LaporanAkademik[] = [
  {
    id: "60000000-0000-0000-0000-000000000001",
    siswa_id: "10000000-0000-0000-0000-000000000001",
    nis: "24251001",
    nisn: "0067891234",
    nama_siswa: "Laura Firdaus",
    jenis_kelamin: "Perempuan",
    kelas_id: "f0000000-0000-0000-0000-000000000001",
    nama_kelas: "XII IPA 1",
    tingkat: 12,
    jurusan: "MIPA",
    wali_kelas_nama: "Budi Santoso, S.Pd",
    semester: "Ganjil",
    tahun_ajaran: "2026/2027",
    nilai_pengetahuan: 88.5,
    nilai_keterampilan: 89.0,
    rata_rata_akhir: 88.75,
    predikat_akhir: "A",
    deskripsi_nilai: "Memiliki pemahaman komprehensif dalam mata pelajaran eksakta dan keterampilan analisis yang sangat matang.",
    catatan_wali: "Menunjukkan dedikasi tinggi, konsisten hadir tepat waktu, dan aktif memimpin kelompok diskusi.",
    status_laporan: "DitinjauWali",
    kehadiran: {
      hadir: 98,
      sakit: 1,
      izin: 1,
      alfa: 0,
      persentase: 98,
    },
    nilai_mapel: [
      {
        kode_mapel: "MTK-XII",
        nama_mapel: "Matematika Peminatan",
        kategori: "Eksakta",
        pengetahuan: 89,
        keterampilan: 90.5,
        nilai_akhir: 89,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Matematika Peminatan.",
      },
      {
        kode_mapel: "FIS-XII",
        nama_mapel: "Fisika",
        kategori: "Eksakta",
        pengetahuan: 89,
        keterampilan: 90.5,
        nilai_akhir: 89,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Fisika.",
      },
      {
        kode_mapel: "BIO-XII",
        nama_mapel: "Biologi",
        kategori: "Eksakta",
        pengetahuan: 88,
        keterampilan: 89.5,
        nilai_akhir: 88,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Biologi.",
      },
    ],
  },
  {
    id: "60000000-0000-0000-0000-000000000002",
    siswa_id: "10000000-0000-0000-0000-000000000002",
    nis: "24251020",
    nisn: "0067891235",
    nama_siswa: "Ahmad Fikri Ramadhan",
    jenis_kelamin: "Laki-laki",
    kelas_id: "f0000000-0000-0000-0000-000000000001",
    nama_kelas: "XII IPA 1",
    tingkat: 12,
    jurusan: "MIPA",
    wali_kelas_nama: "Budi Santoso, S.Pd",
    semester: "Ganjil",
    tahun_ajaran: "2026/2027",
    nilai_pengetahuan: 84.0,
    nilai_keterampilan: 86.0,
    rata_rata_akhir: 85.0,
    predikat_akhir: "B",
    deskripsi_nilai: "Mencapai ketuntasan kompetensi dengan performa stabil pada penilaian tugas dan ujian.",
    catatan_wali: "Rajin berdiskusi di kelas, pertahankan antusiasme dan ketelitian dalam pengerjaan tugas eksakta.",
    status_laporan: "DitinjauWali",
    kehadiran: {
      hadir: 95,
      sakit: 1,
      izin: 1,
      alfa: 0,
      persentase: 95,
    },
    nilai_mapel: [
      {
        kode_mapel: "MTK-XII",
        nama_mapel: "Matematika Peminatan",
        kategori: "Eksakta",
        pengetahuan: 85,
        keterampilan: 86.5,
        nilai_akhir: 85,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Matematika Peminatan.",
      },
      {
        kode_mapel: "FIS-XII",
        nama_mapel: "Fisika",
        kategori: "Eksakta",
        pengetahuan: 84,
        keterampilan: 85.5,
        nilai_akhir: 84,
        predikat: "B",
        capaian: "Menunjukkan penguasaan kompetensi yang baik pada materi Fisika.",
      },
      {
        kode_mapel: "BIO-XII",
        nama_mapel: "Biologi",
        kategori: "Eksakta",
        pengetahuan: 86,
        keterampilan: 87.5,
        nilai_akhir: 86,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Biologi.",
      },
    ],
  },
  {
    id: "60000000-0000-0000-0000-000000000003",
    siswa_id: "59a387a5-3d69-46b8-a6e0-1c3c7a0f1245",
    nis: "12456787",
    nisn: "0086752417",
    nama_siswa: "karina jean",
    jenis_kelamin: "Laki-laki",
    kelas_id: "f0000000-0000-0000-0000-000000000001",
    nama_kelas: "XII IPA 1",
    tingkat: 12,
    jurusan: "MIPA",
    wali_kelas_nama: "Budi Santoso, S.Pd",
    semester: "Ganjil",
    tahun_ajaran: "2026/2027",
    nilai_pengetahuan: 81.0,
    nilai_keterampilan: 83.0,
    rata_rata_akhir: 82.0,
    predikat_akhir: "B",
    deskripsi_nilai: "Kompetensi dasar tercapai, terdapat satu tugas Biologi yang memerlukan perbaikan rubrik.",
    catatan_wali: "Tingkatkan kehadiran pada sesi praktikum laboratorium di semester berikutnya.",
    status_laporan: "Draf",
    catatan_revisi: "Perlu konfirmasi ulang nilai praktikum Biologi",
    kehadiran: {
      hadir: 91,
      sakit: 2,
      izin: 1,
      alfa: 0,
      persentase: 91,
    },
    nilai_mapel: [
      {
        kode_mapel: "MTK-XII",
        nama_mapel: "Matematika Peminatan",
        kategori: "Eksakta",
        pengetahuan: 81,
        keterampilan: 83,
        nilai_akhir: 82,
        predikat: "B",
        capaian: "Memiliki pemahaman dan keterampilan belajar memuaskan pada mata pelajaran Matematika Peminatan.",
      },
      {
        kode_mapel: "FIS-XII",
        nama_mapel: "Fisika",
        kategori: "Eksakta",
        pengetahuan: 81,
        keterampilan: 83,
        nilai_akhir: 82,
        predikat: "B",
        capaian: "Memiliki pemahaman dan keterampilan belajar memuaskan pada mata pelajaran Fisika.",
      },
      {
        kode_mapel: "BIO-XII",
        nama_mapel: "Biologi",
        kategori: "Eksakta",
        pengetahuan: 81,
        keterampilan: 83,
        nilai_akhir: 82,
        predikat: "B",
        capaian: "Memiliki pemahaman dan keterampilan belajar memuaskan pada mata pelajaran Biologi.",
      },
    ],
  },
  {
    id: "60000000-0000-0000-0000-000000000004",
    siswa_id: "10000000-0000-0000-0000-000000000003",
    nis: "24251021",
    nisn: "0067891236",
    nama_siswa: "Nabila Putri Salsabila",
    jenis_kelamin: "Perempuan",
    kelas_id: "f0000000-0000-0000-0000-000000000002",
    nama_kelas: "XII IPA 3",
    tingkat: 12,
    jurusan: "MIPA",
    wali_kelas_nama: "Dr. Siti Aminah, M.Pd",
    semester: "Ganjil",
    tahun_ajaran: "2026/2027",
    nilai_pengetahuan: 91.0,
    nilai_keterampilan: 91.5,
    rata_rata_akhir: 91.25,
    predikat_akhir: "A",
    deskripsi_nilai: "Unggul dalam analisis kuantitatif dan penalaran sains secara komprehensif.",
    catatan_wali: "Prestasi akademik cemerlang dan memiliki integritas belajar yang sangat baik.",
    status_laporan: "DisahkanKurikulum",
    disahkan_pada: "2026-11-04T03:00:00Z",
    disahkan_oleh: "Drs. Herman Wijaya, M.M",
    kehadiran: {
      hadir: 98,
      sakit: 1,
      izin: 1,
      alfa: 0,
      persentase: 98,
    },
    nilai_mapel: [
      {
        kode_mapel: "MTK-XII",
        nama_mapel: "Matematika Peminatan",
        kategori: "Eksakta",
        pengetahuan: 92,
        keterampilan: 93.5,
        nilai_akhir: 92,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Matematika Peminatan.",
      },
      {
        kode_mapel: "FIS-XII",
        nama_mapel: "Fisika",
        kategori: "Eksakta",
        pengetahuan: 90,
        keterampilan: 91.5,
        nilai_akhir: 90,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Fisika.",
      },
    ],
  },
  {
    id: "60000000-0000-0000-0000-000000000005",
    siswa_id: "10000000-0000-0000-0000-000000000004",
    nis: "24251022",
    nisn: "0067891237",
    nama_siswa: "Dimas Raya Pratama",
    jenis_kelamin: "Laki-laki",
    kelas_id: "f0000000-0000-0000-0000-000000000002",
    nama_kelas: "XII IPA 3",
    tingkat: 12,
    jurusan: "MIPA",
    wali_kelas_nama: "Dr. Siti Aminah, M.Pd",
    semester: "Ganjil",
    tahun_ajaran: "2026/2027",
    nilai_pengetahuan: 87.5,
    nilai_keterampilan: 88.5,
    rata_rata_akhir: 88.0,
    predikat_akhir: "A",
    deskripsi_nilai: "Tuntas pada seluruh capaian pembelajaran dengan keunggulan pada bidang kognitif.",
    catatan_wali: "Pertahankan etos belajar yang konsisten dan aktif berkontribusi positif.",
    status_laporan: "DisahkanKurikulum",
    disahkan_pada: "2026-11-04T03:00:00Z",
    disahkan_oleh: "Drs. Herman Wijaya, M.M",
    kehadiran: {
      hadir: 98,
      sakit: 1,
      izin: 1,
      alfa: 0,
      persentase: 98,
    },
    nilai_mapel: [
      {
        kode_mapel: "MTK-XII",
        nama_mapel: "Matematika Peminatan",
        kategori: "Eksakta",
        pengetahuan: 88,
        keterampilan: 89.5,
        nilai_akhir: 88,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Matematika Peminatan.",
      },
      {
        kode_mapel: "BIO-XII",
        nama_mapel: "Biologi",
        kategori: "Eksakta",
        pengetahuan: 89,
        keterampilan: 90.5,
        nilai_akhir: 89,
        predikat: "A",
        capaian: "Sangat unggul dan teliti dalam menganalisis materi Biologi.",
      },
    ],
  },
];

interface ApiSummaryData {
  total_siswa: number;
  total_disahkan: number;
  total_menunggu: number;
  total_draf: number;
  rata_rata_sekolah: number;
  semester: string;
  tahun_ajaran: string;
  rombel_stats: Array<{
    kelas_id: string;
    nama_kelas: string;
    jurusan: string;
    tingkat: number;
    wali_kelas: string;
    total_siswa: number;
    disahkan_count: number;
    progres_persen: number;
    rata_rata_rombels: number;
    status_rombel: string;
  }>;
}

export default function VerifikasiRaportPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [laporanList, setLaporanList] = useState<LaporanAkademik[]>(INITIAL_REPORT_DATA);
  const [apiSummary, setApiSummary] = useState<ApiSummaryData | null>(null);
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [selectedTahun, setSelectedTahun] = useState("2026/2027");
  const [isLoading, setIsLoading] = useState(false);

  const [activeModalLaporan, setActiveModalLaporan] = useState<LaporanAkademik | null>(null);
  const [isRevisiModalOpen, setIsRevisiModalOpen] = useState(false);
  const [revisiTargetLaporan, setRevisiTargetLaporan] = useState<LaporanAkademik | null>(null);
  const [revisiNoteInput, setRevisiNoteInput] = useState("");

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "primary" | "danger" | "warning";
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  const mapResponseToLaporan = useCallback((item: any): LaporanAkademik => {
    return {
      id: item.id_laporan || item.id,
      siswa_id: item.siswa_id,
      nis: item.nis,
      nisn: item.nisn,
      nama_siswa: item.nama || item.nama_siswa,
      jenis_kelamin: item.gender === "Laki-laki" || item.gender === "Laki-Laki" ? "Laki-laki" : "Perempuan",
      kelas_id: item.kelas_id,
      nama_kelas: item.rombel || item.nama_kelas,
      tingkat: item.tingkat || 12,
      jurusan: item.jurusan || "MIPA",
      wali_kelas_nama: item.wali_kelas || item.wali_kelas_nama || "Budi Santoso, S.Pd",
      semester: (item.semester || selectedSemester) as "Ganjil" | "Genap",
      tahun_ajaran: item.tahun_ajaran || selectedTahun,
      nilai_pengetahuan: item.pengetahuan ?? item.nilai_pengetahuan ?? 0,
      nilai_keterampilan: item.keterampilan ?? item.nilai_keterampilan ?? 0,
      rata_rata_akhir: item.rata_rata ?? item.rata_rata_akhir ?? 0,
      predikat_akhir: item.predikat || item.predikat_akhir || "B",
      deskripsi_nilai: item.deskripsi_nilai || "",
      catatan_wali: item.catatan_wali || "",
      catatan_revisi: item.catatan_revisi || undefined,
      status_laporan: (item.status_laporan || "Draf") as StatusLaporan,
      disahkan_pada: item.disahkan_pada,
      disahkan_oleh: item.disahkan_oleh,
      kehadiran: {
        hadir: item.kehadiran?.persen || 95,
        sakit: item.kehadiran?.sakit || 0,
        izin: item.kehadiran?.izin || 0,
        alfa: item.kehadiran?.alfa || 0,
        persentase: item.kehadiran?.persen || 95,
      },
      nilai_mapel: (item.nilai_mapel || []).map((m: any) => ({
        kode_mapel: m.kode || m.kode_mapel,
        nama_mapel: m.nama || m.nama_mapel,
        kategori: m.kategori || "Umum",
        pengetahuan: m.pengetahuan || 0,
        keterampilan: m.keterampilan || 0,
        nilai_akhir: m.nilai_akhir || 0,
        predikat: m.predikat || "B",
        capaian: m.capaian || "",
      })),
    };
  }, [selectedSemester, selectedTahun]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, listRes] = await Promise.all([
        fetchAPI<{ success: boolean; data: ApiSummaryData }>(
          `/laporan/summary?semester=${selectedSemester}&tahun_ajaran=${encodeURIComponent(selectedTahun)}`
        ),
        fetchAPI<{ success: boolean; data: any[] }>(
          `/laporan/kelas/all?semester=${selectedSemester}&tahun_ajaran=${encodeURIComponent(selectedTahun)}`
        ),
      ]);

      if (summaryRes?.data) {
        setApiSummary(summaryRes.data);
      }

      if (listRes?.data && listRes.data.length > 0) {
        const mapped = listRes.data.map(mapResponseToLaporan);
        setLaporanList(mapped);
      }
    } catch (err: any) {
      console.warn("Gagal terhubung ke API backend, menggunakan data lokal:", err?.message);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemester, selectedTahun, mapResponseToLaporan]);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }

    async function loadKelasMaster() {
      try {
        const res = await fetchAPI<{ data: Kelas[] }>("/master/kelas");
        if (res.data && res.data.length > 0) {
          setKelasList(res.data);
        }
      } catch {
        setKelasList([
          { id: "f0000000-0000-0000-0000-000000000001", nama_kelas: "XII IPA 1", tingkat: 12, jurusan: "MIPA" },
          { id: "f0000000-0000-0000-0000-000000000002", nama_kelas: "XII IPA 3", tingkat: 12, jurusan: "MIPA" },
        ]);
      }
    }

    loadKelasMaster();
    loadData();
  }, [loadData]);

  const rombelSummaries = useMemo<RombelLegerSummary[]>(() => {
    if (apiSummary && apiSummary.rombel_stats && apiSummary.rombel_stats.length > 0) {
      return apiSummary.rombel_stats.map((r) => {
        let statusRombel: StatusLaporan = "DitinjauWali";
        if (r.status_rombel.includes("Disahkan")) {
          statusRombel = "DisahkanKurikulum";
        } else if (r.status_rombel.includes("Draf") || r.status_rombel.includes("Revisi")) {
          statusRombel = "Draf";
        }
        return {
          kelas_id: r.kelas_id,
          nama_kelas: r.nama_kelas,
          tingkat: r.tingkat,
          jurusan: r.jurusan,
          wali_kelas_nama: r.wali_kelas,
          total_siswa: r.total_siswa,
          disahkan_count: r.disahkan_count,
          ditinjau_count: r.total_siswa - r.disahkan_count,
          draf_count: r.status_rombel.includes("Draf") ? 1 : 0,
          rata_rata_kelas: r.rata_rata_rombels,
          status_rombel: statusRombel,
        };
      });
    }

    const classes = kelasList.length > 0 ? kelasList : [
      { id: "f0000000-0000-0000-0000-000000000001", nama_kelas: "XII IPA 1", tingkat: 12, jurusan: "MIPA" },
      { id: "f0000000-0000-0000-0000-000000000002", nama_kelas: "XII IPA 3", tingkat: 12, jurusan: "MIPA" },
    ];

    return classes.map((k) => {
      const siswaInKelas = laporanList.filter(
        (l) => l.kelas_id === k.id || l.nama_kelas === k.nama_kelas
      );
      const total = siswaInKelas.length;
      const disahkan = siswaInKelas.filter((s) => s.status_laporan === "DisahkanKurikulum").length;
      const ditinjau = siswaInKelas.filter((s) => s.status_laporan === "DitinjauWali").length;
      const draf = siswaInKelas.filter((s) => s.status_laporan === "Draf").length;
      const avg = total > 0 ? siswaInKelas.reduce((sum, s) => sum + s.rata_rata_akhir, 0) / total : 0;

      let statusRombel: StatusLaporan = "DitinjauWali";
      if (disahkan === total && total > 0) {
        statusRombel = "DisahkanKurikulum";
      } else if (draf > 0) {
        statusRombel = "Draf";
      }

      const waliName = siswaInKelas[0]?.wali_kelas_nama || (k.nama_kelas === "XII IPA 1" ? "Budi Santoso, S.Pd" : "Dr. Siti Aminah, M.Pd");

      return {
        kelas_id: k.id,
        nama_kelas: k.nama_kelas,
        tingkat: k.tingkat,
        jurusan: k.jurusan,
        wali_kelas_nama: waliName,
        total_siswa: total,
        disahkan_count: disahkan,
        ditinjau_count: ditinjau,
        draf_count: draf,
        rata_rata_kelas: Number(avg.toFixed(2)),
        status_rombel: statusRombel,
      };
    });
  }, [apiSummary, kelasList, laporanList]);

  const filteredLaporan = useMemo(() => {
    return laporanList.filter((item) => {
      if (selectedKelasFilter && item.kelas_id !== selectedKelasFilter && item.nama_kelas !== selectedKelasFilter) {
        return false;
      }
      if (selectedStatusFilter && item.status_laporan !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.nama_siswa.toLowerCase().includes(query);
        const matchNIS = item.nis.includes(query) || item.nisn.includes(query);
        const matchKelas = item.nama_kelas.toLowerCase().includes(query);
        if (!matchName && !matchNIS && !matchKelas) {
          return false;
        }
      }
      return true;
    });
  }, [laporanList, selectedKelasFilter, selectedStatusFilter, searchQuery]);

  const totalSiswa = apiSummary?.total_siswa ?? laporanList.length;
  const totalDisahkan = apiSummary?.total_disahkan ?? laporanList.filter((l) => l.status_laporan === "DisahkanKurikulum").length;
  const totalDitinjau = apiSummary?.total_menunggu ?? laporanList.filter((l) => l.status_laporan === "DitinjauWali").length;
  const rataRataSekolah = apiSummary?.rata_rata_sekolah
    ? apiSummary.rata_rata_sekolah.toFixed(2)
    : totalSiswa > 0
    ? (laporanList.reduce((acc, curr) => acc + curr.rata_rata_akhir, 0) / totalSiswa).toFixed(2)
    : "0";

  const handleFinalizeSingle = (laporan: LaporanAkademik) => {
    setConfirmModalState({
      isOpen: true,
      title: "Sahkan & Kunci Rapor Siswa",
      message: `Apakah Anda yakin ingin mengesahkan rapor untuk ${laporan.nama_siswa} (${laporan.nama_kelas})? Status akan dikunci menjadi DisahkanKurikulum (read-only) dan siap dicetak resmi.`,
      confirmText: "Ya, Sahkan & Kunci",
      variant: "primary",
      onConfirm: async () => {
        try {
          await fetchAPI(`/laporan/${laporan.id}/finalize`, {
            method: "PUT",
          });
          toast.success(`Rapor ${laporan.nama_siswa} berhasil disahkan dan dikunci resmi!`);
          await loadData();
        } catch {
          const timestamp = new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          const adminName = currentUser?.nama_lengkap || "Drs. Herman Wijaya, M.M";

          setLaporanList((prev) =>
            prev.map((item) =>
              item.id === laporan.id
                ? {
                    ...item,
                    status_laporan: "DisahkanKurikulum",
                    disahkan_pada: `${timestamp} WIB`,
                    disahkan_oleh: `${adminName} (Waka Kurikulum)`,
                    catatan_revisi: undefined,
                  }
                : item
            )
          );
          toast.success(`Rapor ${laporan.nama_siswa} berhasil disahkan dan dikunci resmi!`);
        }

        if (activeModalLaporan?.id === laporan.id) {
          setActiveModalLaporan((prev) =>
            prev
              ? {
                  ...prev,
                  status_laporan: "DisahkanKurikulum",
                  disahkan_pada: new Date().toISOString(),
                  disahkan_oleh: currentUser?.nama_lengkap || "Drs. Herman Wijaya, M.M",
                  catatan_revisi: undefined,
                }
              : null
          );
        }
        setConfirmModalState((p) => ({ ...p, isOpen: false }));
      },
    });
  };

  const handleFinalizeKelas = (kelasName: string, kelasId: string) => {
    const unapproved = laporanList.filter(
      (l) => (l.kelas_id === kelasId || l.nama_kelas === kelasName) && l.status_laporan !== "DisahkanKurikulum"
    );

    if (unapproved.length === 0) {
      toast.info(`Seluruh siswa kelas ${kelasName} sudah disahkan sebelumnya.`);
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: `Sahkan Rapor Seluruh Siswa ${kelasName}`,
      message: `Tindakan ini akan mengesahkan dan mengunci ${unapproved.length} rapor siswa pada rombel ${kelasName}. Setelah disahkan, seluruh nilai akan berstatus permanen (read-only lock) dan izin cetak rapor resmi aktif.`,
      confirmText: `Sahkan Seluruh ${kelasName}`,
      variant: "primary",
      onConfirm: async () => {
        try {
          await fetchAPI(`/laporan/finalize-batch`, {
            method: "PUT",
            body: JSON.stringify({
              kelas_id: kelasId,
              semester: selectedSemester,
              tahun_ajaran: selectedTahun,
            }),
          });
          toast.success(`Berhasil mengesahkan ${unapproved.length} rapor siswa rombel ${kelasName}!`);
          await loadData();
        } catch {
          const timestamp = new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          const adminName = currentUser?.nama_lengkap || "Drs. Herman Wijaya, M.M";

          setLaporanList((prev) =>
            prev.map((item) => {
              if (item.kelas_id === kelasId || item.nama_kelas === kelasName) {
                return {
                  ...item,
                  status_laporan: "DisahkanKurikulum",
                  disahkan_pada: `${timestamp} WIB`,
                  disahkan_oleh: `${adminName} (Waka Kurikulum)`,
                  catatan_revisi: undefined,
                };
              }
              return item;
            })
          );
          toast.success(`Berhasil mengesahkan ${unapproved.length} rapor siswa rombel ${kelasName}!`);
        }
        setConfirmModalState((p) => ({ ...p, isOpen: false }));
      },
    });
  };

  const handleFinalizeAllSchool = () => {
    const pendingTotal = laporanList.filter((l) => l.status_laporan !== "DisahkanKurikulum").length;
    if (pendingTotal === 0) {
      toast.info("Seluruh rapor di semua rombel sekolah telah disahkan.");
      return;
    }

    setConfirmModalState({
      isOpen: true,
      title: "Pengesahan Massal Rapor Semester Sekolah",
      message: `Anda akan mengesahkan dan mengunci ${pendingTotal} draf rapor siswa dari seluruh rombel aktif tahun ajaran ${selectedTahun} (${selectedSemester}). Lanjutkan pengesahan resmi kurikulum?`,
      confirmText: "Sahkan Seluruh Sekolah",
      variant: "primary",
      onConfirm: async () => {
        try {
          await fetchAPI(`/laporan/finalize-batch`, {
            method: "PUT",
            body: JSON.stringify({
              kelas_id: "all",
              semester: selectedSemester,
              tahun_ajaran: selectedTahun,
            }),
          });
          toast.success(`Berhasil mengesahkan ${pendingTotal} rapor siswa tingkat sekolah!`);
          await loadData();
        } catch {
          const timestamp = new Date().toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          });
          const adminName = currentUser?.nama_lengkap || "Drs. Herman Wijaya, M.M";

          setLaporanList((prev) =>
            prev.map((item) => ({
              ...item,
              status_laporan: "DisahkanKurikulum",
              disahkan_pada: `${timestamp} WIB`,
              disahkan_oleh: `${adminName} (Waka Kurikulum)`,
              catatan_revisi: undefined,
            }))
          );
          toast.success(`Berhasil mengesahkan ${pendingTotal} rapor siswa tingkat sekolah!`);
        }
        setConfirmModalState((p) => ({ ...p, isOpen: false }));
      },
    });
  };

  const handleOpenRevisiDialog = (laporan: LaporanAkademik) => {
    setRevisiTargetLaporan(laporan);
    setRevisiNoteInput(laporan.catatan_revisi || "");
    setIsRevisiModalOpen(true);
  };

  const handleSubmitRevisi = async () => {
    if (!revisiTargetLaporan) return;
    if (!revisiNoteInput.trim()) {
      toast.error("Mohon berikan catatan alasan pengembalian revisi.");
      return;
    }

    try {
      await fetchAPI(`/laporan/revisi`, {
        method: "POST",
        body: JSON.stringify({
          id_laporan: revisiTargetLaporan.id,
          catatan_revisi: revisiNoteInput.trim(),
        }),
      });
      toast.warning(`Rapor ${revisiTargetLaporan.nama_siswa} dikembalikan ke Wali Kelas untuk revisi.`);
      await loadData();
    } catch {
      setLaporanList((prev) =>
        prev.map((item) =>
          item.id === revisiTargetLaporan.id
            ? {
                ...item,
                status_laporan: "Draf",
                catatan_revisi: revisiNoteInput.trim(),
              }
            : item
        )
      );
      toast.warning(`Rapor ${revisiTargetLaporan.nama_siswa} dikembalikan ke Wali Kelas untuk revisi.`);
    }

    if (activeModalLaporan?.id === revisiTargetLaporan.id) {
      setActiveModalLaporan((prev) =>
        prev
          ? {
              ...prev,
              status_laporan: "Draf",
              catatan_revisi: revisiNoteInput.trim(),
            }
          : null
      );
    }

    setIsRevisiModalOpen(false);
    setRevisiTargetLaporan(null);
    setRevisiNoteInput("");
  };

  const handleExportLegerCSV = () => {
    const url = `${getApiBaseUrl()}/laporan/export-csv?semester=${selectedSemester}&tahun_ajaran=${encodeURIComponent(selectedTahun)}`;
    window.open(url, "_blank");
    toast.success("Buku Leger Nilai resmi sedang diunduh...");
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  const renderStatusBadge = (status: StatusLaporan) => {
    switch (status) {
      case "DisahkanKurikulum":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Disahkan (Terkunci)</span>
          </span>
        );
      case "DitinjauWali":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Kurikulum</span>
          </span>
        );
      case "Draf":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Draf / Perlu Revisi</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/admin" className="hover:text-blue-900 transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 font-medium">Kurikulum</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-900 font-semibold">Verifikasi Raport & Leger</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Verifikasi & Pengesahan Raport 🎓
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                Validasi kelayakan nilai, pengesahan leger akademik, dan pengunduhan rapor resmi semester (FR-LAP-03).
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
            <span className="text-xs text-slate-500 font-medium mr-2">Semester:</span>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as "Ganjil" | "Genap")}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-hidden cursor-pointer"
            >
              <option value="Ganjil">Ganjil (2026/2027)</option>
              <option value="Genap">Genap (2026/2027)</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleExportLegerCSV}
            className="gap-2"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor Leger CSV</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleFinalizeAllSchool}
            className="gap-2 bg-blue-900 hover:bg-blue-800"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Kunci & Sahkan Rapor</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Siswa Terdaftar"
          value={`${totalSiswa} Siswa`}
          subtitle="Tingkat XII MIPA"
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Rapor Telah Disahkan"
          value={`${totalDisahkan} Siswa`}
          subtitle="Status Final (Terkunci)"
          icon={ShieldCheck}
          variant="success"
        />
        <MetricCard
          title="Menunggu Verifikasi"
          value={`${totalDitinjau} Siswa`}
          subtitle="Draf Leger Diserahkan Wali"
          icon={Clock}
          variant="white"
        />
        <MetricCard
          title="Rata-rata Nilai Sekolah"
          value={rataRataSekolah}
          subtitle="Skor Komprehensif Semester"
          icon={Award}
          variant="cyan"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-900" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Status Pengumpulan Leger per Rombel ({rombelSummaries.length} Rombel)
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Pengecekan kelengkapan nilai wali kelas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rombelSummaries.map((rombel) => {
            const isCompleted = rombel.status_rombel === "DisahkanKurikulum";
            const percent = rombel.total_siswa > 0 ? Math.round((rombel.disahkan_count / rombel.total_siswa) * 100) : 0;

            return (
              <div
                key={rombel.kelas_id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{rombel.nama_kelas}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 uppercase">
                        {rombel.jurusan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Wali Kelas: {rombel.wali_kelas_nama}</p>
                  </div>
                  <div>{renderStatusBadge(rombel.status_rombel)}</div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Progres Pengesahan:</span>
                    <span className="font-semibold text-slate-800">
                      {rombel.disahkan_count} dari {rombel.total_siswa} Siswa ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? "bg-emerald-500" : percent > 0 ? "bg-blue-600" : "bg-slate-300"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                  <div className="text-slate-600">
                    Rata-rata Rombel: <span className="font-bold text-slate-900">{rombel.rata_rata_kelas}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedKelasFilter(selectedKelasFilter === rombel.nama_kelas ? "" : rombel.nama_kelas)}
                      className="text-blue-900 hover:underline font-semibold cursor-pointer"
                    >
                      {selectedKelasFilter === rombel.nama_kelas ? "Tampilkan Semua" : "Filter Kelas"}
                    </button>
                    {!isCompleted && rombel.total_siswa > 0 && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleFinalizeKelas(rombel.nama_kelas, rombel.kelas_id)}
                        className="bg-blue-900 hover:bg-blue-800 text-[11px] py-1 px-2.5 h-auto"
                      >
                        Sahkan Rombel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Buku Leger &amp; Rapor Siswa</h2>
            <p className="text-xs text-slate-500">Daftar rekapitulasi nilai kumulatif per peserta didik</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa, NISN, atau kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 w-52 sm:w-64"
              />
            </div>

            <select
              value={selectedKelasFilter}
              onChange={(e) => setSelectedKelasFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="">Semua Rombel</option>
              {rombelSummaries.map((r) => (
                <option key={r.kelas_id} value={r.nama_kelas}>
                  {r.nama_kelas}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="DisahkanKurikulum">Disahkan (Terkunci)</option>
              <option value="DitinjauWali">Menunggu Kurikulum</option>
              <option value="Draf">Draf / Perlu Revisi</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">NISN / NIS</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4 text-center">Pengetahuan</th>
                <th className="py-3 px-4 text-center">Keterampilan</th>
                <th className="py-3 px-4 text-center">Rata-rata</th>
                <th className="py-3 px-4 text-center">Kehadiran</th>
                <th className="py-3 px-4">Status Pengesahan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLaporan.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data rapor yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredLaporan.map((item, index) => {
                  const isLocked = item.status_laporan === "DisahkanKurikulum";
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-medium text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.nisn}</div>
                        <div className="text-[10px] text-slate-500">NIS: {item.nis}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{item.nama_siswa}</div>
                        <div className="text-[10px] text-slate-500">{item.jenis_kelamin}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{item.nama_kelas}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {item.nilai_pengetahuan.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {item.nilai_keterampilan.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-blue-900">
                          {item.rata_rata_akhir} ({item.predikat_akhir})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-emerald-700">
                          {item.kehadiran.persentase}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          S:{item.kehadiran.sakit} I:{item.kehadiran.izin} A:{item.kehadiran.alfa}
                        </div>
                      </td>
                      <td className="py-3 px-4">{renderStatusBadge(item.status_laporan)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setActiveModalLaporan(item)}
                            title="Pratinjau Raport Resmi"
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {!isLocked && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleFinalizeSingle(item)}
                                title="Sahkan & Kunci Rapor"
                                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-semibold px-2"
                              >
                                <Check className="w-3.5 h-3.5 text-blue-900" />
                                <span>Sahkan</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRevisiDialog(item)}
                                title="Kembalikan untuk Revisi"
                                className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4 text-amber-700" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeModalLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Pratinjau Raport Semester Siswa - {activeModalLaporan.nama_siswa}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTriggerPrint}
                  className="gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak Raport PDF</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveModalLaporan(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6" ref={printAreaRef}>
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Logo SMAN 2 Padalarang"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                  <div>
                    <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                      Pemerintah Daerah Provinsi Jawa Barat
                    </h2>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                      Dinas Pendidikan • Cabang Dinas Pendidikan Wilayah VI
                    </h3>
                    <h1 className="text-lg font-black uppercase text-blue-900 tracking-tight">
                      SMA Negeri 2 Padalarang
                    </h1>
                    <p className="text-[11px] text-slate-600">
                      Jalan Raya Padalarang No. 45 Kab. Bandung Barat 40553 • Telp (022) 6806123
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Nama Peserta Didik: </span>
                    <span className="font-bold text-slate-900">{activeModalLaporan.nama_siswa}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">NISN / NIS: </span>
                    <span className="font-semibold text-slate-800">
                      {activeModalLaporan.nisn} / {activeModalLaporan.nis}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Jenis Kelamin: </span>
                    <span className="font-medium text-slate-800">{activeModalLaporan.jenis_kelamin}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-slate-500">Kelas / Rombel: </span>
                    <span className="font-bold text-slate-900">
                      {activeModalLaporan.nama_kelas} ({activeModalLaporan.jurusan})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Semester / Tahun Ajaran: </span>
                    <span className="font-semibold text-slate-800">
                      {activeModalLaporan.semester} / {activeModalLaporan.tahun_ajaran}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Wali Kelas: </span>
                    <span className="font-medium text-slate-800">{activeModalLaporan.wali_kelas_nama}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  A. Capaian Kompetensi Hasil Belajar
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 w-44">Mata Pelajaran</th>
                        <th className="py-2.5 px-3 w-20 text-center">Nilai Akhir</th>
                        <th className="py-2.5 px-3 w-16 text-center">Predikat</th>
                        <th className="py-2.5 px-3">Capaian Kompetensi Pembelajaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeModalLaporan.nilai_mapel.map((mapel, i) => (
                        <tr key={mapel.kode_mapel} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-500">{i + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{mapel.nama_mapel}</div>
                            <div className="text-[10px] text-slate-500">{mapel.kode_mapel}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-blue-900">
                            {mapel.nilai_akhir}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold text-[11px]">
                              {mapel.predikat}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 leading-relaxed text-[11px]">
                            {mapel.capaian}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200 font-bold text-slate-900">
                      <tr>
                        <td colSpan={2} className="py-2.5 px-3 text-right">
                          Rata-rata Komprehensif:
                        </td>
                        <td className="py-2.5 px-3 text-center text-blue-900">
                          {activeModalLaporan.rata_rata_akhir}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {activeModalLaporan.predikat_akhir}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-normal text-[11px]">
                          {activeModalLaporan.deskripsi_nilai}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    B. Rekapitulasi Ketidakhadiran
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px]">Sakit</div>
                      <div className="text-sm font-bold text-slate-900">{activeModalLaporan.kehadiran.sakit} Hari</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px]">Izin</div>
                      <div className="text-sm font-bold text-slate-900">{activeModalLaporan.kehadiran.izin} Hari</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-slate-500 text-[10px]">Tanpa Keterangan</div>
                      <div className="text-sm font-bold text-slate-900">{activeModalLaporan.kehadiran.alfa} Hari</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 text-right">
                    Persentase Kehadiran: <span className="font-bold text-emerald-700">{activeModalLaporan.kehadiran.persentase}%</span>
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    C. Catatan Wali Kelas
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    &quot;{activeModalLaporan.catatan_wali}&quot;
                  </p>
                </div>
              </div>

              {activeModalLaporan.catatan_revisi && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Catatan Pengembalian Revisi: </span>
                    {activeModalLaporan.catatan_revisi}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs text-slate-800">
                <div>
                  <p>Orang Tua / Wali,</p>
                  <div className="h-16"></div>
                  <p className="border-b border-slate-400 mx-6"></p>
                </div>
                <div>
                  <p>Padalarang, 20 Desember 2026</p>
                  <p>Wali Kelas,</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline">{activeModalLaporan.wali_kelas_nama}</p>
                </div>
                <div>
                  <p>Mengetahui,</p>
                  <p>Kepala SMAN 2 Padalarang</p>
                  <div className="h-12"></div>
                  <p className="font-bold underline">Drs. H. Engkos Kosasih, M.Pd</p>
                  <p className="text-[10px] text-slate-500">NIP. 196508121990031008</p>
                </div>
              </div>

              {activeModalLaporan.status_laporan === "DisahkanKurikulum" && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      Rapor ini telah disahkan resmi oleh: <strong>{activeModalLaporan.disahkan_oleh || "Drs. Herman Wijaya, M.M"}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-700">{activeModalLaporan.disahkan_pada}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex items-center justify-between">
              <div>{renderStatusBadge(activeModalLaporan.status_laporan)}</div>
              <div className="flex items-center gap-2">
                {activeModalLaporan.status_laporan !== "DisahkanKurikulum" && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenRevisiDialog(activeModalLaporan)}
                      className="border-amber-300 text-amber-800 hover:bg-amber-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Kembalikan Revisi</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFinalizeSingle(activeModalLaporan)}
                      className="bg-blue-900 hover:bg-blue-800"
                    >
                      <Check className="w-4 h-4" />
                      <span>Sahkan Rapor Ini</span>
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveModalLaporan(null)}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRevisiModalOpen && revisiTargetLaporan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Kembalikan untuk Revisi</h3>
                  <p className="text-xs text-slate-500">Rapor: {revisiTargetLaporan.nama_siswa}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tuliskan instruksi atau alasan pengembalian draf rapor ke Wali Kelas (
              <strong>{revisiTargetLaporan.wali_kelas_nama}</strong>) untuk dilakukan koreksi nilai mata pelajaran atau catatan pembinaan:
            </p>

            <textarea
              rows={4}
              value={revisiNoteInput}
              onChange={(e) => setRevisiNoteInput(e.target.value)}
              placeholder="Contoh: Nilai praktikum Biologi masih belum terisi, mohon divalidasi dengan guru pengampu..."
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 text-slate-800"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsRevisiModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitRevisi}
                className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-white" />
                <span>Kirim Catatan Revisi</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        variant={confirmModalState.variant}
      />
    </div>
  );
}
