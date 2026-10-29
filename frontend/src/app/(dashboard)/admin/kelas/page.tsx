"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Search,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { Kelas, Guru } from "@/types";

export default function MasterKelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formNamaKelas, setFormNamaKelas] = useState("");
  const [formTingkat, setFormTingkat] = useState<number>(10);
  const [formJurusan, setFormJurusan] = useState("MIPA");
  const [formWaliGuruId, setFormWaliGuruId] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resKelas, resGuru] = await Promise.all([
        fetchAPI<{ data: Kelas[] }>("/master/kelas"),
        fetchAPI<{ data: Guru[] }>("/master/guru"),
      ]);

      setKelasList(resKelas.data || []);
      setGuruList(resGuru.data || []);
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

  const handleCreateKelas = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await fetchAPI("/master/kelas", {
        method: "POST",
        body: JSON.stringify({
          nama_kelas: formNamaKelas.trim(),
          tingkat: Number(formTingkat),
          jurusan: formJurusan.trim(),
          wali_guru_id: formWaliGuruId || undefined,
        }),
      });

      setSuccessMsg(`Kelas ${formNamaKelas} berhasil ditambahkan!`);
      setIsModalOpen(false);
      setFormNamaKelas("");
      setFormWaliGuruId("");
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKelas = async (id: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelas ${nama}?`)) return;
    setIsDeletingId(id);
    try {
      await fetchAPI(`/master/kelas/${id}`, { method: "DELETE" });
      setSuccessMsg(`Kelas ${nama} berhasil dihapus`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const filteredKelas = kelasList.filter((k) => {
    const q = searchQuery.toLowerCase();
    return k.nama_kelas.toLowerCase().includes(q) || k.jurusan.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Master Data Kelas & Rombel
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Kelola rombongan belajar, penetapan wali kelas, dan jurusan akademik
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas</span>
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
              placeholder="Cari berdasarkan nama kelas atau jurusan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-xs font-medium">Memuat data kelas...</p>
          </div>
        ) : filteredKelas.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <Building2 className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data kelas ditemukan</p>
            <p className="text-xs text-slate-500">
              Gunakan tombol Tambah Kelas untuk mendaftarkan rombel baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Nama Rombel / Kelas</th>
                  <th className="py-3 px-3">Tingkat</th>
                  <th className="py-3 px-3">Jurusan</th>
                  <th className="py-3 px-3">Wali Kelas</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredKelas.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 font-bold text-slate-900">{k.nama_kelas}</td>
                    <td className="py-3 px-3 font-medium text-slate-700">Kelas {k.tingkat}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold text-[11px]">
                        {k.jurusan}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                        <span>{k.wali_guru?.user?.nama_lengkap || "Belum Ditugaskan"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        disabled={isDeletingId === k.id}
                        onClick={() => handleDeleteKelas(k.id, k.nama_kelas)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Kelas"
                      >
                        {isDeletingId === k.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
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
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Kelas Baru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daftarkan rombongan belajar baru</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateKelas} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Kelas</label>
                <input
                  type="text"
                  required
                  value={formNamaKelas}
                  onChange={(e) => setFormNamaKelas(e.target.value)}
                  placeholder="Contoh: X MIPA 1 / XII IPA 2"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tingkat</label>
                  <select
                    value={formTingkat}
                    onChange={(e) => setFormTingkat(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value={10}>Kelas 10 (Fase E)</option>
                    <option value={11}>Kelas 11 (Fase F)</option>
                    <option value={12}>Kelas 12 (Fase F)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jurusan</label>
                  <select
                    value={formJurusan}
                    onChange={(e) => setFormJurusan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="MIPA">MIPA</option>
                    <option value="IPS">IPS</option>
                    <option value="Bahasa">Bahasa</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Wali Kelas</label>
                <select
                  value={formWaliGuruId}
                  onChange={(e) => setFormWaliGuruId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  <option value="">Pilih Wali Kelas (Opsional)</option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.user?.nama_lengkap || "Guru"}{g.nip ? ` (${g.nip})` : ""}
                    </option>
                  ))}
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
                    <span>Simpan Kelas</span>
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
