"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  GraduationCap,
  X,
  Loader2,
  UserX,
  UserCheck,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { fetchAPI } from "@/lib/api";
import { Guru } from "@/types";

export default function MasterGuruPage() {
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

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
    try {
      const res = await fetchAPI<{ data: Guru[] }>("/master/guru");
      setGuruList(res.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreateModal = () => {
    setEditingGuru(null);
    setFormNama("");
    setFormUsername("");
    setFormEmail("");
    setFormPassword("password123");
    setFormNIP("");
    setFormGelar("S.Pd");
    setFormRole("guru");
    setFormTelp("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (guru: Guru) => {
    setEditingGuru(guru);
    setFormNama(guru.user?.nama_lengkap || "");
    setFormUsername(guru.user?.username || "");
    setFormEmail(guru.user?.email || "");
    setFormPassword("");
    setFormNIP(guru.nip || "");
    setFormGelar(guru.gelar || "S.Pd");
    setFormRole((guru.user?.role as ("guru" | "wali_kelas")) || "guru");
    setFormTelp(guru.no_telepon || "");
    setIsModalOpen(true);
  };

  const handleSaveGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const cleanTelp = formTelp.trim();
    if (cleanTelp) {
      if (!/^[0-9]+$/.test(cleanTelp)) {
        toast.error("Nomor telepon hanya boleh berisi angka");
        setIsSubmitting(false);
        return;
      }
      if (cleanTelp.length < 10 || cleanTelp.length > 15) {
        toast.error("Nomor telepon harus terdiri dari 10 hingga 15 digit angka");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      if (editingGuru) {
        await fetchAPI(`/users/${editingGuru.user_id}`, {
          method: "PUT",
          body: JSON.stringify({
            nama_lengkap: formNama.trim(),
            email: formEmail.trim(),
            password: formPassword.trim() || undefined,
            role: formRole,
            nip: formNIP.trim(),
            gelar: formGelar.trim(),
            no_telepon: cleanTelp,
          }),
        });
        toast.success(`Data guru ${formNama} berhasil diperbarui!`);
      } else {
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
            no_telepon: cleanTelp,
          }),
        });
        toast.success(`Akun guru ${formNama} berhasil didaftarkan!`);
      }

      setIsModalOpen(false);
      setEditingGuru(null);
      setFormNama("");
      setFormUsername("");
      setFormEmail("");
      setFormNIP("");
      setFormGelar("S.Pd");
      setFormTelp("");
      await loadData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = (userId: string, nama: string, currentActive: boolean) => {
    const actionText = currentActive ? "menonaktifkan" : "mengaktifkan kembali";
    setConfirmState({
      isOpen: true,
      title: currentActive ? "Nonaktifkan Akun Guru" : "Aktifkan Akun Guru",
      message: `Apakah Anda yakin ingin ${actionText} akun pendidik ${nama}?`,
      confirmText: currentActive ? "Nonaktifkan" : "Aktifkan Kembali",
      variant: currentActive ? "warning" : "primary",
      action: async () => {
        try {
          await fetchAPI(`/users/${userId}`, { method: "DELETE" });
          toast.success(`Status akun ${nama} berhasil diubah`);
          await loadData();
        } catch (err: unknown) {
          if (err instanceof Error) {
            toast.error(err.message);
          }
        } finally {
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeletePermanen = (userId: string, nama: string) => {
    setConfirmState({
      isOpen: true,
      title: "Hapus Akun Guru Permanen",
      message: `PERINGATAN: Apakah Anda yakin ingin menghapus data guru ${nama} secara permanen? Seluruh relasi data yang terhapus tidak dapat dipulihkan.`,
      confirmText: "Hapus Permanen",
      variant: "danger",
      action: async () => {
        setIsDeletingId(userId);
        try {
          await fetchAPI(`/users/${userId}?permanent=true`, { method: "DELETE" });
          toast.success(`Akun guru ${nama} berhasil dihapus secara permanen`);
          await loadData();
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
        <Button variant="primary" size="md" onClick={handleOpenCreateModal}>
          <Plus className="w-4 h-4" />
          <span>Tambah Guru</span>
        </Button>
      </div>

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
                  <th className="py-3 px-3">Penugasan & Peran</th>
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
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold text-[10px]">
                          Guru Pengampu
                        </span>
                        {item.kelas_binaan && item.kelas_binaan.length > 0 ? (
                          item.kelas_binaan.map((k) => (
                            <span
                              key={k.id}
                              className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 font-semibold text-[10px]"
                            >
                              Wali Kelas {k.nama_kelas}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Bukan Wali Kelas
                          </span>
                        )}
                      </div>
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-900 hover:bg-blue-50 transition-colors"
                          title="Edit Data Guru"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {item.user && (
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleActive(item.user!.id, item.user!.nama_lengkap, item.user!.is_active)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${
                              item.user.is_active
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={item.user.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
                          >
                            {item.user.is_active ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {item.user && (
                          <button
                            type="button"
                            disabled={isDeletingId === item.user.id}
                            onClick={() => handleDeletePermanen(item.user!.id, item.user!.nama_lengkap)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Akun Permanen"
                          >
                            {isDeletingId === item.user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingGuru ? "Edit Data Guru" : "Tambah Data Guru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingGuru ? "Perbarui informasi dan kredensial pendidik" : "Daftarkan akun pendidik baru"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingGuru(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGuru} className="space-y-3">
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
                    disabled={!!editingGuru}
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    placeholder="guru_parhan"
                    className={`w-full px-3 py-2 text-xs rounded-xl border ${
                      editingGuru
                        ? "border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {editingGuru ? "Kata Sandi Baru (Opsional)" : "Kata Sandi Default"}
                  </label>
                  <input
                    type="text"
                    required={!editingGuru}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder={editingGuru ? "Kosongkan jika tidak diubah" : "password123"}
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={18}
                    value={formNIP}
                    onChange={(e) => setFormNIP(e.target.value.replace(/\D/g, ""))}
                    placeholder="198809202014021003"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nomor Telepon</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={15}
                    value={formTelp}
                    onChange={(e) => setFormTelp(e.target.value.replace(/\D/g, ""))}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingGuru(null);
                  }}
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
                    <span>{editingGuru ? "Simpan Perubahan" : "Daftarkan Guru"}</span>
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
    </div>
  );
}
