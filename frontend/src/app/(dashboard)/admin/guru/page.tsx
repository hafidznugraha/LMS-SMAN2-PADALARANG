"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  GraduationCap,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserX,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchAPI } from "@/lib/api";
import { Guru } from "@/types";

export default function MasterGuruPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formNama, setFormNama] = useState("");
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("password123");
  const [formNIP, setFormNIP] = useState("");
  const [formGelar, setFormGelar] = useState("S.Pd");
  const [formRole, setFormRole] = useState<"guru" | "wali_kelas">("guru");
  const [formTelp, setFormTelp] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchAPI<{ data: Guru[] }>("/master/guru");
      setGuruList(res.data || []);
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

  const handleCreateGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await fetchAPI("/users", {
        method: "POST",
        body: JSON.stringify({
          username: formUsername.trim(),
          password: formPassword,
          nama_lengkap: formNama.trim(),
          email: formEmail.trim(),
          role: formRole,
          nip: formNIP.trim(),
          gelar: formGelar.trim(),
          no_telepon: formTelp.trim(),
        }),
      });

      setSuccessMsg(`Akun guru ${formNama} berhasil didaftarkan!`);
      setIsModalOpen(false);
      setFormNama("");
      setFormUsername("");
      setFormEmail("");
      setFormNIP("");
      setFormGelar("S.Pd");
      setFormTelp("");
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (userId: string, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menonaktifkan akun ${nama}?`)) return;
    try {
      await fetchAPI(`/users/${userId}`, { method: "DELETE" });
      setSuccessMsg(`Akun ${nama} dinonaktifkan`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    }
  };

  const filteredGuru = guruList.filter((g) => {
    const q = searchQuery.toLowerCase();
    const nama = g.user?.nama_lengkap?.toLowerCase() || "";
    const nip = g.nip.toLowerCase();
    return nama.includes(q) || nip.includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Master Data Guru
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Kelola data pokok tenaga pendidik, NIP, gelar akademik, dan penugasan peran
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>Tambah Guru</span>
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
              placeholder="Cari berdasarkan nama atau NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-xs font-medium">Memuat data guru...</p>
          </div>
        ) : filteredGuru.length === 0 ? (
          <div className="py-16 text-center space-y-2 text-slate-400">
            <GraduationCap className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada data guru ditemukan</p>
            <p className="text-xs text-slate-500">
              Gunakan tombol Tambah Guru untuk mendaftarkan akun pendidik baru.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                  <th className="py-3 px-3">Nama & Gelar</th>
                  <th className="py-3 px-3">NIP</th>
                  <th className="py-3 px-3">Peran Akun</th>
                  <th className="py-3 px-3">Email & Kontak</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredGuru.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">
                        {item.user?.nama_lengkap || "Guru"}
                        {item.gelar ? `, ${item.gelar}` : ""}
                      </div>
                      <div className="text-[11px] text-slate-400">@{item.user?.username}</div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">{item.nip}</td>
                    <td className="py-3 px-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold text-[11px] capitalize">
                        {item.user?.role?.replace("_", " ") || "Guru"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div>{item.user?.email}</div>
                      <div className="text-[11px] text-slate-400">{item.no_telepon || "-"}</div>
                    </td>
                    <td className="py-3 px-3">
                      {item.user?.is_active ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold text-[10px]">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {item.user && item.user.is_active && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeactivate(item.user!.id, item.user!.nama_lengkap)
                          }
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Nonaktifkan Akun"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Data Guru</h3>
                <p className="text-xs text-slate-500 mt-0.5">Daftarkan akun pendidik baru</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGuru} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Contoh: Parhan Romdhoni"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Gelar Akademik</label>
                  <input
                    type="text"
                    value={formGelar}
                    onChange={(e) => setFormGelar(e.target.value)}
                    placeholder="S.Pd / M.Pd / S.Si"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Peran Akun</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as "guru" | "wali_kelas")}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    <option value="guru">Guru Pengampu</option>
                    <option value="wali_kelas">Wali Kelas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Username</label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="guru_parhan"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kata Sandi Default</label>
                  <input
                    type="text"
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email Sekolah</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="parhan@guru.sman2padalarang.sch.id"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">NIP</label>
                  <input
                    type="text"
                    required
                    value={formNIP}
                    onChange={(e) => setFormNIP(e.target.value)}
                    placeholder="198809202014021003"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nomor Telepon</label>
                  <input
                    type="text"
                    value={formTelp}
                    onChange={(e) => setFormTelp(e.target.value)}
                    placeholder="+628..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
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
                    <span>Daftarkan Guru</span>
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
