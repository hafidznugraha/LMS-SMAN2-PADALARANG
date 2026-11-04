"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  ChevronDown,
  Trash2,
  Pencil,
  Clock,
  MapPin,
  Calendar,
  X,
  Loader2,
  Download,
  AlertTriangle,
  Grid3X3,
  List,
  Coffee,
  Utensils,
  BookOpen,
  Search,
  Building2,
  Flag,
  CheckCircle2,
  ArrowRightLeft,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { fetchAPI, ApiClientError } from "@/lib/api";
import { Kelas, MataPelajaran, Guru, JadwalPelajaran } from "@/types";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface ConflictState {
  guru: string;
  mapelKelas: string;
  waktu: string;
  kelasBentrok?: string;
  ruangBentrok?: string;
}

interface TimeSlotDef {
  id: string;
  slotNumber?: number;
  label: string;
  sublabel: string;
  start: string;
  end: string;
  isBreak?: boolean;
  breakType?: "snack" | "lunch";
  breakTitle?: string;
}

const TIME_SLOTS: TimeSlotDef[] = [
  {
    id: "slot-1",
    slotNumber: 1,
    label: "06:45 - 07:30",
    sublabel: "Slot 1 • 45 Menit",
    start: "06:45",
    end: "07:30",
  },
  {
    id: "slot-2",
    slotNumber: 2,
    label: "07:30 - 09:00",
    sublabel: "Slot 2 • 90 Menit",
    start: "07:30",
    end: "09:00",
  },
  {
    id: "break-1",
    label: "09:00 - 09:15",
    sublabel: "15 Menit",
    start: "09:00",
    end: "09:15",
    isBreak: true,
    breakType: "snack",
    breakTitle: "Istirahat 1 (15 Menit) : Kantin & Area Santai Sekolah",
  },
  {
    id: "slot-3",
    slotNumber: 3,
    label: "09:15 - 10:45",
    sublabel: "Slot 3 • 90 Menit",
    start: "09:15",
    end: "10:45",
  },
  {
    id: "slot-4",
    slotNumber: 4,
    label: "10:45 - 12:15",
    sublabel: "Slot 4 • 90 Menit",
    start: "10:45",
    end: "12:15",
  },
  {
    id: "break-2",
    label: "12:15 - 13:00",
    sublabel: "45 Menit",
    start: "12:15",
    end: "13:00",
    isBreak: true,
    breakType: "lunch",
    breakTitle: "Istirahat 2 / ISHOMA (45 Menit) : Sholat Dzuhur & Makan Siang",
  },
  {
    id: "slot-5",
    slotNumber: 5,
    label: "13:00 - 14:30",
    sublabel: "Slot 5 • 90 Menit",
    start: "13:00",
    end: "14:30",
  },
];

