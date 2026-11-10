"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FileUp, Loader2, X, FileCheck2, AlertCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubmitTugas } from "@/hooks/useSiswaTugas";
import { cn, formatTanggal } from "@/lib/utils";
import type { SiswaTugas } from "@/types/api";

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

export function getAllowedExtensions(formatSpec?: string): string[] | null {
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
    return "Format file executable (.exe, .bat, dll.) tidak diizinkan demi keamanan";
  }
  if (f.size > MAX_BYTES) return "Ukuran file maksimal 50 MB";
  if (f.size === 0) return "File kosong";

  const allowedExts = getAllowedExtensions(formatSpec);
  if (allowedExts && !allowedExts.includes(ext)) {
    const labelList = Array.from(new Set(allowedExts.map((e) => e.replace(".", "").toUpperCase()))).join(", ");
    const userExt = ext ? ext.replace(".", "").toUpperCase() : "TANPA EKSTENSI";
    return `Format berkas (${userExt}) tidak diizinkan. Guru hanya menerima format: ${labelList}`;
  }

  return "";
}

interface Props {
  tugas: SiswaTugas;
  onClose: () => void;
}

// Render dengan key={tugas.id} dari parent agar state ter-reset tiap tugas.
export function SubmitTugasDialog({ tugas, onClose }: Props) {
  const edit = Boolean(tugas.pengumpulan);
  const [file, setFile] = useState<File | null>(null);
  const [catatan, setCatatan] = useState(tugas.pengumpulan?.catatan ?? "");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useSubmitTugas();
  const pending = mutation.isPending;

  const allowedExts = useMemo(() => getAllowedExtensions(tugas.format_file), [tugas.format_file]);
  const acceptAttr = allowedExts ? allowedExts.join(",") : undefined;
  const formatSummary = useMemo(() => {
    if (!allowedExts) return "Semua format umum (PDF, Word, Excel, Gambar, ZIP)";
    return Array.from(new Set(allowedExts.map((e) => e.replace(".", "").toUpperCase()))).join(", ");
  }, [allowedExts]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  function pilihFile(f: File | undefined) {
    if (!f) return;
    const msg = validateFile(f, tugas.format_file);
    setError(msg);
    if (msg) {
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } else {
      setFile(f);
    }
  }

  function kirim() {
    if (!edit && !file) {
      setError("Pilih file jawaban terlebih dahulu");
      return;
    }
    setError("");
    mutation.mutate(
      { tugasId: tugas.id, submissionId: tugas.pengumpulan?.id, file, catatan: catatan.trim() },
      {
        onSuccess: () => {
          toast.success(edit ? "Jawaban berhasil diperbarui" : "Tugas berhasil dikumpulkan");
          onClose();
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : "Gagal mengirim tugas");
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4"
      onClick={() => !pending && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={edit ? "Ganti jawaban" : "Kumpulkan tugas"}
        className="w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">
              {edit ? "Ganti Jawaban" : "Kumpulkan Tugas"}
            </h3>
            <p className="text-sm text-slate-700 mt-0.5 font-medium">{tugas.judul}</p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs text-slate-500">
                Deadline: {formatTanggal(tugas.deadline, true)}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                <FileCheck2 className="w-3 h-3" /> Format: {formatSummary}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Tutup"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {tugas.deskripsi && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-xs font-semibold text-slate-600 mb-1">Petunjuk Pengerjaan:</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{tugas.deskripsi}</p>
            </div>
          )}

          {/* Lampiran Materi / Referensi dari Guru */}
          {(() => {
            const raw = tugas.file_lampiran;
            if (!raw) return null;
            let list: { type: string; name: string; url: string }[] = [];
            try {
              const p = JSON.parse(raw);
              if (Array.isArray(p)) list = p;
              else if (typeof p === 'string' && p.trim()) list = [{ type: 'file', name: 'Berkas Lampiran', url: p.trim() }];
            } catch {
              if (typeof raw === 'string' && raw.trim() && raw !== '[]' && raw !== '{}') {
                list = [{ type: 'file', name: 'Berkas Lampiran', url: raw.trim() }];
              }
            }
            if (list.length === 0) return null;
            return (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Lampiran Bahan dari Guru:</p>
                <div className="grid grid-cols-1 gap-2">
                  {list.map((att, i) => (
                    <a
                      key={i}
                      href={att.url && att.url !== '#' ? att.url : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-xs font-medium text-slate-800 transition-colors"
                    >
                      <span className="truncate">{att.name || 'Buka Lampiran'}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            );
          })()}

          <div>
            <label
              htmlFor="file-jawaban"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pilihFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition-colors",
                dragging
                  ? "border-blue-600 bg-blue-50"
                  : error
                  ? "border-red-300 bg-red-50/50 hover:bg-red-50"
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100",
              )}
            >
              <FileUp className={cn("w-6 h-6", error ? "text-red-500" : "text-slate-500")} />
              {file ? (
                <>
                  <span className="text-sm font-semibold text-slate-800 break-all">{file.name}</span>
                  <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                  <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-1">
                    Format sesuai
                  </span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">
                    {edit ? "Pilih berkas pengganti (opsional)" : "Tarik berkas ke sini atau klik untuk memilih"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Format yang diterima: <strong className="text-slate-700 font-semibold">{formatSummary}</strong> • maks. 50 MB
                  </span>
                </>
              )}
            </label>
            <input
              ref={inputRef}
              id="file-jawaban"
              type="file"
              accept={acceptAttr}
              className="sr-only"
              onChange={(e) => pilihFile(e.target.files?.[0])}
            />
            {edit && !file && tugas.pengumpulan && (
              <p className="text-xs text-slate-500 mt-1.5">
                Berkas saat ini: <span className="font-medium text-slate-700">{tugas.pengumpulan.nama_file}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="catatan" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan untuk guru (opsional)
            </label>
            <textarea
              id="catatan"
              rows={3}
              maxLength={500}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none"
              placeholder="Tulis catatan singkat jika perlu"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200/80 px-3 py-2 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-5 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Batal
          </Button>
          <Button onClick={kirim} disabled={pending || (!edit && !file)}>
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {edit ? "Simpan Perubahan" : "Kumpulkan"}
          </Button>
        </div>
      </div>
    </div>
  );
}
