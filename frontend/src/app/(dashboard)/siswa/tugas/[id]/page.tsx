"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  Clock,
  User,
  GraduationCap,
  ExternalLink,
  Video,
  Link as LinkIcon,
  Download,
  FileUp,
  FileCheck2,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Send,
  Loader2,
  X,
  MessageSquare,
  Lock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useSiswaTugasDetail,
  useSubmitTugas,
  useKomentarTugas,
  useAddKomentarTugas,
  useDeleteKomentarTugas,
} from "@/hooks/useSiswaTugas";
import { getStoredUser } from "@/lib/auth";
import { cn, formatTanggal, formatNamaWithGelar } from "@/lib/utils";
import type { SiswaTugas, KomentarTugas } from "@/types/api";

const MAX_BYTES = 50 * 1024 * 1024;
const DISALLOWED_EXT = [".exe", ".bat", ".cmd", ".sh", ".vbs", ".msi"];

const FORMAT_MAP: Record<string, string[]> = {
  pdf: [".pdf"],
  docx: [".docx", ".doc"],
  doc: [".doc", ".docx"],
  word: [".docx", ".doc"],
  gambar: [".jpg", ".jpeg", ".png", ".webp"],
  image: [".jpg", ".jpeg", ".png", ".webp"],
  foto: [".jpg", ".jpeg", ".png", ".webp"],
  jpg: [".jpg", ".jpeg"],
  jpeg: [".jpeg", ".jpg"],
  png: [".png"],
  webp: [".webp"],
  xlsx: [".xlsx", ".xls", ".csv"],
  xls: [".xls", ".xlsx", ".csv"],
  excel: [".xlsx", ".xls", ".csv"],
  pptx: [".pptx", ".ppt"],
  ppt: [".ppt", ".pptx"],
  zip: [".zip", ".rar", ".7z"],
  rar: [".rar", ".zip", ".7z"],
  "7z": [".7z", ".zip", ".rar"],
  txt: [".txt"],
};

function getAllowedExtensions(formatSpec?: string): string[] | null {
  if (!formatSpec) return null;
  const raw = formatSpec.trim().toLowerCase();
  if (!raw || raw === "all" || raw === "*" || raw.includes("semua")) return null;

  const tokens = raw.split(/[,;\s/|]+/).filter(Boolean);
  const exts = new Set<string>();
  for (const t of tokens) {
    const clean = t.replace(/^\./, "");
    if (FORMAT_MAP[clean]) {
      FORMAT_MAP[clean].forEach((ext) => exts.add(ext));
    } else {
      exts.add(`.${clean}`);
    }
  }
  return exts.size > 0 ? Array.from(exts) : null;
}

function formatBytes(b: number) {
  return b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;
}

