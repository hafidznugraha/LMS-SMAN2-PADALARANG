"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { MataPelajaran } from "@/types";

export default function MasterMapelPage() {
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState<MataPelajaran | null>(null);

  const [formKodeMapel, setFormKodeMapel] = useState("");
  const [formNamaMapel, setFormNamaMapel] = useState("");
  const [formKategori, setFormKategori] = useState("Umum");

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAPI<{ data: MataPelajaran[] }>("/master/mapel");
      setMapelList(res.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingMapel(null);
    setFormKodeMapel("");
    setFormNamaMapel("");
    setFormKategori("Umum");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mapel: MataPelajaran) => {
    setEditingMapel(mapel);
    setFormKodeMapel(mapel.kode_mapel);
    setFormNamaMapel(mapel.nama_mapel);
    setFormKategori(mapel.kategori || "Umum");
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingMapel) {
        await fetchAPI(`/master/mapel/${editingMapel.id}`, {
          method: "PUT",
          body: JSON.stringify({
            kode_mapel: formKodeMapel.trim().toUpperCase(),
            nama_mapel: formNamaMapel.trim(),
            kategori: formKategori.trim(),
          }),
        });
        setSuccessMsg(`Mata pelajaran ${formNamaMapel} berhasil diperbarui!`);
      } else {
        await fetchAPI("/master/mapel", {
          method: "POST",
          body: JSON.stringify({
            kode_mapel: formKodeMapel.trim().toUpperCase(),
            nama_mapel: formNamaMapel.trim(),
            kategori: formKategori.trim(),
          }),
        });
        setSuccessMsg(`Mata pelajaran ${formNamaMapel} berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
      setFormKodeMapel("");
      setFormNamaMapel("");
      setFormKategori("Umum");
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus mata pelajaran ${nama}?`)) return;
    setIsDeletingId(id);
    try {
      await fetchAPI(`/master/mapel/${id}`, { method: "DELETE" });
      setSuccessMsg(`Mata pelajaran ${nama} berhasil dihapus!`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case "Eksakta":
        return "bg-blue-50 text-blue-700 border-blue-200/60";
      case "Sosial":
        return "bg-purple-50 text-purple-700 border-purple-200/60";
      case "Bahasa":
        return "bg-amber-50 text-amber-700 border-amber-200/60";
      case "Kejuruan":
        return "bg-rose-50 text-rose-700 border-rose-200/60";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    }
  };

  const filteredMapel = mapelList.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.nama_mapel.toLowerCase().includes(q) ||
      m.kode_mapel.toLowerCase().includes(q) ||
      m.kategori?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Master Data Mata Pelajaran
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Kelola katalog kurikulum mata pelajaran, kode referensi, dan rumpun akademik
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4" />
          <span>Tambah Mata Pelajaran</span>
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-700 hover:text-rose-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode atau nama mata pelajaran..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
            />
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{filteredMapel.length}</span> Mapel
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-xs font-medium">Memuat data mata pelajaran...</p>
          </div>
        ) : filteredMapel.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada mata pelajaran ditemukan</p>
            <p className="text-xs text-slate-500">
              Gunakan tombol Tambah Mata Pelajaran untuk mendaftarkan mata pelajaran baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Kode Mapel</th>
                  <th className="py-3 px-3">Nama Mata Pelajaran</th>
                  <th className="py-3 px-3">Rumpun / Kategori</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredMapel.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                        {m.kode_mapel}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{m.nama_mapel}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] border ${getKategoriBadge(
                          m.kategori
                        )}`}
                      >
                        {m.kategori || "Umum"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          title="Edit Mata Pelajaran"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={isDeletingId === m.id}
                          onClick={() => handleDelete(m.id, m.nama_mapel)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Mata Pelajaran"
                        >
                          {isDeletingId === m.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-900" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingMapel ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingMapel
                      ? "Perbarui informasi mata pelajaran akademik"
                      : "Daftarkan mata pelajaran baru ke dalam kurikulum"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kode Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formKodeMapel}
                  onChange={(e) => setFormKodeMapel(e.target.value)}
                  placeholder="Contoh: INF-X / MTK-XII / BIO-XI"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase font-mono"
                />
                <p className="text-[10px] text-slate-400">Kode unik sebagai pengenal dalam jadwal dan leger.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={formNamaMapel}
                  onChange={(e) => setFormNamaMapel(e.target.value)}
                  placeholder="Contoh: Informatika / Kimia Peminatan"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Rumpun / Kategori</label>
                <select
                  value={formKategori}
                  onChange={(e) => setFormKategori(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  <option value="Umum">Umum (Wajib Nasional)</option>
                  <option value="Eksakta">Eksakta (MIPA)</option>
                  <option value="Sosial">Sosial (IPS)</option>
                  <option value="Bahasa">Bahasa & Budaya</option>
                  <option value="Kejuruan">Pilihan / Mulok</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingMapel ? "Perbarui Mapel" : "Simpan Mapel"}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
