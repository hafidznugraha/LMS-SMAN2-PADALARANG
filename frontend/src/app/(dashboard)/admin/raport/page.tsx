"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  Download,
  Lock,
  Printer,
  Hourglass,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Search,
  SlidersHorizontal,
  Check,
  AlertCircle,
  XCircle,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  X,
  Send,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

interface NilaiMapelItem {
  kode: string;
  nama: string;
  kategori: string;
  pengetahuan: number;
  keterampilan: number;
  nilaiAkhir: number;
  predikat: "A" | "B" | "C" | "D";
  capaian: string;
}

interface StudentRaportData {
  id: string;
  nisn: string;
  nis: string;
  nama: string;
  gender: "Laki-Laki" | "Perempuan";
  initials: string;
  initialsBg: string;
  initialsColor: string;
  rombel: string;
  tingkat: "X" | "XI" | "XII";
  fase: string;
  faseBadgeBg: string;
  faseBadgeColor: string;
  waliKelas: string;
  waliNip: string;
  rataRata: number;
  statusKkm: "Tuntas KKM" | "Cukup" | "Di Bawah KKM";
  statusKkmColor: string;
  statusRaport: "ready" | "review" | "draft";
  statusLabel: string;
  komponenDeskripsi: string;
  komponenIcon: "check" | "warning" | "cancel";
  ekskulCount: number;
  presensiPercent: number;
  presensiDetail: { sakit: number; izin: number; alfa: number };
  catatanStatus: string;
  catatanWali: string;
  nilaiMapel: NilaiMapelItem[];
  catatanRevisi?: string;
  isLocked: boolean;
}