function validateFile(f: File, formatSpec?: string): string {
  const dot = f.name.lastIndexOf(".");
  const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : "";
  if (DISALLOWED_EXT.includes(ext)) {
    return "Format berkas executable (.exe, .bat, dll.) tidak diizinkan demi keamanan.";
  }
  if (f.size > MAX_BYTES) return "Ukuran berkas melebihi batas maksimal 50 MB.";
  if (f.size === 0) return "Berkas kosong.";

  const allowedExts = getAllowedExtensions(formatSpec);
  if (allowedExts && !allowedExts.includes(ext)) {
    const labelList = Array.from(
      new Set(allowedExts.map((e) => e.replace(".", "").toUpperCase()))
    ).join(", ");
    const userExt = ext ? ext.replace(".", "").toUpperCase() : "TANPA EKSTENSI";
    return `Format berkas (${userExt}) tidak diizinkan. Guru hanya menerima format: ${labelList}`;
  }

  return "";
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
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `Tenggat: ${day} ${month}, ${hours}.${minutes}`;
  } catch {
    return `Tenggat: ${dateStr}`;
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
  if (!name) return "U";
  const clean = name.replace(/,/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SiswaTugasDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const tugasId = (params?.id as string) || "";

  const currentUser = useMemo(() => getStoredUser(), []);

  const { data: tugas, isLoading, isError, refetch } = useSiswaTugasDetail(tugasId);
  const { data: comments = [], isLoading: isLoadingComments } = useKomentarTugas(tugasId);

  const submitMutation = useSubmitTugas();
  const addKomentarMutation = useAddKomentarTugas(tugasId);
  const deleteKomentarMutation = useDeleteKomentarTugas(tugasId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState("");
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [commentText, setCommentText] = useState("");

  const allowedExts = useMemo(
    () => getAllowedExtensions(tugas?.format_file),
    [tugas?.format_file]
  );
  const acceptAttr = allowedExts ? allowedExts.join(",") : undefined;
  const formatSummary = useMemo(() => {
    if (!allowedExts) return "Semua format umum (PDF, DOCX, XLS, Gambar, ZIP)";
    return Array.from(new Set(allowedExts.map((e) => e.replace(".", "").toUpperCase()))).join(
      ", "
    );
  }, [allowedExts]);

  const teacherAttachments = useMemo(() => {
    return parseLampiran(tugas?.file_lampiran);
  }, [tugas?.file_lampiran]);

  const handleSelectFile = (file?: File) => {
    if (!file) return;
    const msg = validateFile(file, tugas?.format_file);
    setFileError(msg);
    if (msg) {
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setSelectedFile(file);
    }
  };

  const handleSubmitTugas = () => {
    if (!tugas) return;
    const isEdit = Boolean(tugas.pengumpulan);

    if (!isEdit && !selectedFile) {
      setFileError("Silakan pilih berkas jawaban tugas terlebih dahulu.");
      return;
    }

    setFileError("");
    submitMutation.mutate(
      {
        tugasId: tugas.id,
        submissionId: tugas.pengumpulan?.id,
        file: selectedFile,
        catatan: catatan.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            isEdit
              ? "Jawaban tugas berhasil diperbarui"
              : "Tugas berhasil dikumpulkan tepat waktu"
          );
          setSelectedFile(null);
          setIsEditingSubmission(false);
          refetch();
        },
        onError: (err) => {
          const msg =
            err instanceof Error ? err.message : "Gagal mengumpulkan tugas. Coba lagi.";
          setFileError(msg);
          toast.error(msg);
        },
      }
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || addKomentarMutation.isPending) return;

    addKomentarMutation.mutate(text, {
      onSuccess: () => {
        setCommentText("");
        toast.success("Komentar kelas berhasil dikirim");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal mengirim komentar kelas"
        );
      },
    });
  };

  const handleDeleteComment = (komentarId: string) => {
    deleteKomentarMutation.mutate(komentarId, {
      onSuccess: () => {
        toast.success("Komentar berhasil dihapus");
      },
      onError: (err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal menghapus komentar"
        );
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
        <div className="h-6 w-48 bg-slate-200 animate-pulse rounded-md" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-10 w-3/4 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-5 w-1/3 bg-slate-200 animate-pulse rounded-md" />
            <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !tugas) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Tugas Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">
          Tugas mungkin telah dihapus oleh guru atau Anda tidak memiliki akses ke tugas ini.
        </p>
        <div className="pt-2">
          <Link href="/siswa/tugas">
            <Button variant="secondary" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Tugas</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSubmitted = Boolean(tugas.pengumpulan);
  const isGraded = Boolean(
    tugas.pengumpulan &&
      (tugas.pengumpulan.status === "dinilai" ||
        (tugas.pengumpulan.nilai !== null && tugas.pengumpulan.nilai !== undefined))
  );
  const isOverdue = tugas.lewat_deadline && !isSubmitted;

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/siswa/tugas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Tugas Kelas</span>
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span>Tugas</span>
          <span>•</span>
          <span className="font-medium text-slate-600">{tugas.nama_mapel}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <ClipboardList className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                    {tugas.judul}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900">
                    {formatNamaWithGelar(tugas.nama_guru, tugas.gelar_guru)}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded-md border border-blue-100">
                    {tugas.nama_mapel}
                  </span>
                  {tugas.topik && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md">
                        {tugas.topik}
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-100 mt-3 text-xs">
                  <span className="font-bold text-slate-700">100 poin</span>
                  <div
                    className={cn(
                      "font-semibold flex items-center gap-1.5",
                      isOverdue
                        ? "text-red-600"
                        : tugas.mendesak
                        ? "text-rose-600 font-bold"
                        : "text-slate-600"
                    )}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatClassroomDeadline(tugas.deadline)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Petunjuk Pengerjaan
              </h2>
              {tugas.deskripsi ? (
                <div className="text-sm text-slate-800 leading-relaxed font-sans space-y-2 break-words [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_a]:text-blue-600 [&_a]:underline">
                  <div dangerouslySetInnerHTML={{ __html: formatInstructionHtml(tugas.deskripsi) }} />
                </div>
              ) : (
                <p className="text-sm italic text-slate-400">Tidak ada petunjuk tertulis.</p>
              )}

              <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  Format berkas yang diterima:{" "}
                  <strong className="text-slate-700 font-semibold">{formatSummary}</strong>
                </span>
              </div>
            </div>

            {teacherAttachments.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lampiran Berkas / Materi Pendukung ({teacherAttachments.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {teacherAttachments.map((att, idx) => {
                    const isVideo =
                      att.type === "youtube" ||
                      att.url.includes("youtube.com") ||
                      att.url.includes("youtu.be");
                    const isDoc =
                      att.type === "doc" ||
                      att.name.endsWith(".pdf") ||
                      att.name.endsWith(".docx") ||
                      att.name.endsWith(".doc");

                    return (
                      <a
                        key={idx}
                        href={att.url && att.url !== "#" ? att.url : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isVideo
                              ? "bg-red-100 text-red-600 group-hover:bg-red-200"
                              : isDoc
                              ? "bg-blue-100 text-blue-600 group-hover:bg-blue-200"
                              : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200"
                          )}
                        >
                          {isVideo ? (
                            <Video className="w-5 h-5" />
                          ) : isDoc ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <LinkIcon className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                            {att.name || "Buka Lampiran"}
                          </p>
                          <p className="text-[11px] text-slate-400 capitalize">
                            {isVideo ? "Video Pembelajaran" : isDoc ? "Dokumen Berkas" : "Tautan Eksternal"}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Komentar kelas ({comments.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Terlihat oleh seluruh anggota kelas
              </span>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-4 divide-y divide-slate-100">
                {comments.map((c) => {
                  const isAuthor = currentUser?.id === c.user_id;
                  const isTeacher = c.peran_user?.toLowerCase() === "guru";
                  const isKurikulum = c.peran_user?.toLowerCase() === "kurikulum";

                  return (
                    <div
                      key={c.id}
                      className="group flex items-start gap-3 pt-3 first:pt-0 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs text-white",
                          isTeacher
                            ? "bg-blue-600"
                            : isKurikulum
                            ? "bg-purple-600"
                            : "bg-emerald-600"
                        )}
                      >
                        {getInitials(c.nama_user)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              {c.nama_user}
                              {c.gelar_user ? `, ${c.gelar_user}` : ""}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                                isTeacher
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : isKurikulum
                                  ? "bg-purple-50 text-purple-700 border-purple-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}
                            >
                              {c.peran_user || "Siswa"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {c.waktu_format ||
                                new Date(c.created_at).toLocaleString("id-ID", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                            </span>
                          </div>

                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              disabled={deleteKomentarMutation.isPending}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="Hapus komentar saya"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-wrap leading-relaxed break-words">
                          {c.pesan}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/60">
                <p className="text-xs text-slate-500">
                  Belum ada komentar kelas. Ajukan pertanyaan atau diskusi seputar tugas ini kepada guru dan teman sekelas.
                </p>
              </div>
            )}

            <form onSubmit={handleAddComment} className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-xs">
                {getInitials(currentUser?.nama_lengkap || currentUser?.username || "S")}
              </div>
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-2 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Tambahkan komentar kelas..."
                  disabled={addKomentarMutation.isPending}
                  className="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || addKomentarMutation.isPending}
                  className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                  title="Kirim komentar kelas"
                >
                  {addKomentarMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4 sticky top-6 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tugas Anda</h3>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-1 rounded-full border",
                  isGraded
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : isSubmitted
                    ? "bg-teal-50 text-teal-700 border-teal-200"
                    : isOverdue
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : tugas.mendesak
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                )}
              >
                {isGraded
                  ? "Dinilai"
                  : isSubmitted
                  ? "Diserahkan"
                  : isOverdue
                  ? "Terlewat"
                  : tugas.mendesak
                  ? "Mendesak"
                  : "Ditugaskan"}
              </span>
            </div>

            {isGraded && tugas.pengumpulan?.nilai !== null && tugas.pengumpulan?.nilai !== undefined && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Nilai Akhir:</span>
                  <span className="text-2xl font-black text-emerald-700">
                    {tugas.pengumpulan.nilai} <span className="text-sm font-normal text-emerald-600">/ 100</span>
                  </span>
                </div>
                {tugas.pengumpulan?.feedback_guru && (
                  <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 space-y-1">
                    <p className="font-semibold text-emerald-800">Catatan dari Guru:</p>
                    <p className="italic leading-relaxed">{tugas.pengumpulan.feedback_guru}</p>
                  </div>
                )}
              </div>
            )}

            {isSubmitted && !isEditingSubmission ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <FileCheck2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 truncate" title={tugas.pengumpulan?.nama_file}>
                          {tugas.pengumpulan?.nama_file || "Berkas Jawaban"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {tugas.pengumpulan?.submitted_at
                            ? `Diserahkan: ${formatTanggal(tugas.pengumpulan.submitted_at, true)}`
                            : "Sudah diserahkan"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {tugas.pengumpulan?.file_url && (
                    <a
                      href={tugas.pengumpulan.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-blue-600 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/60 rounded-lg py-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Buka / Unduh Berkas Jawaban</span>
                    </a>
                  )}
                </div>

                <div className="text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/90 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                    <span>Catatan Anda untuk Guru:</span>
                  </div>
                  {tugas.pengumpulan?.catatan ? (
                    <p className="text-slate-800 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200/70">
                      "{tugas.pengumpulan.catatan}"
                    </p>
                  ) : (
                    <p className="text-slate-400 italic">
                      Tidak ada catatan yang dilampirkan.
                    </p>
                  )}
                </div>

                {!isGraded && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditingSubmission(true);
                      setCatatan(tugas.pengumpulan?.catatan || "");
                    }}
                    className="w-full text-xs font-semibold border-slate-300 hover:bg-slate-100 gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Ganti Jawaban</span>
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {isEditingSubmission && (
                  <div className="flex items-center justify-between text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-xl">
                    <span className="font-medium">Mode Penggantian Berkas</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSubmission(false);
                        setSelectedFile(null);
                        setFileError("");
                      }}
                      className="text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="submission-file-input"
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      handleSelectFile(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center cursor-pointer transition-all",
                      isDragging
                        ? "border-blue-600 bg-blue-50/70"
                        : fileError
                        ? "border-red-300 bg-red-50/40 hover:bg-red-50/60"
                        : "border-slate-300 bg-slate-50/60 hover:bg-slate-100/70"
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                      <FileUp className="w-5 h-5" />
                    </div>

                    {selectedFile ? (
                      <div className="space-y-1 w-full px-2">
                        <p className="text-xs font-bold text-slate-800 truncate" title={selectedFile.name}>
                          {selectedFile.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{formatBytes(selectedFile.size)}</p>
                        <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Siap dikumpulkan
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-blue-600 hover:underline">
                          + Tambah atau buat berkas
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Tarik berkas ke sini atau klik untuk memilih
                        </p>
                      </div>
                    )}
                  </label>

                  <input
                    ref={fileInputRef}
                    id="submission-file-input"
                    type="file"
                    accept={acceptAttr}
                    className="sr-only"
                    onChange={(e) => handleSelectFile(e.target.files?.[0])}
                  />

                  <p className="text-[11px] text-slate-400 mt-2 text-center">
                    Format: <span className="font-medium text-slate-600">{formatSummary}</span> • Maks. 50 MB
                  </p>
                </div>

                {fileError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="leading-snug">{fileError}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="catatan-guru" className="block text-xs font-semibold text-slate-700">
                      Catatan untuk guru (opsional)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {catatan.length}/500
                    </span>
                  </div>
                  <textarea
                    id="catatan-guru"
                    rows={3}
                    maxLength={500}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Tuliskan pesan atau catatan pribadi untuk guru pengajar..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Pesan ini terkirim langsung ke lembar penilaian guru pengajar.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmitTugas}
                  disabled={submitMutation.isPending || (!isEditingSubmission && !selectedFile)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Mengirim Jawaban...</span>
                    </>
                  ) : isEditingSubmission ? (
                    <span>Simpan Perubahan Jawaban</span>
                  ) : (
                    <span>Serahkan Tugas</span>
                  )}
                </Button>

                {isOverdue && !isSubmitted && (
                  <p className="text-[11px] text-center text-red-600 font-medium">
                    Tenggat waktu telah lewat. Pengumpulan Anda akan dicatat terlambat.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4 text-xs text-slate-500 flex items-start gap-3">
            <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Berkas jawaban dan catatan Anda hanya dapat dilihat oleh guru pengajar dan Anda sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
