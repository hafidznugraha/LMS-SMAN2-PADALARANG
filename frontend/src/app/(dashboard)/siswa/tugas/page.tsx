"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  FolderX,
  ArrowRight,
  ArrowLeft,
  Search,
  AlertCircle,
  GraduationCap,
  ListTodo,
  ChevronDown,
  ChevronsUpDown,
  FileText,
  ClipboardList,
  ExternalLink,
  Video,
  Link as LinkIcon,
  FileUp,
  FileCheck2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiswaTugas, useSiswaAnggotaKelas } from "@/hooks/useSiswaTugas";
import { useSiswaJadwal } from "@/hooks/useSiswaJadwal";
import { cn, formatTanggal, formatNamaWithGelar, inisial } from "@/lib/utils";
import { getStoredUser } from "@/lib/auth";
import type { SiswaTugas } from "@/types/api";

function sisaWaktu(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Terlewat";
  const jam = Math.floor(diff / 3_600_000);
  if (jam < 1) return `${Math.max(1, Math.floor(diff / 60_000))} menit lagi`;
  if (jam < 48) return `${jam} jam lagi`;
  return `${Math.floor(jam / 24)} hari lagi`;
}

function skorClass(nilai: number) {
  if (nilai >= 85) return "bg-emerald-100 text-emerald-700";
  if (nilai >= 70) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

interface ParsedLampiran {
  type: "link" | "file" | "drive" | "youtube" | "doc";
  name: string;
  url: string;
}

function parseLampiran(raw?: string): ParsedLampiran[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string" && parsed.trim()) {
      return [{ type: "file", name: "Berkas Lampiran", url: parsed.trim() }];
    }
    return [];
  } catch {
    if (typeof raw === "string" && raw.trim()) {
      return [{ type: "file", name: "Berkas Lampiran", url: raw.trim() }];
    }
    return [];
  }
}

