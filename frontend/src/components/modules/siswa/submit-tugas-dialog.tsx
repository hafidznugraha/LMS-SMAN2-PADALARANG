"use client";

import React, { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSubmitTugas } from "@/hooks/useSiswaTugas";
import { cn, formatTanggal } from "@/lib/utils";
import type { SiswaTugas } from "@/types/api";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = [".pdf", ".docx", ".zip", ".jpg", ".jpeg", ".png"];

function formatBytes(b: number) {
  return b >= 1024 * 1024
    ? `${(b / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`;
}

function validateFile(f: File): string {
  const dot = f.name.lastIndexOf(".");
  const ext = dot >= 0 ? f.name.slice(dot).toLowerCase() : "";
  if (!ALLOWED.includes(ext)) return "Format file harus PDF, DOCX, ZIP, JPG, atau PNG";
  if (f.size > MAX_BYTES) return "Ukuran file maksimal 10 MB";
  if (f.size === 0) return "File kosong";
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, pending]);

  function pilihFile(f: File | undefined) {
    if (!f) return;
    const msg = validateFile(f);
    setError(msg);
    setFile(msg ? null : f);
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
            <p className="text-sm text-slate-700 mt-0.5">{tugas.judul}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Deadline: {formatTanggal(tugas.deadline, true)}
            </p>
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
            <p className="text-sm text-slate-600 whitespace-pre-line">{tugas.deskripsi}</p>
          )}

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
                  : "border-slate-300 bg-slate-50 hover:bg-slate-100",
              )}
            >
              <FileUp className="w-6 h-6 text-slate-500" />
              {file ? (
                <>
                  <span className="text-sm font-semibold text-slate-800 break-all">{file.name}</span>
                  <span className="text-xs text-slate-500">{formatBytes(file.size)}</span>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-slate-700">
                    {edit ? "Pilih file pengganti (opsional)" : "Tarik file ke sini atau klik untuk memilih"}
                  </span>
                  <span className="text-xs text-slate-500">
                    PDF, DOCX, ZIP, JPG, PNG • maksimal 10 MB
                  </span>
                </>
              )}
            </label>
            <input
              ref={inputRef}
              id="file-jawaban"
              type="file"
              accept={ALLOWED.join(",")}
              className="sr-only"
              onChange={(e) => pilihFile(e.target.files?.[0])}
            />
            {edit && !file && tugas.pengumpulan && (
              <p className="text-xs text-slate-500 mt-1.5">
                File saat ini: {tugas.pengumpulan.nama_file}
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
            <p role="alert" className="text-xs font-medium text-red-600">
              {error}
            </p>
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