const SEED_RAPORT_STUDENTS: StudentRaportData[] = [
  {
    id: "sis-001",
    nisn: "0064829103",
    nis: "24251001",
    nama: "Ahmad Rayhan Al-Fatih",
    gender: "Laki-Laki",
    initials: "AR",
    initialsBg: "bg-blue-100",
    initialsColor: "text-blue-900",
    rombel: "XII MIPA 1",
    tingkat: "XII",
    fase: "Tingkat XII",
    faseBadgeBg: "bg-amber-100",
    faseBadgeColor: "text-amber-900",
    waliKelas: "Dra. Nining Nurhayati, M.Pd",
    waliNip: "196811051994122001",
    rataRata: 89.4,
    statusKkm: "Tuntas KKM",
    statusKkmColor: "text-emerald-600",
    statusRaport: "ready",
    statusLabel: "Siap Cetak",
    komponenDeskripsi: "Nilai TP/CP (14 Mapel Lengkap)",
    komponenIcon: "check",
    ekskulCount: 2,
    presensiPercent: 100,
    presensiDetail: { sakit: 0, izin: 0, alfa: 0 },
    catatanStatus: "Catatan Lengkap",
    catatanWali: "Sangat aktif dalam pembelajaran, memiliki kepemimpinan kuat dan konsistensi akademik yang patut diteladani.",
    isLocked: true,
    nilaiMapel: [
      { kode: "MTK-XII", nama: "Matematika Peminatan", kategori: "Peminatan MIPA", pengetahuan: 92, keterampilan: 94, nilaiAkhir: 93.0, predikat: "A", capaian: "Sangat unggul dalam menyelesaikan masalah diferensial dan matriks spasial." },
      { kode: "FIS-XII", nama: "Fisika", kategori: "Peminatan MIPA", pengetahuan: 88, keterampilan: 90, nilaiAkhir: 89.0, predikat: "A", capaian: "Memahami konsep rangkaian listrik arus bolak-balik dengan sangat baik." },
      { kode: "BIO-XII", nama: "Biologi", kategori: "Peminatan MIPA", pengetahuan: 89, keterampilan: 91, nilaiAkhir: 90.0, predikat: "A", capaian: "Unggul dalam memahami materi genetika molekuler dan sintesis protein." },
      { kode: "KIM-XII", nama: "Kimia", kategori: "Peminatan MIPA", pengetahuan: 87, keterampilan: 89, nilaiAkhir: 88.0, predikat: "A", capaian: "Mampu mempraktikkan titrasi asam-basa dan termokimia dengan presisi." },
      { kode: "BIN-XII", nama: "Bahasa Indonesia", kategori: "Umum", pengetahuan: 88, keterampilan: 88, nilaiAkhir: 88.0, predikat: "A", capaian: "Terampil dalam menyusun artikel opini ilmiah dan editorial kritis." },
      { kode: "BIG-XII", nama: "Bahasa Inggris", kategori: "Umum", pengetahuan: 88, keterampilan: 89, nilaiAkhir: 88.5, predikat: "A", capaian: "Fasih dalam menyajikan presentasi argumentatif bahasa Inggris akademik." },
    ],
  },
  {
    id: "sis-002",
    nisn: "0071984211",
    nis: "24251002",
    nama: "Cantika Larasati Putri",
    gender: "Perempuan",
    initials: "CL",
    initialsBg: "bg-amber-100",
    initialsColor: "text-amber-900",
    rombel: "XI F-4",
    tingkat: "XI",
    fase: "Fase F",
    faseBadgeBg: "bg-emerald-100",
    faseBadgeColor: "text-emerald-800",
    waliKelas: "Bambang Sutejo, S.Pd., M.Si",
    waliNip: "198002142005011003",
    rataRata: 78.1,
    statusKkm: "Cukup",
    statusKkmColor: "text-amber-600",
    statusRaport: "review",
    statusLabel: "Perlu Review",
    komponenDeskripsi: "Deskripsi CP Biologi belum diisi guru",
    komponenIcon: "warning",
    ekskulCount: 1,
    presensiPercent: 96,
    presensiDetail: { sakit: 2, izin: 1, alfa: 0 },
    catatanStatus: "Review Wali",
    catatanWali: "Perkembangan belajar cukup baik. Disarankan lebih aktif dalam praktikum kelompok untuk mengasah pemahaman mandiri.",
    isLocked: false,
    nilaiMapel: [
      { kode: "MTK-XI", nama: "Matematika", kategori: "Umum", pengetahuan: 78, keterampilan: 80, nilaiAkhir: 79.0, predikat: "B", capaian: "Mampu menyelesaikan persoalan geometri analitis dan transformasi fungsi." },
      { kode: "FIS-XI", nama: "Fisika", kategori: "Pilihan", pengetahuan: 76, keterampilan: 78, nilaiAkhir: 77.0, predikat: "B", capaian: "Memahami konsep fluida dinamis dan termodinamika secara mendasar." },
      { kode: "BIO-XI", nama: "Biologi", kategori: "Pilihan", pengetahuan: 79, keterampilan: 81, nilaiAkhir: 80.0, predikat: "B", capaian: "Deskripsi capaian kompetensi menunggu validasi guru pengampu." },
      { kode: "BIN-XI", nama: "Bahasa Indonesia", kategori: "Umum", pengetahuan: 82, keterampilan: 80, nilaiAkhir: 81.0, predikat: "B", capaian: "Mampu mengidentifikasi gagasan utama teks eksposisi secara kritis." },
    ],
  },
  {
    id: "sis-003",
    nisn: "0089201948",
    nis: "24251003",
    nama: "Fajar Ananda Ramadhan",
    gender: "Laki-Laki",
    initials: "FA",
    initialsBg: "bg-red-100",
    initialsColor: "text-red-700",
    rombel: "X-1",
    tingkat: "X",
    fase: "Fase E",
    faseBadgeBg: "bg-blue-100",
    faseBadgeColor: "text-blue-900",
    waliKelas: "Siti Hajar, S.Pd",
    waliNip: "198506192009022004",
    rataRata: 64.5,
    statusKkm: "Di Bawah KKM",
    statusKkmColor: "text-red-600",
    statusRaport: "draft",
    statusLabel: "Draft Belum Lengkap",
    komponenDeskripsi: "3 Mata Pelajaran belum ada nilai sumatif",
    komponenIcon: "cancel",
    ekskulCount: 0,
    presensiPercent: 88,
    presensiDetail: { sakit: 4, izin: 2, alfa: 4 },
    catatanStatus: "Draft",
    catatanWali: "Perlu bimbingan intensif dan koordinasi dengan orang tua mengenai kehadiran serta remedial tugas yang tertunda.",
    isLocked: false,
    nilaiMapel: [
      { kode: "MTK-X", nama: "Matematika", kategori: "Umum", pengetahuan: 62, keterampilan: 65, nilaiAkhir: 63.5, predikat: "D", capaian: "Perlu bimbingan dalam operasi logaritma dan barisan deret." },
      { kode: "IPA-X", nama: "IPA Terpadu", kategori: "Umum", pengetahuan: 64, keterampilan: 66, nilaiAkhir: 65.0, predikat: "C", capaian: "Cukup dalam pemahaman konsep pengukuran dan metode ilmiah." },
      { kode: "IPS-X", nama: "IPS Terpadu", kategori: "Umum", pengetahuan: 65, keterampilan: 65, nilaiAkhir: 65.0, predikat: "C", capaian: "Memerlukan remedial pemahaman dinamika interaksi sosial." },
    ],
  },
  {
    id: "sis-004",
    nisn: "0068412093",
    nis: "24251004",
    nama: "Nurul Zahra Maulida",
    gender: "Perempuan",
    initials: "NZ",
    initialsBg: "bg-blue-100",
    initialsColor: "text-blue-900",
    rombel: "XII MIPA 2",
    tingkat: "XII",
    fase: "Tingkat XII",
    faseBadgeBg: "bg-amber-100",
    faseBadgeColor: "text-amber-900",
    waliKelas: "Cecep Hendrawan, S.Pd., M.M",
    waliNip: "197805122002121002",
    rataRata: 92.8,
    statusKkm: "Tuntas KKM",
    statusKkmColor: "text-emerald-600",
    statusRaport: "ready",
    statusLabel: "Siap Cetak",
    komponenDeskripsi: "Lengkap 14 Mapel Terakreditasi",
    komponenIcon: "check",
    ekskulCount: 2,
    presensiPercent: 100,
    presensiDetail: { sakit: 0, izin: 0, alfa: 0 },
    catatanStatus: "Catatan Baik",
    catatanWali: "Peringkat 1 rombel dengan dedikasi belajar luar biasa. Pertahankan prestasi gemilang ini di jenjang perguruan tinggi.",
    isLocked: true,
    nilaiMapel: [
      { kode: "MTK-XII", nama: "Matematika Peminatan", kategori: "Peminatan MIPA", pengetahuan: 95, keterampilan: 96, nilaiAkhir: 95.5, predikat: "A", capaian: "Sangat menguasai konsep limit tak hingga dan turunan fungsi trigonometri." },
      { kode: "FIS-XII", nama: "Fisika", kategori: "Peminatan MIPA", pengetahuan: 92, keterampilan: 94, nilaiAkhir: 93.0, predikat: "A", capaian: "Sangat mahir dalam pemecahan soal fisika kuantum dan medan elektromagnetik." },
      { kode: "BIO-XII", nama: "Biologi", kategori: "Peminatan MIPA", pengetahuan: 91, keterampilan: 93, nilaiAkhir: 92.0, predikat: "A", capaian: "Sangat baik dalam pemahaman bioteknologi modern dan rekayasa genetika." },
      { kode: "KIM-XII", nama: "Kimia", kategori: "Peminatan MIPA", pengetahuan: 90, keterampilan: 92, nilaiAkhir: 91.0, predikat: "A", capaian: "Sangat terampil dalam praktikum elektrokimia dan reaksi redoks." },
    ],
  },
  {
    id: "sis-005",
    nisn: "0081029384",
    nis: "24251005",
    nama: "Rizky Gilang Pratama",
    gender: "Laki-Laki",
    initials: "RG",
    initialsBg: "bg-indigo-100",
    initialsColor: "text-indigo-900",
    rombel: "X-2",
    tingkat: "X",
    fase: "Fase E",
    faseBadgeBg: "bg-blue-100",
    faseBadgeColor: "text-blue-900",
    waliKelas: "Dewi Sartika, S.Pd",
    waliNip: "198904152014032001",
    rataRata: 85.6,
    statusKkm: "Tuntas KKM",
    statusKkmColor: "text-emerald-600",
    statusRaport: "ready",
    statusLabel: "Siap Cetak",
    komponenDeskripsi: "CP Lengkap (Projek P5 Terdata)",
    komponenIcon: "check",
    ekskulCount: 1,
    presensiPercent: 98,
    presensiDetail: { sakit: 1, izin: 0, alfa: 0 },
    catatanStatus: "Tervalidasi",
    catatanWali: "Sangat kooperatif dan menunjukkan antusiasme tinggi dalam pelaksanaan projek penguatan profil pelajar Pancasila (P5).",
    isLocked: true,
    nilaiMapel: [
      { kode: "MTK-X", nama: "Matematika", kategori: "Umum", pengetahuan: 84, keterampilan: 86, nilaiAkhir: 85.0, predikat: "B", capaian: "Mampu memodelkan persamaan eksponensial dalam kehidupan sehari-hari." },
      { kode: "IPA-X", nama: "IPA Terpadu", kategori: "Umum", pengetahuan: 86, keterampilan: 88, nilaiAkhir: 87.0, predikat: "A", capaian: "Sangat baik dalam merancang percobaan sains sederhana berprinsip ramah lingkungan." },
      { kode: "BIN-X", nama: "Bahasa Indonesia", kategori: "Umum", pengetahuan: 85, keterampilan: 85, nilaiAkhir: 85.0, predikat: "B", capaian: "Terampil dalam menyusun teks laporan hasil observasi objektif." },
    ],
  },
];