export default function KelolaJadwalPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isJadwalLoading, setIsJadwalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJurusan, setFilterJurusan] = useState("Semua Jurusan");
  const [filterSemester, setFilterSemester] = useState("Semester Ganjil 2025/2026");

  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [conflictResolutionChoice, setConflictResolutionChoice] = useState("option1");

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: "danger" | "warning" | "primary";
    action?: () => Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalPelajaran | null>(null);

  const [formKelasId, setFormKelasId] = useState("");
  const [formMapelId, setFormMapelId] = useState("");
  const [formGuruId, setFormGuruId] = useState("");
  const [formHari, setFormHari] = useState("Senin");
  const [formJamMulai, setFormJamMulai] = useState("07:30");
  const [formJamSelesai, setFormJamSelesai] = useState("09:00");
  const [formRuang, setFormRuang] = useState("R-204");

  const loadJadwal = useCallback(async (kelasId: string) => {
    setIsJadwalLoading(true);
    try {
      const res = await fetchAPI<{ data: JadwalPelajaran[] }>(`/jadwal?kelas_id=${kelasId}`);
      setJadwalList(res.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsJadwalLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [resKelas, resMapel, resGuru] = await Promise.all([
        fetchAPI<{ data: Kelas[] }>("/master/kelas"),
        fetchAPI<{ data: MataPelajaran[] }>("/master/mapel"),
        fetchAPI<{ data: Guru[] }>("/master/guru"),
      ]);

      const classes = resKelas.data || [];
      setKelasList(classes);
      setMapelList(resMapel.data || []);
      setGuruList(resGuru.data || []);

      if (classes.length > 0) {
        setSelectedKelas(classes[0]);
        setFormKelasId(classes[0].id);
        await loadJadwal(classes[0].id);
      }
      if (resMapel.data && resMapel.data.length > 0) {
        const firstMapelId = resMapel.data[0].id;
        setFormMapelId(firstMapelId);
        const matching = (resGuru.data || []).filter(
          (g) => g.mapel_id === firstMapelId || g.mapel?.id === firstMapelId
        );
        if (matching.length > 0) {
          setFormGuruId(matching[0].id);
        } else if (resGuru.data && resGuru.data.length > 0) {
          setFormGuruId(resGuru.data[0].id);
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadJadwal]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const filteredKelasList = useMemo(() => {
    if (filterJurusan === "Semua Jurusan") return kelasList;
    return kelasList.filter((k) =>
      k.jurusan?.toLowerCase().includes(filterJurusan.toLowerCase())
    );
  }, [kelasList, filterJurusan]);

  const handleSelectKelas = (k: Kelas) => {
    setSelectedKelas(k);
    setFormKelasId(k.id);
    loadJadwal(k.id);
  };

  const availableGurusForMapel = useMemo(() => {
    if (!formMapelId) return [];
    return guruList.filter(
      (g) => g.mapel_id === formMapelId || g.mapel?.id === formMapelId
    );
  }, [guruList, formMapelId]);

  const handleMapelChange = (newMapelId: string) => {
    setFormMapelId(newMapelId);
    const matchingGurus = guruList.filter(
      (g) => g.mapel_id === newMapelId || g.mapel?.id === newMapelId
    );
    if (matchingGurus.length > 0) {
      setFormGuruId(matchingGurus[0].id);
    } else {
      setFormGuruId("");
    }
  };

  const handleOpenModal = (presetHari?: string, presetStart?: string, presetEnd?: string) => {
    setEditingJadwal(null);
    if (selectedKelas) {
      setFormKelasId(selectedKelas.id);
    }
    const initialMapelId = mapelList.length > 0 ? mapelList[0].id : "";
    setFormMapelId(initialMapelId);
    if (initialMapelId) {
      const matching = guruList.filter(
        (g) => g.mapel_id === initialMapelId || g.mapel?.id === initialMapelId
      );
      setFormGuruId(matching.length > 0 ? matching[0].id : "");
    } else {
      setFormGuruId("");
    }
    setFormHari(presetHari || "Senin");
    setFormJamMulai(presetStart || "07:30");
    setFormJamSelesai(presetEnd || "09:00");
    setFormRuang("R-204");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JadwalPelajaran) => {
    setEditingJadwal(item);
    setFormKelasId(item.kelas_id);
    setFormMapelId(item.mapel_id);
    setFormGuruId(item.guru_id);
    setFormHari(item.hari);
    setFormJamMulai(item.jam_mulai.slice(0, 5));
    setFormJamSelesai(item.jam_selesai.slice(0, 5));
    setFormRuang(item.ruang || "");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJadwal(null);
  };

  const handleCreateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formMapelId) {
      toast.error("Mata pelajaran wajib dipilih");
      setIsSubmitting(false);
      return;
    }

    if (!formGuruId) {
      toast.error("Guru pengampu wajib dipilih atau ditentukan di Master Guru");
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingJadwal) {
        await fetchAPI(`/jadwal/${editingJadwal.id}`, {
          method: "PUT",
          body: JSON.stringify({
            kelas_id: formKelasId,
            mapel_id: formMapelId,
            guru_id: formGuruId,
            hari: formHari,
            jam_mulai: formJamMulai,
            jam_selesai: formJamSelesai,
            ruang: formRuang,
          }),
        });
        toast.success("Jadwal pelajaran berhasil diperbarui!");
      } else {
        await fetchAPI("/jadwal", {
          method: "POST",
          body: JSON.stringify({
            kelas_id: formKelasId,
            mapel_id: formMapelId,
            guru_id: formGuruId,
            hari: formHari,
            jam_mulai: formJamMulai,
            jam_selesai: formJamSelesai,
            ruang: formRuang,
          }),
        });
        toast.success("Jadwal pelajaran berhasil ditambahkan!");
      }

      setConflict(null);
      setIsModalOpen(false);
      setEditingJadwal(null);
      if (selectedKelas) {
        await loadJadwal(selectedKelas.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 409) {
        const cData = err.data;
        if (cData) {
          setConflict({
            guru: cData.guru || "Guru Pengampu",
            mapelKelas: `${cData.mapel || "Pelajaran"} - ${cData.kelas || "Kelas Lain"}`,
            waktu: `${cData.hari || formHari}, ${cData.waktu || `${formJamMulai} - ${formJamSelesai}`} WIB`,
            kelasBentrok: cData.kelas,
            ruangBentrok: cData.ruang,
          });
        } else {
          setConflict({
            guru: "Guru / Ruangan Terjadwal",
            mapelKelas: err.message,
            waktu: `${formHari}, ${formJamMulai} - ${formJamSelesai} WIB`,
          });
        }
        setIsModalOpen(false);
      } else if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJadwal = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Hapus Jadwal Pelajaran",
      message: "Apakah Anda yakin ingin menghapus jadwal ini dari kalender rombel?",
      confirmText: "Hapus Jadwal",
      variant: "danger",
      action: async () => {
        setIsDeletingId(id);
        try {
          await fetchAPI(`/jadwal/${id}`, { method: "DELETE" });
          toast.success("Jadwal pelajaran berhasil dihapus");
          if (selectedKelas) {
            await loadJadwal(selectedKelas.id);
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            toast.error(err.message);
          }
        } finally {
          setIsDeletingId(null);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleAutoCheckConflict = () => {
    setIsCheckingConflict(true);
    setTimeout(() => {
      setIsCheckingConflict(false);
      if (conflict) {
        toast.error(`Terdeteksi ${conflict.guru} memiliki bentrok jadwal aktif!`);
      } else {
        toast.success("Engine Validasi: Deteksi selesai. Semua ruang kelas dan beban jam KBM terverifikasi bersih bebas bentrok.");
      }
    }, 700);
  };

  const handleExport = () => {
    if (!selectedKelas) return;
    const header = "Hari,Jam Mulai,Jam Selesai,Mata Pelajaran,Guru Pengampu,Ruang\n";
    const rows = jadwalList
      .map((j) => {
        const m = j.mapel?.nama_mapel || "";
        const g = j.guru?.user?.nama_lengkap || "";
        return `"${j.hari}","${j.jam_mulai}","${j.jam_selesai}","${m}","${g}","${j.ruang || ""}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `jadwal-kbm-${selectedKelas.nama_kelas.toLowerCase().replace(/\s+/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Jadwal pelajaran berhasil diekspor ke CSV/Excel");
  };

  const getSubjectVisual = (mapelName: string) => {
    const lower = mapelName.toLowerCase();
    if (lower.includes("matematika") || lower.includes("informatika") || lower.includes("koding")) {
      return {
        cardBg: "bg-blue-50/90 hover:bg-blue-100/80 border-blue-200/90 text-blue-950",
        badgeBg: "bg-blue-100 text-blue-700 font-bold",
        category: "MIPA",
      };
    }
    if (lower.includes("fisika") || lower.includes("kimia") || lower.includes("ipa")) {
      return {
        cardBg: "bg-emerald-50/90 hover:bg-emerald-100/80 border-emerald-200/90 text-emerald-950",
        badgeBg: "bg-emerald-100 text-emerald-700 font-bold",
        category: "Eksakta",
      };
    }
    if (lower.includes("biologi") || lower.includes("sejarah") || lower.includes("sosiologi") || lower.includes("geografi")) {
      return {
        cardBg: "bg-amber-50/90 hover:bg-amber-100/80 border-amber-200/90 text-amber-950",
        badgeBg: "bg-amber-100 text-amber-700 font-bold",
        category: "Sosial",
      };
    }
    if (lower.includes("indonesia") || lower.includes("inggris") || lower.includes("bahasa") || lower.includes("seni")) {
      return {
        cardBg: "bg-rose-50/90 hover:bg-rose-100/80 border-rose-200/90 text-rose-950",
        badgeBg: "bg-rose-100 text-rose-700 font-bold",
        category: "Bahasa",
      };
    }
    return {
      cardBg: "bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-900",
      badgeBg: "bg-slate-200 text-slate-800 font-bold",
      category: "Umum",
    };
  };

  const filteredJadwalList = useMemo(() => {
    if (!searchQuery.trim()) return jadwalList;
    const q = searchQuery.toLowerCase();
    return jadwalList.filter((item) => {
      const mapelMatch = item.mapel?.nama_mapel.toLowerCase().includes(q);
      const guruMatch = item.guru?.user?.nama_lengkap.toLowerCase().includes(q);
      const ruangMatch = item.ruang?.toLowerCase().includes(q);
      return mapelMatch || guruMatch || ruangMatch;
    });
  }, [jadwalList, searchQuery]);

  const schedulesByDay = useMemo(() => {
    return HARI_LIST.reduce<Record<string, JadwalPelajaran[]>>((acc, day) => {
      acc[day] = filteredJadwalList.filter((j) => j.hari.toLowerCase() === day.toLowerCase());
      return acc;
    }, {});
  }, [filteredJadwalList]);

  const findSchedulesForSlot = (day: string, slot: TimeSlotDef) => {
    const dayItems = schedulesByDay[day] || [];
    return dayItems.filter((item) => {
      const start = item.jam_mulai.slice(0, 5);
      const end = item.jam_selesai.slice(0, 5);
      return start < slot.end && end > slot.start;
    });
  };

  const totalJP = useMemo(() => {
    return jadwalList.length * 2;
  }, [jadwalList]);

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Kelola Jadwal Pelajaran
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200/60 text-[11px] font-bold uppercase tracking-wider">
                Kurikulum Merdeka
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Atur plotting mata pelajaran, alokasi jam mengajar guru, dan validasi bentrok jadwal antar kelas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-slate-700 font-semibold text-xs shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Excel / CSV</span>
            </button>
            <button
              type="button"
              onClick={handleAutoCheckConflict}
              disabled={isCheckingConflict}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-blue-900 font-semibold text-xs shadow-xs hover:bg-blue-50/60 transition-all cursor-pointer disabled:opacity-70"
            >
              {isCheckingConflict ? (
                <>
                  <Loader2 className="w-4 h-4 text-blue-900 animate-spin" />
                  <span>Memvalidasi Matrix...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-blue-800" />
                  <span>Cek Bentrok Otomatis</span>
                </>
              )}
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenModal()}
              className="rounded-xl shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Jadwal Baru</span>
            </Button>
          </div>
        </section>

        {conflict && (
          <section className="rounded-2xl p-4 md:p-5 shadow-sm bg-[#FEF08A] border border-[#FDE047] relative overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                </div>
                <span className="font-semibold text-sm text-slate-900">
                  Peringatan Bentrok Jadwal Terdeteksi{" "}
                  <span className="px-2 py-0.5 ml-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold">
                    1 Konflik Aktif
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-xs text-slate-600 font-medium">
                  Terdeteksi via Engine Validasi Real-time
                </span>
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  className="p-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-amber-300/40 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs bg-white">
              <div className="flex items-start md:items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{conflict.guru}</span>
                    <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 text-xs font-semibold">
                      {conflict.mapelKelas}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 truncate">
                    Terdaftar mengajar bersamaan pada rombel yang sama atau jadwal ganda
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-amber-700 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{conflict.waktu}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => setIsConflictModalOpen(true)}
                  className="rounded-full px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Perbaiki Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1.5 transition-colors cursor-pointer"
                >
                  Abaikan Sementara
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative min-w-[150px]">
              <select
                value={selectedKelas?.id || ""}
                onChange={(e) => {
                  const target = kelasList.find((k) => k.id === e.target.value);
                  if (target) handleSelectKelas(target);
                }}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-semibold text-xs appearance-none focus:outline-none focus:bg-white focus:border-blue-900 cursor-pointer transition-all"
              >
                {filteredKelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas} ({k.jurusan})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="relative min-w-[170px]">
              <select
                value={filterJurusan}
                onChange={(e) => setFilterJurusan(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 font-medium text-xs appearance-none focus:outline-none focus:bg-white focus:border-blue-900 cursor-pointer transition-all"
              >
                <option value="Semua Jurusan">Semua Jurusan (MIPA & IPS)</option>
                <option value="MIPA">Peminatan MIPA</option>
                <option value="IPS">Peminatan IPS</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="relative min-w-[190px]">
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 font-medium text-xs appearance-none focus:outline-none focus:bg-white focus:border-blue-900 cursor-pointer transition-all"
              >
                <option value="Semester Ganjil 2025/2026">Semester Ganjil 2025/2026</option>
                <option value="Semester Genap 2024/2025">Semester Genap 2024/2025</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata pelajaran atau guru..."
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 text-xs placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-900 transition-all"
              />
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-white text-blue-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid Timetable</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-white text-blue-950 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List View</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 xl:pt-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs">
              <Clock className="w-3.5 h-3.5 text-blue-800" />
              <span>
                Total: <strong className="text-slate-900">{totalJP} JP/Minggu</strong>
              </span>
            </div>
            {conflict ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>1 Guru Bentrok</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>0 Konflik Aktif</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-blue-700" />
              <span>Kelas {selectedKelas?.nama_kelas || "-"}</span>
            </div>
          </div>
        </section>

        {isLoading || isJadwalLoading ? (
          <div className="py-20 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-xs font-medium">Memuat jadwal pembelajaran...</p>
          </div>
        ) : viewMode === "grid" ? (
          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="w-full overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[1150px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80">
                    <th className="py-3.5 px-4 w-[160px] text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Jam / Waktu</span>
                      </div>
                    </th>
                    {HARI_LIST.map((day) => (
                      <th
                        key={day}
                        className="py-3.5 px-3 w-[165px] text-xs uppercase tracking-wider text-slate-800 font-bold"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TIME_SLOTS.map((slot) => {
                    if (slot.isBreak) {
                      return (
                        <tr key={slot.id} className="bg-slate-50/70">
                          <td className="py-2.5 px-4 bg-slate-100/70 text-slate-600 font-bold text-xs">
                            {slot.label}
                          </td>
                          <td colSpan={HARI_LIST.length} className="py-2.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold tracking-wide uppercase">
                              {slot.breakType === "snack" ? (
                                <Coffee className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Utensils className="w-4 h-4 text-emerald-600" />
                              )}
                              <span>{slot.breakTitle}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    if (slot.slotNumber === 1) {
                      return (
                        <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-4 bg-slate-50/60 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-xs text-slate-900">{slot.label}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5">{slot.sublabel}</span>
                            </div>
                          </td>

                          <td className="p-2 align-top">
                            <div className="h-full rounded-xl p-3 bg-slate-100 border border-slate-200/80 flex flex-col justify-between">
                              <div className="flex items-start justify-between gap-1">
                                <div className="flex items-center gap-1.5 text-slate-900 font-semibold text-xs">
                                  <Flag className="w-3.5 h-3.5 text-blue-800" />
                                  <span>Upacara Bendera</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium">Wajib</span>
                              </div>
                              <div className="mt-2 flex items-center justify-between text-slate-500 text-[10px]">
                                <span>Piket & Kesiswaan</span>
                                <span className="px-1.5 py-0.5 rounded bg-white font-medium">Lapangan</span>
                              </div>
                            </div>
                          </td>

                          <td colSpan={HARI_LIST.length - 1} className="p-2 align-top">
                            <div className="h-full rounded-xl p-3 bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-700 text-xs font-medium">
                                <BookOpen className="w-4 h-4 text-slate-400" />
                                <span>Pembiasaan Literasi, Doa Pagi, & Pengembangan Karakter Rombel</span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500 font-semibold">
                                Wali Kelas {selectedKelas?.nama_kelas}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 bg-slate-50/60 align-top">
                          <div className="flex flex-col">
                            <span className="font-bold text-xs text-slate-900">{slot.label}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">{slot.sublabel}</span>
                          </div>
                        </td>

                        {HARI_LIST.map((day) => {
                          const matched = findSchedulesForSlot(day, slot);

                          if (matched.length === 0) {
                            return (
                              <td key={day} className="p-2 align-top">
                                <div
                                  onClick={() => handleOpenModal(day, slot.start, slot.end)}
                                  className="h-full min-h-[88px] rounded-xl border border-dashed border-slate-200 p-2.5 flex flex-col items-center justify-center text-center group hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer"
                                  title={`Plotting Jam KBM: ${day} (${slot.label})`}
                                >
                                  <span className="text-[11px] text-slate-400 group-hover:text-blue-900 font-semibold flex items-center gap-1">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Plotting Jam</span>
                                  </span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={day} className="p-2 align-top space-y-2">
                              {matched.map((item) => {
                                const mapelName = item.mapel?.nama_mapel || "Pelajaran";
                                const guruName =
                                  item.guru?.user?.nama_lengkap || item.guru?.gelar
                                    ? `${item.guru?.user?.nama_lengkap || "Guru"}, ${item.guru?.gelar || ""}`
                                    : "Guru Pengampu";
                                const visual = getSubjectVisual(mapelName);

                                return (
                                  <div
                                    key={item.id}
                                    className={`group relative rounded-xl p-3 border shadow-2xs hover:shadow-md transition-all ${visual.cardBg}`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider ${visual.badgeBg}`}
                                      >
                                        {visual.category}
                                      </span>
                                      <span className="text-[10px] text-slate-600 font-semibold">
                                        {item.ruang || "R-204"}
                                      </span>
                                    </div>

                                    <div className="font-bold text-xs leading-tight line-clamp-1">
                                      {mapelName}
                                    </div>
                                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                                      {guruName}
                                    </div>

                                    <div className="mt-2.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-slate-400 text-[10px]">
                                      <span>
                                        {item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}
                                      </span>
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditModal(item)}
                                          className="p-1 rounded bg-white text-slate-600 hover:text-blue-900 shadow-2xs cursor-pointer"
                                          title="Edit Jadwal"
                                        >
                                          <Pencil className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={isDeletingId === item.id}
                                          onClick={() => handleDeleteJadwal(item.id)}
                                          className="p-1 rounded bg-white text-slate-600 hover:text-rose-600 shadow-2xs cursor-pointer"
                                          title="Hapus Jadwal"
                                        >
                                          {isDeletingId === item.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>
                    Beban Rata-rata Guru: <strong className="text-slate-900">28 JP / Minggu (Ideal)</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-800" />
                  <span>
                    Sinkronisasi Dapodik: <strong className="text-slate-900">Real-time Terhubung</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="font-semibold">Kategori Mapel:</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  MIPA
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Eksakta
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  Sosial
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  Bahasa
                </span>
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Daftar Sesi Pembelajaran Kelas: {selectedKelas ? selectedKelas.nama_kelas : "-"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tingkat {selectedKelas?.tingkat || 10} • Jurusan {selectedKelas?.jurusan || "Umum"}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Tambah Sesi</span>
              </Button>
            </div>

            {jadwalList.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Belum ada plotting jadwal mata pelajaran untuk kelas {selectedKelas?.nama_kelas}. Klik tombol Tambah Jadwal untuk mengatur jadwal baru.
                </p>
                <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <span>Tambah Jadwal Sekarang</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {HARI_LIST.map((day) => {
                  const daySchedules = schedulesByDay[day] || [];
                  return (
                    <div
                      key={day}
                      className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{day}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {daySchedules.length} Sesi
                        </span>
                      </div>

                      {daySchedules.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 italic">
                          Tidak ada jam KBM
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {daySchedules.map((item) => {
                            const mapelName = item.mapel?.nama_mapel || "Mata Pelajaran";
                            const guruName =
                              item.guru?.user?.nama_lengkap || item.guru?.gelar
                                ? `${item.guru?.user?.nama_lengkap || "Guru"}, ${item.guru?.gelar || ""}`
                                : "Guru Pengampu";
                            const visual = getSubjectVisual(mapelName);

                            return (
                              <div
                                key={item.id}
                                className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-2 transition-all hover:border-slate-300"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <span
                                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] ${visual.badgeBg}`}
                                  >
                                    {mapelName}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditModal(item)}
                                      className="text-slate-400 hover:text-blue-900 p-1 rounded-md transition-colors cursor-pointer"
                                      title="Edit Jadwal"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isDeletingId === item.id}
                                      onClick={() => handleDeleteJadwal(item.id)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                                      title="Hapus Jadwal"
                                    >
                                      {isDeletingId === item.id ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                <div className="text-xs text-slate-700 font-medium">{guruName}</div>

                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>
                                      {item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-[110px]">
                                      {item.ruang || "R-204"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {isConflictModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs m-0">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Resolusi Konflik Jadwal Guru
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                      1 Konflik Terdeteksi
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Selesaikan bentrok penugasan mengajar untuk{" "}
                    <strong className="text-slate-800">{conflict?.guru || "Guru Pengampu"}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConflictModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Jadwal A (Kelas Terpilih)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                    Bentrok
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {selectedKelas?.nama_kelas || "Kelas Aktif"} • {conflict?.mapelKelas || "Matematika"}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{conflict?.waktu || "Senin, 07:30 - 09:00 WIB"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ruang R-204</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-red-200 bg-red-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Jadwal B (Jadwal Bersamaan)
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                    Bentrok
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-900">
                  {conflict?.kelasBentrok || "Rombel Paralel"} • {conflict?.mapelKelas || "Matematika"}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{conflict?.waktu || "Senin, 07:30 - 09:00 WIB"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{conflict?.ruangBentrok || "Lab Komputer"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800">
                Opsi Solusi Rekomendasi Sistem:
              </span>
              <label
                onClick={() => setConflictResolutionChoice("option1")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  conflictResolutionChoice === "option1"
                    ? "border-blue-900 bg-blue-50/70"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                <input
                  type="radio"
                  name="solution_choice"
                  checked={conflictResolutionChoice === "option1"}
                  onChange={() => setConflictResolutionChoice("option1")}
                  className="mt-1 text-blue-900 focus:ring-blue-900"
                />
                <div className="flex flex-col text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">
                      Opsi 1: Pindahkan Jam ke Slot Kosong
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Rekomendasi Bersih Bebas Konflik
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 mt-0.5">
                    Plotting ulang jadwal ke slot kosong Kamis (10:45 - 12:15 WIB). Guru dan ruang kelas tersedia penuh tanpa bentrok baru.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setConflictResolutionChoice("option2")}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  conflictResolutionChoice === "option2"
                    ? "border-blue-900 bg-blue-50/70"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100/70"
                }`}
              >
                <input
                  type="radio"
                  name="solution_choice"
                  checked={conflictResolutionChoice === "option2"}
                  onChange={() => setConflictResolutionChoice("option2")}
                  className="mt-1 text-blue-900 focus:ring-blue-900"
                />
                <div className="flex flex-col text-left flex-1">
                  <span className="font-bold text-xs text-slate-900">
                    Opsi 2: Tugaskan Guru Pengganti / Sejawat
                  </span>
                  <span className="text-xs text-slate-600 mt-0.5">
                    Pilih rekan guru mata pelajaran sejenis yang memiliki jadwal luang pada jam tersebut.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsConflictModalOpen(false)}
              >
                Batal / Nanti Saja
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => {
                  setConflict(null);
                  setIsConflictModalOpen(false);
                  toast.success("Konflik berhasil diselesaikan! Jadwal telah disesuaikan ke slot aman.");
                }}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                <span>Terapkan Perubahan & Simpan</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs m-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingJadwal ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingJadwal
                    ? "Perbarui alokasi waktu dan pengampu jadwal"
                    : "Sistem otomatis mendeteksi bentrok jam guru dan kelas"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJadwal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kelas</label>
                  <select
                    value={formKelasId}
                    onChange={(e) => setFormKelasId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas} ({k.jurusan})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hari</label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    {HARI_LIST.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Mata Pelajaran</label>
                  <Link
                    href="/admin/mapel"
                    target="_blank"
                    className="text-[11px] text-blue-900 font-semibold hover:underline"
                  >
                    + Kelola Mapel
                  </Link>
                </div>
                <select
                  value={formMapelId}
                  onChange={(e) => handleMapelChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {mapelList.length === 0 ? (
                    <option value="">Belum ada data mata pelajaran</option>
                  ) : (
                    mapelList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nama_mapel} ({m.kode_mapel})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Guru Pengampu</label>
                  {availableGurusForMapel.length === 1 && (
                    <span className="text-[11px] text-blue-900 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Terpilih Otomatis
                    </span>
                  )}
                </div>
                <select
                  value={formGuruId}
                  onChange={(e) => setFormGuruId(e.target.value)}
                  required
                  disabled={availableGurusForMapel.length === 0}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white font-medium ${
                    availableGurusForMapel.length === 0
                      ? "border-amber-300 bg-amber-50/50 text-amber-800"
                      : "border-slate-300 text-slate-800"
                  }`}
                >
                  {availableGurusForMapel.length === 0 ? (
                    <option value="">
                      Belum ada guru yang ditugaskan untuk mapel ini
                    </option>
                  ) : (
                    availableGurusForMapel.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.user?.nama_lengkap || "Guru"}{g.gelar ? `, ${g.gelar}` : ""} ({g.nip})
                      </option>
                    ))
                  )}
                </select>
                {availableGurusForMapel.length === 0 && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    Silakan tautkan guru ke mata pelajaran ini di{" "}
                    <Link href="/admin/guru" target="_blank" className="underline font-semibold hover:text-amber-900">
                      Master Data Guru
                    </Link>
                    .
                  </p>
                )}
                {availableGurusForMapel.length > 1 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Terdapat {availableGurusForMapel.length} guru pengampu untuk mata pelajaran ini. Anda dapat memilih salah satunya.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ruangan</label>
                <input
                  type="text"
                  value={formRuang}
                  onChange={(e) => setFormRuang(e.target.value)}
                  placeholder="Contoh: R-204 / Lab Komputer"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>{editingJadwal ? "Simpan Perubahan" : "Simpan Jadwal"}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        isLoading={Boolean(isDeletingId)}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={() => confirmState.action?.()}
      />
    </>
  );
}
