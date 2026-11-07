"use client";

import React, { useEffect, useState } from "react";
import { BookOpen, Download, FolderX, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { useSiswaMateri } from "@/hooks/useSiswaMateri";
import { cn, formatTanggal, getMapelBadgeClass } from "@/lib/utils";
import type { APIResponse, SiswaMateri, SiswaMateriDownload } from "@/types/api";

function formatUkuran(mb: number) {
  if (!mb) return "";
  return `${Number(mb.toFixed(1))} MB`;
}

function MateriSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
      ))}
    </div>
  );
}

export default function SiswaMateriPage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(input.trim()), 300);
    return () => clearTimeout(t);
  }, [input]);

  const { data, isLoading, isError, refetch } = useSiswaMateri(search, mapelId);

  async function bukaMateri(id: string) {
    setOpeningId(id);
    // Buka tab sekarang (masih dalam gestur klik) supaya tidak diblokir popup blocker.
    const tab = window.open("about:blank", "_blank");
    try {
      const res = await fetchAPI<APIResponse<SiswaMateriDownload>>(
        `/siswa/materi/${id}/download`,
      );
      let url = res.data?.file_url;
      if (!url) throw new Error("Tautan materi tidak tersedia");

      // Jika URL adalah dummy domain storage.sman2padalarang.sch.id atau path lokal, arahkan ke proxy unduh backend
      if (url.includes("storage.sman2padalarang.sch.id") || url.includes("storage.supabase.co/lms/") || !url.startsWith("http")) {
        url = url.startsWith("/") ? url : `/api/v1/materi/${id}/download`;
      }

      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.open(url, "_blank", "noopener");
      }
    } catch (err) {
      tab?.close();
      toast.error(err instanceof Error ? err.message : "Gagal membuka materi");
    } finally {
      setOpeningId(null);
    }
  }

  function resetFilter() {
    setInput("");
    setSearch("");
    setMapelId("");
  }

  const items: SiswaMateri[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
    ? (data as unknown as SiswaMateri[])
    : [];
  const mapelList = Array.isArray(data?.mapel) ? data.mapel : [];
  const adaFilter = Boolean(search || mapelId);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
          Materi Pembelajaran
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Baca atau unduh materi dari guru kamu
        </p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Cari materi..."
          className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
        />
      </div>

      {mapelList.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setMapelId("")}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
              mapelId === ""
                ? "bg-[#1E3A8A] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            Semua
          </button>
          {mapelList.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMapelId(m.id)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors",
                mapelId === m.id
                  ? "bg-[#1E3A8A] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {m.nama_mapel}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <MateriSkeleton />
      ) : isError ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-700">Gagal memuat materi.</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
          <FolderX className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800 mt-3">
            {adaFilter ? "Materi tidak ditemukan" : "Belum ada materi"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {adaFilter
              ? "Coba kata kunci lain atau hapus filter."
              : "Materi dari guru akan muncul di sini."}
          </p>
          {adaFilter && (
            <Button className="mt-4" size="sm" variant="secondary" onClick={resetFilter}>
              Reset filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((m) => {
            const info = [m.tipe_file.toUpperCase(), formatUkuran(m.ukuran_mb)]
              .filter(Boolean)
              .join(" ");
            const membuka = openingId === m.id;
            return (
              <div
                key={m.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-slate-900 leading-snug">
                      {m.judul}
                    </h3>
                    <span
                      className={cn(
                        "inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                        getMapelBadgeClass(m.nama_mapel),
                      )}
                    >
                      {m.nama_mapel}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  {m.nama_guru} • {formatTanggal(m.created_at)}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-medium text-slate-500">{info}</span>
                  <Button size="sm" disabled={membuka} onClick={() => bukaMateri(m.id)}>
                    {membuka ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Unduh
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}