function formatClassroomDeadline(dateStr?: string | null): string {
  if (!dateStr) return "Tak ada batas waktu";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day} ${month}, ${hours}.${minutes}`;
  } catch {
    return dateStr;
  }
}

function formatInstructionHtml(content?: string): string {
  if (!content) return "";
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  return content.replace(/\n/g, "<br />");
}

function getInitials(name?: string) {
  if (!name) return "G";
  const clean = name.replace(/,/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "G";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const CARD_THEMES = [
  {
    gradient: "from-blue-600 via-blue-700 to-indigo-800",
    avatarBg: "bg-blue-600",
    hoverBorder: "hover:border-blue-400",
  },
  {
    gradient: "from-emerald-600 via-teal-700 to-emerald-800",
    avatarBg: "bg-emerald-600",
    hoverBorder: "hover:border-emerald-400",
  },
  {
    gradient: "from-purple-600 via-violet-700 to-indigo-800",
    avatarBg: "bg-purple-600",
    hoverBorder: "hover:border-purple-400",
  },
  {
    gradient: "from-amber-600 via-orange-600 to-amber-700",
    avatarBg: "bg-amber-600",
    hoverBorder: "hover:border-amber-400",
  },
  {
    gradient: "from-rose-600 via-pink-700 to-rose-800",
    avatarBg: "bg-rose-600",
    hoverBorder: "hover:border-rose-400",
  },
  {
    gradient: "from-cyan-600 via-sky-700 to-blue-800",
    avatarBg: "bg-cyan-600",
    hoverBorder: "hover:border-cyan-400",
  },
];

const AVATAR_BG_COLORS = [
  "bg-amber-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-cyan-600",
  "bg-violet-600",
  "bg-orange-600",
];

function getAvatarBgColor(name?: string): string {
  if (!name) return "bg-blue-600";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_BG_COLORS.length;
  return AVATAR_BG_COLORS[index];
}

interface MapelKelasItem {
  mapel_id: string;
  kelas_id?: string;
  nama_mapel: string;
  kode_mapel: string;
  nama_guru: string;
  gelar_guru?: string;
  nip_guru?: string;
  jadwal_summary: string;
  ruang?: string;
  nama_kelas: string;
  tasks: SiswaTugas[];
  tasksAktif: SiswaTugas[];
  tasksMendesak: SiswaTugas[];
  tasksSelesai: SiswaTugas[];
}

function TugasSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs animate-pulse">
          <div className="h-28 bg-slate-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-200 rounded-md w-1/2" />
            <div className="h-8 bg-slate-100 rounded-lg w-full mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SiswaTugasPage() {
  const { data: dataTugas, isLoading: isLoadingTugas, isError: isErrorTugas, refetch: refetchTugas } = useSiswaTugas();
  const { data: jadwalData, isLoading: isLoadingJadwal, isError: isErrorJadwal, refetch: refetchJadwal } = useSiswaJadwal();

  const [selectedMapelId, setSelectedMapelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tugas" | "orang">("tugas");
  const [searchQuery, setSearchQuery] = useState("");

  const mapelList = useMemo<MapelKelasItem[]>(() => {
    if (!jadwalData?.items || !Array.isArray(jadwalData.items)) return [];

    const map = new Map<string, MapelKelasItem>();
    const allTasks = dataTugas || [];

    for (const item of jadwalData.items) {
      const key = item.mapel_id || item.nama_mapel;
      if (!map.has(key)) {
        const tasksForThisMapel = allTasks.filter((t) => {
          if (t.mapel_id && item.mapel_id) {
            return t.mapel_id === item.mapel_id;
          }
          return t.nama_mapel.trim().toLowerCase() === item.nama_mapel.trim().toLowerCase();
        });

        const tasksAktif = tasksForThisMapel.filter((t) => t.status === "belum" && !t.lewat_deadline);
        const tasksMendesak = tasksForThisMapel.filter((t) => t.status === "belum" && t.mendesak);
        const tasksSelesai = tasksForThisMapel.filter((t) => t.status !== "belum");

        const namaGuru = formatNamaWithGelar(item.nama_guru || "Guru Pengampu", item.gelar_guru);
        map.set(key, {
          mapel_id: item.mapel_id || "",
          kelas_id: item.kelas_id,
          nama_mapel: item.nama_mapel,
          kode_mapel: item.kode_mapel || "",
          nama_guru: namaGuru,
          gelar_guru: item.gelar_guru,
          nip_guru: item.nip_guru,
          jadwal_summary: `${item.hari || "Hari"}, ${(item.jam_mulai || "").slice(0, 5)} - ${(item.jam_selesai || "").slice(0, 5)}`,
          ruang: item.ruang,
          nama_kelas: item.nama_kelas || jadwalData.nama_kelas,
          tasks: tasksForThisMapel,
          tasksAktif,
          tasksMendesak,
          tasksSelesai,
        });
      } else {
        const existing = map.get(key)!;
        if (!existing.jadwal_summary.includes(item.hari)) {
          existing.jadwal_summary += ` & ${item.hari}, ${item.jam_mulai.slice(0, 5)}`;
        }
      }
    }

    return Array.from(map.values());
  }, [jadwalData, dataTugas]);

  const { jumlahAktif, jumlahMendesak } = useMemo(() => {
    const semua = dataTugas ?? [];
    const belum = semua.filter((t) => t.status === "belum");
    return {
      jumlahAktif: belum.filter((t) => !t.lewat_deadline).length,
      jumlahMendesak: belum.filter((t) => t.mendesak).length,
    };
  }, [dataTugas]);

  const filteredMapelList = useMemo(() => {
    if (!searchQuery.trim()) return mapelList;
    const q = searchQuery.toLowerCase();
    return mapelList.filter(
      (m) =>
        m.nama_mapel.toLowerCase().includes(q) ||
        m.nama_guru.toLowerCase().includes(q) ||
        m.kode_mapel.toLowerCase().includes(q) ||
        m.tasks.some((t) => t.judul.toLowerCase().includes(q))
    );
  }, [mapelList, searchQuery]);

  const selectedMapel = useMemo(() => {
    if (!selectedMapelId) return null;
    return mapelList.find((m) => m.mapel_id === selectedMapelId) || null;
  }, [mapelList, selectedMapelId]);

  const { data: anggotaData, isLoading: isLoadingAnggota } = useSiswaAnggotaKelas(
    selectedMapel?.kelas_id,
    selectedMapel?.mapel_id
  );
  const currentUser = useMemo(() => getStoredUser(), []);

  const pengajarList = useMemo(() => {
    if (anggotaData?.pengajar && anggotaData.pengajar.length > 0) {
      return anggotaData.pengajar;
    }
    if (selectedMapel) {
      return [
        {
          id: "pengajar-default",
          nama_lengkap: selectedMapel.nama_guru,
          gelar: selectedMapel.gelar_guru,
          nip: selectedMapel.nip_guru,
          email: "",
          peran: "Guru Pengampu",
          mapel: selectedMapel.nama_mapel,
        },
      ];
    }
    return [];
  }, [anggotaData, selectedMapel]);

  const siswaList = useMemo(() => {
    return anggotaData?.siswa ?? [];
  }, [anggotaData]);

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const isAllExpanded = useMemo(() => {
    if (!selectedMapel?.tasks || selectedMapel.tasks.length === 0) return false;
    return selectedMapel.tasks.every((t) => expandedTasks[t.id]);
  }, [selectedMapel, expandedTasks]);

  const toggleAll = () => {
    if (!selectedMapel?.tasks) return;
    if (isAllExpanded) {
      setExpandedTasks({});
    } else {
      const all: Record<string, boolean> = {};
      selectedMapel.tasks.forEach((t) => {
        all[t.id] = true;
      });
      setExpandedTasks(all);
    }
  };

  const groupedTasksByTopic = useMemo(() => {
    if (!selectedMapel?.tasks) return [];
    const map = new Map<string, SiswaTugas[]>();
    for (const t of selectedMapel.tasks) {
      const topic = t.topik?.trim() || "Tidak ada topik";
      if (!map.has(topic)) {
        map.set(topic, []);
      }
      map.get(topic)!.push(t);
    }
    return Array.from(map.entries()).map(([topic, tasks]) => ({
      topic,
      tasks,
    }));
  }, [selectedMapel]);

  const isLoading = isLoadingTugas || isLoadingJadwal;
  const isError = isErrorTugas || isErrorJadwal;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              {jadwalData?.nama_kelas ? `Kelas ${jadwalData.nama_kelas}` : "Siswa"}
            </span>
            <span className="text-xs text-slate-400 font-medium">LMS SMAN 2 Padalarang</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-1">
            {selectedMapel ? selectedMapel.nama_mapel : "Tugas Kelas"}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            {selectedMapel
              ? `Pengajar: ${selectedMapel.nama_guru} • ${selectedMapel.jadwal_summary}`
              : "Setiap tugas dikelompokkan per mata pelajaran yang terjadwal oleh kurikulum"}
          </p>
        </div>

        {!selectedMapel && (
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white shadow-2xs text-center min-w-[90px]">
              <p className="text-xl font-black text-slate-800">{mapelList.length}</p>
              <p className="text-[11px] font-semibold text-slate-500">Mata Pelajaran</p>
            </div>
            <div className="px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 shadow-2xs text-center min-w-[90px]">
              <p className="text-xl font-black text-blue-800">{jumlahAktif}</p>
              <p className="text-[11px] font-semibold text-blue-700">Tugas Aktif</p>
            </div>
            {jumlahMendesak > 0 && (
              <div className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50/70 shadow-2xs text-center min-w-[90px]">
                <p className="text-xl font-black text-red-700">{jumlahMendesak}</p>
                <p className="text-[11px] font-semibold text-red-600">Mendesak</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedMapel ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSelectedMapelId(null);
                setActiveTab("tugas");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50/80 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors cursor-pointer w-fit mb-2 sm:mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Semua Mata Pelajaran</span>
            </button>

            <div className="flex items-center gap-8 self-center sm:self-auto px-2">
              <button
                type="button"
                onClick={() => setActiveTab("tugas")}
                className={cn(
                  "pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer",
                  activeTab === "tugas"
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Tugas kelas</span>
                {activeTab === "tugas" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("orang")}
                className={cn(
                  "pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 cursor-pointer",
                  activeTab === "orang"
                    ? "text-blue-600 font-bold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Users className="w-4 h-4" />
                <span>Orang</span>
                {activeTab === "orang" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.75 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {activeTab === "tugas" && (
            <div className="space-y-5">
              <div className="rounded-2xl p-6 bg-gradient-to-r from-blue-600 via-indigo-700 to-blue-800 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200 bg-blue-900/50 px-2.5 py-1 rounded-md">
                {selectedMapel.kode_mapel || "MAPEL"}
              </span>
              <h3 className="text-2xl font-bold">{selectedMapel.nama_mapel}</h3>
              <p className="text-sm text-blue-100 flex items-center gap-2 pt-1">
                <GraduationCap className="w-4 h-4" />
                <span>{selectedMapel.nama_guru}</span>
                <span>•</span>
                <Clock className="w-3.5 h-3.5" />
                <span>{selectedMapel.jadwal_summary}</span>
                {selectedMapel.ruang && <span>({selectedMapel.ruang})</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2 border border-white/20 text-center">
                <p className="text-2xl font-black">{selectedMapel.tasksAktif.length}</p>
                <p className="text-[11px] text-blue-100 font-medium">Tugas Aktif</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl px-4 py-2 border border-white/20 text-center">
                <p className="text-2xl font-black">{selectedMapel.tasksSelesai.length}</p>
                <p className="text-[11px] text-blue-100 font-medium">Tugas Selesai</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-600" />
              <span>Daftar Tugas {selectedMapel.nama_mapel} ({selectedMapel.tasks.length})</span>
            </h4>

            {selectedMapel.tasks.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>{isAllExpanded ? "Ciutkan semua" : "Rentangkan semua"}</span>
              </button>
            )}
          </div>

          {selectedMapel.tasks.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-slate-400" />
              </div>
              <h5 className="text-sm font-bold text-slate-800">Belum ada tugas untuk mata pelajaran ini</h5>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Guru mata pelajaran belum mempublikasikan tugas baru. Periksa kembali nanti.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTasksByTopic.map(({ topic, tasks }) => (
                <div key={topic} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b-2 border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <h5 className="text-base font-extrabold text-slate-900 tracking-tight">
                        {topic}
                      </h5>
                      <span className="text-xs font-semibold text-slate-400">
                        ({tasks.length})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {tasks.map((t) => {
                      const p = t.pengumpulan;
                      const isExpanded = !!expandedTasks[t.id];
                      const parsedLampiran = parseLampiran(t.file_lampiran);
                      const isSelesai = t.status === "dikumpulkan" || t.status === "dinilai";

                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "bg-white rounded-2xl transition-all duration-300 ease-in-out overflow-hidden",
                            isExpanded
                              ? "border-2 border-blue-600 shadow-sm my-3"
                              : "border border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/70 shadow-2xs my-1.5"
                          )}
                        >
                          <div
                            onClick={() => toggleTask(t.id)}
                            className={cn(
                              "px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none transition-colors",
                              isExpanded ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-slate-50/70"
                            )}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={cn(
                                  "w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-2xs",
                                  isSelesai
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-blue-600 text-white"
                                )}
                              >
                                {isSelesai ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ClipboardList className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <h4
                                  className={cn(
                                    "truncate transition-colors",
                                    isExpanded
                                      ? "text-base font-bold text-slate-900"
                                      : "text-sm font-semibold text-slate-800 hover:text-blue-600"
                                  )}
                                >
                                  {t.judul}
                                </h4>
                                <span className="text-[11px] text-slate-400 font-medium sm:hidden block">
                                  Tenggat: {formatClassroomDeadline(t.deadline)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                              <span className="text-xs text-slate-500 hidden sm:inline-block font-normal">
                                Tenggat: {formatClassroomDeadline(t.deadline)}
                              </span>

                              {t.status === "dinilai" && p?.nilai != null && (
                                <span className={cn("text-xs font-extrabold px-2.5 py-0.5 rounded-full", skorClass(p.nilai))}>
                                  Nilai: {p.nilai} / 100
                                </span>
                              )}
                              {t.status === "dikumpulkan" && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Diserahkan
                                </span>
                              )}
                              {t.status === "belum" && t.mendesak && (
                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 animate-pulse">
                                  Mendesak
                                </span>
                              )}
                              {t.status === "belum" && t.lewat_deadline && (
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Terlewat
                                </span>
                              )}
                              {t.status === "belum" && !t.mendesak && !t.lewat_deadline && (
                                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  Ditugaskan
                                </span>
                              )}

                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out",
                                  isExpanded ? "rotate-180 text-blue-600" : ""
                                )}
                              />
                            </div>
                          </div>

                          <div
                            className={cn(
                              "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100 border-t border-slate-100"
                                : "grid-rows-[0fr] opacity-0 border-t-0"
                            )}
                          >
                            <div className="overflow-hidden">
                              <div className="px-5 sm:px-6 pb-6 pt-4 space-y-4 text-xs md:text-sm">
                                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Batas Waktu: <strong>{formatTanggal(t.deadline, true)}</strong></span>
                                  </span>
                                  <span className="font-semibold text-slate-700">
                                    {t.status === "dikumpulkan"
                                      ? "Diserahkan"
                                      : t.status === "dinilai"
                                      ? "Sudah Dinilai"
                                      : "Belum Mengumpulkan"}
                                  </span>
                                </div>

                                {t.deskripsi ? (
                                  <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-100 space-y-1.5">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      Petunjuk Pengerjaan:
                                    </p>
                                    <div className="text-slate-700 leading-relaxed text-xs sm:text-sm font-sans space-y-1.5 break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_a]:text-blue-600 [&_a]:underline">
                                      <div dangerouslySetInnerHTML={{ __html: formatInstructionHtml(t.deskripsi) }} />
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic">
                                    Tidak ada petunjuk tambahan dari guru.
                                  </p>
                                )}

                                {parsedLampiran.length > 0 && (
                                  <div className="space-y-2">
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                      Lampiran Pembelajaran ({parsedLampiran.length}):
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {parsedLampiran.map((lamp, i) => (
                                        <a
                                          key={i}
                                          href={lamp.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-blue-300 transition-all text-slate-700 group shadow-2xs"
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                                            {lamp.type === "youtube" ? (
                                              <Video className="w-4 h-4 text-red-600" />
                                            ) : lamp.type === "link" ? (
                                              <LinkIcon className="w-4 h-4 text-blue-600" />
                                            ) : (
                                              <FileText className="w-4 h-4 text-blue-600" />
                                            )}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700">
                                              {lamp.name || "Lampiran Tugas"}
                                            </p>
                                            <p className="text-[10px] text-slate-400 uppercase font-mono truncate">
                                              {lamp.type}
                                            </p>
                                          </div>
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {t.format_file && (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                    <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                                    <span>
                                      Format berkas diterima:{" "}
                                      <strong className="font-semibold text-slate-700 uppercase">
                                        {t.format_file}
                                      </strong>
                                    </span>
                                  </div>
                                )}

                                {p && (
                                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                                        Jawaban yang Dikumpulkan:
                                      </span>
                                      <span className="text-[11px] text-slate-500">
                                        {formatTanggal(p.submitted_at, true)}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-800 font-medium bg-white p-2.5 rounded-lg border border-slate-200">
                                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                                      <span className="truncate flex-1">{p.nama_file}</span>
                                    </div>
                                    {p.catatan && (
                                      <p className="text-xs text-slate-600 italic">
                                        Catatan: &ldquo;{p.catatan}&rdquo;
                                      </p>
                                    )}
                                    {p.feedback_guru && (
                                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                                          Catatan Guru:
                                        </span>
                                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                                          {p.feedback_guru}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
                                  <div className="flex items-center gap-3">
                                    <Link
                                      href={`/siswa/tugas/${t.id}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer"
                                    >
                                      <span>Lihat petunjuk</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>

                                    <span className="text-slate-300">•</span>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTask(t.id);
                                      }}
                                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                                    >
                                      Ciutkan detail
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {t.status === "belum" && !t.lewat_deadline && (
                                      <Link
                                        href={`/siswa/tugas/${t.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-4 py-2 shadow-2xs transition-colors cursor-pointer"
                                      >
                                        <FileUp className="w-3.5 h-3.5" />
                                        <span>Kumpulkan Tugas</span>
                                      </Link>
                                    )}
                                    {t.status === "dikumpulkan" && !t.lewat_deadline && (
                                      <Link
                                        href={`/siswa/tugas/${t.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold px-4 py-2 border border-slate-200 transition-colors cursor-pointer"
                                      >
                                        <FileUp className="w-3.5 h-3.5" />
                                        <span>Ganti Jawaban</span>
                                      </Link>
                                    )}
                                    {t.status === "belum" && t.lewat_deadline && (
                                      <Link
                                        href={`/siswa/tugas/${t.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <span>Batas Waktu Berakhir</span>
                                      </Link>
                                    )}
                                    {t.status === "dinilai" && (
                                      <Link
                                        href={`/siswa/tugas/${t.id}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                                      >
                                        <span>Lihat Nilai & Evaluasi</span>
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "orang" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 md:p-10 max-w-4xl mx-auto space-y-10">
          <div className="space-y-4">
            <div className="border-b border-blue-600 pb-3 flex items-center justify-between">
              <h3 className="text-2xl font-normal text-blue-700">Pengajar</h3>
            </div>

            {isLoadingAnggota ? (
              <div className="py-4 space-y-3">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-48" />
                    <div className="h-3 bg-slate-100 rounded w-32" />
                  </div>
                </div>
              </div>
            ) : pengajarList.length === 0 ? (
              <p className="text-sm text-slate-500 py-3">Belum ada pengajar terdaftar.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {pengajarList.map((p, idx) => {
                  const namaGuruWithGelar = formatNamaWithGelar(p.nama_lengkap, p.gelar);
                  return (
                    <div
                      key={p.id || idx}
                      className="flex items-center justify-between py-3.5 hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full font-bold text-white flex items-center justify-center text-sm shadow-2xs select-none",
                            getAvatarBgColor(namaGuruWithGelar)
                          )}
                        >
                          {inisial(namaGuruWithGelar)}
                        </div>
                        <div>
                          <p className="text-sm md:text-base font-medium text-slate-900">
                            {namaGuruWithGelar}
                          </p>
                          {p.email && (
                            <p className="text-xs text-slate-400 font-normal">{p.email}</p>
                          )}
                        </div>
                      </div>
                      {p.peran && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                          {p.peran}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="border-b border-blue-600 pb-3 flex items-center justify-between">
              <h3 className="text-2xl font-normal text-blue-700">Teman Sekelas</h3>
              <span className="text-sm font-semibold text-slate-600">
                {isLoadingAnggota ? "Memuat..." : `${anggotaData?.total_siswa ?? siswaList.length} siswa`}
              </span>
            </div>

            {isLoadingAnggota ? (
              <div className="py-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse py-2">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-9 h-9 rounded-full bg-slate-200" />
                      <div className="h-4 bg-slate-200 rounded w-40" />
                    </div>
                    <div className="h-3 bg-slate-100 rounded w-20" />
                  </div>
                ))}
              </div>
            ) : siswaList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  Belum ada data teman sekelas yang terdaftar untuk kelas ini.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Siswa lain yang terdaftar dalam rombel ini akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {siswaList.map((s, idx) => {
                  const isCurrentUser =
                    (currentUser?.id && s.user_id === currentUser.id) ||
                    (currentUser?.extra?.siswa_id && s.id === currentUser.extra.siswa_id) ||
                    (currentUser?.nama_lengkap &&
                      s.nama_lengkap.trim().toLowerCase() === currentUser.nama_lengkap.trim().toLowerCase());

                  return (
                    <div
                      key={s.id || idx}
                      className={cn(
                        "flex items-center justify-between py-3 px-2 rounded-xl transition-colors",
                        isCurrentUser ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-slate-50/60"
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-full font-semibold text-white flex items-center justify-center text-xs shadow-2xs select-none",
                            getAvatarBgColor(s.nama_lengkap)
                          )}
                        >
                          {inisial(s.nama_lengkap)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCurrentUser ? "text-blue-900 font-bold" : "text-slate-900"
                            )}
                          >
                            {s.nama_lengkap}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                              Anda
                            </span>
                          )}
                        </div>
                      </div>

                      {s.nis && (
                        <span className="text-xs font-mono text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                          NIS: {s.nis}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ) : (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Mata Pelajaran Terjadwal ({filteredMapelList.length})
            </h3>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari mata pelajaran atau tugas..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {isLoading ? (
            <TugasSkeleton />
          ) : isError ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-800">Gagal memuat jadwal & tugas siswa.</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  refetchJadwal();
                  refetchTugas();
                }}
              >
                Coba Lagi
              </Button>
            </div>
          ) : filteredMapelList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
              <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                {searchQuery ? "Mata pelajaran tidak ditemukan" : "Belum ada jadwal mata pelajaran"}
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery
                  ? "Coba gunakan kata kunci pencarian yang lain."
                  : "Kurikulum belum menyusun jadwal mata pelajaran untuk kelas Anda. Silakan hubungi admin kurikulum."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMapelList.map((mapel, idx) => {
                const theme = CARD_THEMES[idx % CARD_THEMES.length];
                const upcomingTasks = mapel.tasksAktif
                  .slice()
                  .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

                return (
                  <div
                    key={mapel.mapel_id || idx}
                    className={cn(
                      "group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden",
                      theme.hoverBorder
                    )}
                  >
                    <div className="relative">
                      <div
                        onClick={() => {
                          setSelectedMapelId(mapel.mapel_id);
                          setActiveTab("tugas");
                        }}
                        className={cn(
                          "p-5 pb-6 bg-gradient-to-r text-white cursor-pointer select-none transition-opacity group-hover:opacity-95",
                          theme.gradient
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {mapel.kode_mapel || "MAPEL"}
                          </span>
                          <span className="text-[11px] font-medium text-white/80">
                            {mapel.nama_kelas}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold leading-tight mt-2 text-white line-clamp-1 group-hover:underline">
                          {mapel.nama_mapel}
                        </h3>
                        <p className="text-xs text-white/90 font-medium truncate mt-0.5">
                          {mapel.nama_guru}
                        </p>
                        <p className="text-[11px] text-white/75 truncate mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{mapel.jadwal_summary}</span>
                        </p>
                      </div>

                      <div
                        className={cn(
                          "absolute -bottom-5 right-5 w-11 h-11 rounded-full border-2 border-white shadow-md flex items-center justify-center font-black text-xs text-white",
                          theme.avatarBg
                        )}
                        title={`Guru: ${mapel.nama_guru}`}
                      >
                        {getInitials(mapel.nama_guru)}
                      </div>
                    </div>

                    <div className="p-5 pt-7 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          Batas Waktu Penyerahan:
                        </p>

                        {upcomingTasks.length > 0 ? (
                          <div className="space-y-2">
                            {upcomingTasks.slice(0, 2).map((task) => (
                              <Link
                                key={task.id}
                                href={`/siswa/tugas/${task.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="group/item block p-2 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {formatTanggal(task.deadline, false)}
                                  </span>
                                  {task.mendesak ? (
                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                      Mendesak
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-500">
                                      {sisaWaktu(task.deadline)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-bold text-slate-800 group-hover/item:text-blue-600 transition-colors truncate mt-0.5">
                                  {task.judul}
                                </p>
                              </Link>
                            ))}

                            {upcomingTasks.length > 2 && (
                              <p className="text-[11px] text-slate-500 font-medium pl-1">
                                + {upcomingTasks.length - 2} tugas lainnya
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="py-4 px-3 rounded-xl bg-slate-50/70 border border-slate-100 text-center space-y-1">
                            <CheckCircle2 className="w-4 h-4 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">
                              Tidak ada tugas yang akan datang
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <span
                        className={cn(
                          "text-[11px] font-bold px-2.5 py-1 rounded-full border",
                          upcomingTasks.length > 0
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}
                      >
                        {upcomingTasks.length > 0
                          ? `${upcomingTasks.length} Tugas Aktif`
                          : "Semua Selesai"}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMapelId(mapel.mapel_id);
                          setActiveTab("tugas");
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <span>Buka Kelas</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