export default function VerifikasiRaportPage() {
  const [students, setStudents] = useState<StudentRaportData[]>(SEED_RAPORT_STUDENTS);
  const [selectedTab, setSelectedTab] = useState<"all" | "ready" | "review" | "draft">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTingkat, setSelectedTingkat] = useState("all");
  const [selectedRombel, setSelectedRombel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [activeModalStudent, setActiveModalStudent] = useState<StudentRaportData | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewTargetStudent, setReviewTargetStudent] = useState<StudentRaportData | null>(null);
  const [reviewNoteInput, setReviewNoteInput] = useState("");

  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "primary" | "danger" | "warning";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const printAreaRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    return {
      all: 823,
      ready: 746,
      review: 53,
      draft: 24,
    };
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      if (selectedTab !== "all" && item.statusRaport !== selectedTab) {
        return false;
      }
      if (selectedTingkat !== "all" && item.tingkat !== selectedTingkat) {
        return false;
      }
      if (selectedRombel !== "all" && item.rombel !== selectedRombel) {
        return false;
      }
      if (selectedStatus !== "all" && item.statusRaport !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.nama.toLowerCase().includes(q);
        const matchNisn = item.nisn.includes(q) || item.nis.includes(q);
        const matchWali = item.waliKelas.toLowerCase().includes(q);
        const matchRombel = item.rombel.toLowerCase().includes(q);
        if (!matchName && !matchNisn && !matchWali && !matchRombel) {
          return false;
        }
      }
      return true;
    });
  }, [students, selectedTab, selectedTingkat, selectedRombel, selectedStatus, searchQuery]);

  const isAllRowsSelected =
    filteredStudents.length > 0 &&
    filteredStudents.every((s) => selectedRowIds.includes(s.id));

  const handleToggleSelectAll = () => {
    if (isAllRowsSelected) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleToggleRowSelect = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleLockSingle = (student: StudentRaportData) => {
    setConfirmModalState({
      isOpen: true,
      title: "Verifikasi & Kunci Nilai Raport",
      message: `Apakah Anda yakin ingin memverifikasi dan mengunci nilai raport siswa "${student.nama}" (${student.rombel})? Nilai akan berstatus permanen (read-only lock) dan izin cetak e-Rapor resmi diterbitkan.`,
      confirmText: "Ya, Kunci Nilai",
      variant: "primary",
      onConfirm: () => {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  statusRaport: "ready",
                  statusLabel: "Siap Cetak",
                  isLocked: true,
                }
              : s
          )
        );
        if (activeModalStudent?.id === student.id) {
          setActiveModalStudent((prev) =>
            prev ? { ...prev, statusRaport: "ready", statusLabel: "Siap Cetak", isLocked: true } : null
          );
        }
        toast.success(`Raport ${student.nama} berhasil diverifikasi dan dikunci resmi.`);
        setConfirmModalState((p) => ({ ...p, isOpen: false }));
      },
    });
  };

  const handleLockAllSchool = () => {
    setConfirmModalState({
      isOpen: true,
      title: "Konfirmasi Penguncian Massal",
      message: "Memeriksa 823 siswa aktif. Sebanyak 746 raport tervalidasi siap dikunci permanen. Setelah dikunci, guru pengampu tidak dapat menyunting nilai tanpa rekomendasi Waka Kurikulum. Lanjutkan?",
      confirmText: "Kunci Seluruh Nilai",
      variant: "danger",
      onConfirm: () => {
        setStudents((prev) =>
          prev.map((s) => ({
            ...s,
            statusRaport: "ready",
            statusLabel: "Siap Cetak",
            isLocked: true,
          }))
        );
        toast.success("Penguncian massal berhasil: 746 raport terkunci permanen.");
        setConfirmModalState((p) => ({ ...p, isOpen: false }));
      },
    });
  };

  const handleExportRekapNilai = () => {
    const headers = [
      "No",
      "NISN",
      "NIS",
      "Nama Siswa",
      "Jenis Kelamin",
      "Rombel",
      "Wali Kelas",
      "Rata-Rata Nilai",
      "Status KKM",
      "Kelengkapan Komponen",
      "Presensi (%)",
      "Status Raport",
    ];

    const rows = filteredStudents.map((item, index) => [
      index + 1,
      `'${item.nisn}`,
      `'${item.nis}`,
      `"${item.nama}"`,
      item.gender,
      `"${item.rombel}"`,
      `"${item.waliKelas}"`,
      item.rataRata,
      item.statusKkm,
      `"${item.komponenDeskripsi}"`,
      item.presensiPercent,
      item.statusLabel,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Nilai_Raport_SMAN2_Padalarang_TA_2025_2026_Ganjil.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Data raport semester ganjil sedang digenerate ke format Excel/CSV (.csv)");
  };

  const handleBatchPrint = () => {
    toast.info("Antrean Cetak Dimulai: Menyiapkan dokumen raport tervalidasi dengan template Kurikulum Merdeka");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleOpenReviewDialog = (student: StudentRaportData) => {
    setReviewTargetStudent(student);
    setReviewNoteInput(student.catatanRevisi || "");
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReviewNote = () => {
    if (!reviewTargetStudent) return;
    if (!reviewNoteInput.trim()) {
      toast.error("Mohon masukkan catatan perbaikan untuk guru pengampu / wali kelas.");
      return;
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === reviewTargetStudent.id
          ? {
              ...s,
              statusRaport: "review",
              statusLabel: "Perlu Review",
              catatanRevisi: reviewNoteInput.trim(),
            }
          : s
      )
    );

    toast.warning(`Notifikasi tindak lanjut dikirim ke ${reviewTargetStudent.waliKelas}`);
    setIsReviewDialogOpen(false);
    setReviewTargetStudent(null);
    setReviewNoteInput("");
  };

  return (
    <div className="flex flex-col w-full pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-[#172554]">
              Verifikasi &amp; Laporan Raport Siswa
            </h1>
            <span className="text-xl">📑</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase">
              Aktif Penilaian
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring validasi nilai capaian pembelajaran TP/CP, status kunci nilai, dan kesiapan cetak e-Rapor SMAN 2 Padalarang Semester Ganjil TA 2025/2026.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportRekapNilai}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-[#172554] font-semibold text-sm border border-slate-200/80 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Rekap Nilai</span>
          </button>
          <button
            type="button"
            onClick={handleLockAllSchool}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 font-semibold text-sm border border-slate-200/80 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Lock className="w-4 h-4 text-red-600" />
            <span>Kunci Seluruh Nilai</span>
          </button>
          <button
            type="button"
            onClick={handleBatchPrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A8A] text-white hover:bg-[#172554] font-semibold text-sm shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Raport Masal</span>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 mb-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Hourglass className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-[#172554]">
                  Batas Akhir Validasi &amp; Kunci Nilai: 24 Oktober 2026
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase animate-pulse">
                  Sisa 11 Hari
                </span>
              </div>
              <p className="text-xs text-[#172554]/80 mt-0.5 leading-relaxed">
                Sesuai edaran Pengawas SMA Cabang Dinas Wilayah VI &amp; Balai Besar Penjaminan Mutu. Rombel yang telah terkunci tidak dapat disunting kembali oleh Guru Pengampu tanpa rekomendasi Waka Kurikulum.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs text-[#172554] font-medium">Sinkronisasi Dapodik:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-[#172554] text-xs font-semibold shadow-2xs border border-amber-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinkron Terakhir 08:30 WIB
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative overflow-hidden rounded-2xl bg-[#1D4ED8] text-white p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">
                Raport Tervalidasi
              </span>
              <span className="text-3xl font-extrabold tracking-tight mt-1 text-white">
                {counts.ready}{" "}
                <span className="text-lg font-normal text-blue-200">/ {counts.all}</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/10 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-emerald-300">90.6% Siap</span>
              <span className="text-blue-100 text-[13px]">siap cetak e-Rapor</span>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Menunggu Verifikasi
              </span>
              <span className="text-3xl font-extrabold tracking-tight mt-1 text-[#172554]">
                {counts.review}{" "}
                <span className="text-base font-normal text-slate-400">Siswa</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 bg-slate-50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>4 Rombel perlu review Waka</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTab("review")}
              className="text-xs font-semibold text-amber-600 hover:underline cursor-pointer"
            >
              Periksa
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Belum Tuntas (Draft)
              </span>
              <span className="text-3xl font-extrabold tracking-tight mt-1 text-red-600">
                {counts.draft}{" "}
                <span className="text-base font-normal text-slate-400">Siswa</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 bg-slate-50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>Nilai belum lengkap dari Guru</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTab("draft")}
              className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
            >
              Detail
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Rata-Rata Akademik
              </span>
              <span className="text-3xl font-extrabold tracking-tight mt-1 text-[#172554]">
                84.2{" "}
                <span className="text-base font-semibold text-emerald-600">/ 100</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between pt-3 bg-slate-50 -mx-5 -mb-5 px-5 py-2.5 rounded-b-2xl border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>KKM Sekolah: 75.0 (Tercapai)</span>
            </div>
            <span className="text-xs font-medium text-slate-400">+1.8 YoY</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 mb-6 shadow-xs border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172554]">
                Kesiapan Rapor Berdasarkan Tingkat &amp; Rombongan Belajar
              </h2>
              <p className="text-xs text-slate-500">Total 24 Rombel aktif di Semester Ganjil 2025/2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-[#172554]"></span>
              Kurikulum Merdeka Mandiri Berbagi
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 p-4 flex flex-col justify-between hover:bg-slate-100/70 transition-colors border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1D4ED8] text-[10px] font-bold">
                  FASE E
                </span>
                <span className="font-semibold text-sm text-[#172554]">Kelas X</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#172554] text-[10px] font-semibold">
                Review Akhir
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>254 dari 276 Siswa (8 Rombel)</span>
                <span className="font-semibold text-[#172554]">92%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-[#1D4ED8] transition-all" style={{ width: "92%" }}></div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-slate-400 text-[10px] border-t border-slate-200/80">
              <span>X-1 s/d X-8</span>
              <span className="text-amber-600 font-semibold">1 Rombel Menunggu</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 flex flex-col justify-between hover:bg-slate-100/70 transition-colors border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  FASE F
                </span>
                <span className="font-semibold text-sm text-[#172554]">Kelas XI</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-semibold">
                2 Rombel Pending
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>230 dari 271 Siswa (8 Rombel)</span>
                <span className="font-semibold text-[#172554]">85%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-slate-400 text-[10px] border-t border-slate-200/80">
              <span>XI F-1 s/d XI F-8</span>
              <span className="text-red-600 font-semibold">Catatan Wali Belum Lengkap</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 flex flex-col justify-between hover:bg-slate-100/70 transition-colors border border-slate-200/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-[#172554] text-[10px] font-bold">
                  K-MERDEKA
                </span>
                <span className="font-semibold text-sm text-[#172554]">Kelas XII</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                Siap Kunci &amp; Cetak
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>262 dari 276 Siswa (8 Rombel)</span>
                <span className="font-semibold text-[#172554]">96%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: "96%" }}></div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-slate-400 text-[10px] border-t border-slate-200/80">
              <span>XII MIPA &amp; IPS (1-8)</span>
              <span className="text-emerald-700 font-semibold">Siap Ditandatangani KS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-xs border border-slate-200/80 overflow-hidden flex flex-col">
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1 overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setSelectedTab("all")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === "all"
                    ? "bg-[#172554] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semua Siswa{" "}
                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${
                    selectedTab === "all" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  823
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("ready")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === "ready"
                    ? "bg-[#172554] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Siap Cetak{" "}
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                  746
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("review")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === "review"
                    ? "bg-[#172554] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Perlu Review{" "}
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-[#172554] text-[10px]">
                  53
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTab("draft")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === "draft"
                    ? "bg-[#172554] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Draft Belum Lengkap{" "}
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px]">
                  24
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedRowIds.length > 0 && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-blue-100 text-[#172554] font-semibold animate-fade-in">
                  {selectedRowIds.length} Dipilih
                </span>
              )}
              <button
                type="button"
                onClick={() => toast.info("Fitur kustomisasi kolom aktif")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 text-xs font-medium transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Konfigurasi Kolom</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama siswa, NISN, atau wali kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-900/20 border border-slate-200 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedTingkat}
                onChange={(e) => setSelectedTingkat(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-900/20 border border-slate-200 transition-all cursor-pointer"
              >
                <option value="all">Semua Tingkat</option>
                <option value="X">Kelas X (Fase E)</option>
                <option value="XI">Kelas XI (Fase F)</option>
                <option value="XII">Kelas XII (K-Merdeka)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedRombel}
                onChange={(e) => setSelectedRombel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-900/20 border border-slate-200 transition-all cursor-pointer"
              >
                <option value="all">Semua Rombel</option>
                <option value="XII MIPA 1">XII MIPA 1</option>
                <option value="XII MIPA 2">XII MIPA 2</option>
                <option value="XI F-4">XI F-4</option>
                <option value="X-1">X-1</option>
                <option value="X-2">X-2</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 text-slate-800 text-xs focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-900/20 border border-slate-200 transition-all cursor-pointer"
              >
                <option value="all">Semua Status Raport</option>
                <option value="ready">Siap Cetak (Tervalidasi)</option>
                <option value="review">Perlu Review Waka</option>
                <option value="draft">Draft Belum Lengkap</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-y border-slate-200">
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllRowsSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900/30 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4 min-w-[220px]">Identitas Siswa</th>
                <th className="py-3.5 px-4 min-w-[130px]">Rombel / Fase</th>
                <th className="py-3.5 px-4 min-w-[190px]">Wali Kelas Pengampu</th>
                <th className="py-3.5 px-4 min-w-[110px]">Rata-Rata</th>
                <th className="py-3.5 px-4 min-w-[220px]">Kelengkapan Komponen</th>
                <th className="py-3.5 px-4 min-w-[150px]">Status Raport</th>
                <th className="py-3.5 px-4 min-w-[150px] text-right">Aksi Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada siswa yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item) => {
                  const isChecked = selectedRowIds.includes(item.id);
                  const isReady = item.statusRaport === "ready";
                  const isReview = item.statusRaport === "review";
                  const isDraft = item.statusRaport === "draft";

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 transition-colors group ${
                        isReview ? "bg-amber-50/20" : isDraft ? "bg-red-50/20" : ""
                      }`}
                    >
                      <td className="py-4 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRowSelect(item.id)}
                          className="w-4 h-4 rounded text-blue-900 focus:ring-blue-900/30 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full ${item.initialsBg} ${item.initialsColor} flex items-center justify-center font-bold text-xs shrink-0`}
                          >
                            {item.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors truncate">
                              {item.nama}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">NISN: {item.nisn}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] text-slate-500">{item.gender}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{item.rombel}</span>
                          <span
                            className={`inline-flex mt-0.5 px-2 py-0.5 rounded w-fit ${item.faseBadgeBg} ${item.faseBadgeColor} text-[10px] font-bold`}
                          >
                            {item.fase}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">{item.waliKelas}</span>
                          <span className="text-[10px] text-slate-400">NIP: {item.waliNip}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className={`text-base font-bold ${item.statusKkmColor}`}>
                            {item.rataRata.toFixed(1)}
                          </span>
                          <span className={`text-[10px] flex items-center gap-0.5 font-semibold ${item.statusKkmColor}`}>
                            {item.statusKkm === "Tuntas KKM" && <Check className="w-3 h-3" />}
                            {item.statusKkm}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            {item.komponenIcon === "check" && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                            {item.komponenIcon === "warning" && (
                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                            )}
                            {item.komponenIcon === "cancel" && (
                              <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                            <span className="text-xs text-slate-600 font-medium">
                              {item.komponenDeskripsi}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[#172554] text-[10px] font-medium">
                              Ekskul ({item.ekskulCount})
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[#172554] text-[10px] font-medium">
                              Presensi: {item.presensiPercent}%
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                isReady
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isReview
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.catatanStatus}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${
                            isReady
                              ? "bg-emerald-100 text-emerald-800"
                              : isReview
                              ? "bg-amber-100 text-amber-900"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isReady ? "bg-emerald-600" : isReview ? "bg-amber-500" : "bg-red-600"
                            }`}
                          ></span>
                          {item.statusLabel}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReview && (
                            <button
                              type="button"
                              onClick={() => handleOpenReviewDialog(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-all cursor-pointer"
                              title="Kirim Masukan Review ke Wali"
                            >
                              Review
                            </button>
                          )}
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => handleOpenReviewDialog(item)}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Panggilan Koordinasi Wali Kelas"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleLockSingle(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-[#172554] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Verifikasi &amp; Kunci Nilai"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveModalStudent(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-[#1D4ED8] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Preview e-Rapor PDF"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.info(`Opsi lanjutan untuk ${item.nama}`)}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Opsi Lanjutan"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-slate-100 text-slate-800 border-0 focus:ring-1 focus:ring-blue-900/30 cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>
              Menampilkan <strong className="text-[#172554] font-semibold">1-{filteredStudents.length}</strong> dari{" "}
              <strong className="text-[#172554] font-semibold">{counts.all}</strong> Siswa
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all disabled:opacity-40 cursor-pointer"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs bg-[#172554] text-white shadow-xs cursor-pointer"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => toast.info("Halaman 2")}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-medium text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => toast.info("Halaman 3")}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-medium text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button
              type="button"
              onClick={() => toast.info("Halaman 83")}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-medium text-xs text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              83
            </button>
            <button
              type="button"
              onClick={() => toast.info("Halaman berikutnya")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Halaman terakhir")}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {activeModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white/95 backdrop-blur-xs px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                  <FileCheck className="w-5 h-5 text-blue-900" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pratinjau e-Rapor Resmi Siswa
                  </h3>
                  <p className="text-xs text-slate-500">
                    SMAN 2 Padalarang • Semester Ganjil TA 2025/2026
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / PDF</span>
                </Button>
                <button
                  type="button"
                  onClick={() => setActiveModalStudent(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div ref={printAreaRef} className="p-6 md:p-8 space-y-6 text-slate-800">
              <div className="border-b-2 border-slate-900 pb-4 flex items-center gap-4">
                <div className="w-16 h-16 relative shrink-0">
                  <Image
                    src="/logo-sman2.png"
                    alt="Logo SMAN 2 Padalarang"
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 text-center pr-16">
                  <h4 className="text-xs font-semibold tracking-wider uppercase text-slate-600">
                    Pemerintah Daerah Provinsi Jawa Barat • Dinas Pendidikan
                  </h4>
                  <h2 className="text-lg md:text-xl font-extrabold uppercase text-slate-900 tracking-tight">
                    SMA Negeri 2 Padalarang
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Jl. GA Manulang No. 23, Jaya Mekar, Kec. Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    NPSN: 20227903 • Akreditasi: A • Website: www.sman2padalarang.sch.id
                  </p>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-slate-900 uppercase tracking-wide">
                  Laporan Hasil Belajar Peserta Didik (e-Rapor)
                </h3>
                <p className="text-xs text-slate-600">
                  Semester Ganjil • Tahun Ajaran 2025/2026
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500">Nama Siswa</span>
                    <span className="font-bold text-slate-900">: {activeModalStudent.nama}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500">Nomor Induk / NISN</span>
                    <span className="font-mono text-slate-800">: {activeModalStudent.nis} / {activeModalStudent.nisn}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500">Jenis Kelamin</span>
                    <span className="text-slate-800">: {activeModalStudent.gender}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex">
                    <span className="w-32 text-slate-500">Kelas / Fase</span>
                    <span className="font-bold text-slate-900">: {activeModalStudent.rombel} ({activeModalStudent.fase})</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500">Tingkat Sekolah</span>
                    <span className="text-slate-800">: Kelas {activeModalStudent.tingkat}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-500">Wali Kelas</span>
                    <span className="font-semibold text-slate-800">: {activeModalStudent.waliKelas}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  A. Capaian Kompetensi Nilai Akademik
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                        <th className="py-2 px-3 text-center w-10">No</th>
                        <th className="py-2 px-3">Mata Pelajaran</th>
                        <th className="py-2 px-3 text-center w-24">Pengetahuan</th>
                        <th className="py-2 px-3 text-center w-24">Keterampilan</th>
                        <th className="py-2 px-3 text-center w-20">Nilai Akhir</th>
                        <th className="py-2 px-3 text-center w-16">Predikat</th>
                        <th className="py-2 px-3">Capaian Kompetensi TP/CP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeModalStudent.nilaiMapel.map((mapel, idx) => (
                        <tr key={mapel.kode} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            <div>{mapel.nama}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{mapel.kategori}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium">{mapel.pengetahuan}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-medium">{mapel.keterampilan}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-900">{mapel.nilaiAkhir}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{mapel.predikat}</td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-600 leading-relaxed">{mapel.capaian}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                        <td colSpan={2} className="py-2.5 px-3 text-right text-slate-700">
                          Rata-rata Nilai Semester:
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {(
                            activeModalStudent.nilaiMapel.reduce((a, b) => a + b.pengetahuan, 0) /
                            activeModalStudent.nilaiMapel.length
                          ).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {(
                            activeModalStudent.nilaiMapel.reduce((a, b) => a + b.keterampilan, 0) /
                            activeModalStudent.nilaiMapel.length
                          ).toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-blue-900 text-sm">
                          {activeModalStudent.rataRata.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-sm">{activeModalStudent.statusKkm}</td>
                        <td className="py-2.5 px-3 text-[11px] font-normal text-slate-600">
                          {activeModalStudent.komponenDeskripsi}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    B. Catatan Ketidakhadiran (Presensi)
                  </h4>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs space-y-2">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">1. Sakit (S)</span>
                      <span className="font-bold">{activeModalStudent.presensiDetail.sakit} hari</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">2. Izin (I)</span>
                      <span className="font-bold">{activeModalStudent.presensiDetail.izin} hari</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">3. Tanpa Keterangan (A)</span>
                      <span className="font-bold">{activeModalStudent.presensiDetail.alfa} hari</span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-slate-900">
                      <span>Tingkat Kehadiran:</span>
                      <span className="text-emerald-700">{activeModalStudent.presensiPercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    C. Catatan Perkembangan Wali Kelas
                  </h4>
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs min-h-[110px] flex flex-col justify-between">
                    <p className="text-slate-700 italic leading-relaxed">
                      &quot;{activeModalStudent.catatanWali}&quot;
                    </p>
                    <div className="text-right text-[11px] text-slate-500 font-semibold mt-2">
                      - {activeModalStudent.waliKelas}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="text-slate-700 font-semibold mb-12">Orang Tua / Wali Siswa</p>
                  <p className="border-b border-slate-400 w-36 mx-auto mb-1"></p>
                  <p className="text-[10px] text-slate-400">(Tanda Tangan &amp; Nama Terang)</p>
                </div>

                <div>
                  <p className="text-slate-500">Padalarang, 24 Oktober 2026</p>
                  <p className="text-slate-700 font-semibold mb-12">Wali Kelas,</p>
                  <p className="font-bold text-slate-900 underline">{activeModalStudent.waliKelas}</p>
                  <p className="text-[10px] text-slate-500">NIP: {activeModalStudent.waliNip}</p>
                </div>

                <div>
                  <p className="text-slate-500">Mengesahkan,</p>
                  <p className="text-slate-700 font-semibold mb-12">Wakasek Bidang Kurikulum,</p>
                  <p className="font-bold text-blue-900 underline">Drs. Herman Wijaya, M.M</p>
                  <p className="text-[10px] text-slate-500">NIP: 196804151994031004</p>
                </div>
              </div>

              {activeModalStudent.isLocked ? (
                <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Dokumen Resmi Terkunci: </span>
                    Laporan hasil belajar ini telah diverifikasi dan disahkan secara sah oleh Bidang Kurikulum. Data nilai bersifat tetap (read-only) dan siap cetak.
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">Status Menunggu Pengesahan: </span>
                      Draf raport ini perlu diverifikasi kelengkapan komponen nilainya sebelum dikunci permanen.
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenReviewDialog(activeModalStudent)}
                      className="text-amber-800 hover:bg-amber-100 border-amber-300"
                    >
                      <span>Minta Revisi</span>
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleLockSingle(activeModalStudent)}
                      className="bg-[#1E3A8A] hover:bg-[#172554]"
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Kunci &amp; Sahkan</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                LMS Terpadu SMAN 2 Padalarang • Hak Cipta Kurikulum
              </span>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setActiveModalStudent(null)}
              >
                Tutup Pratinjau
              </Button>
            </div>
          </div>
        </div>
      )}

      {isReviewDialogOpen && reviewTargetStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Kirim Masukan Review / Revisi Nilai
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Siswa: {reviewTargetStudent.nama} ({reviewTargetStudent.rombel})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewDialogOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Catatan Tindak Lanjut untuk Wali Kelas ({reviewTargetStudent.waliKelas}):
              </label>
              <textarea
                rows={4}
                value={reviewNoteInput}
                onChange={(e) => setReviewNoteInput(e.target.value)}
                placeholder="Contoh: Mohon koordinasi dengan guru Biologi untuk melengkapi deskripsi capaian pembelajaran TP/CP..."
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 text-slate-800 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitReviewNote}
                className="bg-amber-600 hover:bg-amber-700 gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim Notifikasi Tindak Lanjut</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmText={confirmModalState.confirmText}
        variant={confirmModalState.variant}
        onConfirm={confirmModalState.onConfirm}
        onClose={() => setConfirmModalState((p) => ({ ...p, isOpen: false }))}
      />
    </div>
  );
}
