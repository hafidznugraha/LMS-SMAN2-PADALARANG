"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useMeSiswa } from "@/hooks/useMe";
import { useUbahPassword } from "@/hooks/useSiswaNilai";
import { cn, inisial } from "@/lib/utils";

function cekPasswordBaru(lama: string, baru: string, konfirmasi: string): string {
  if (!lama) return "Password lama wajib diisi";
  if (baru.length < 8) return "Password baru minimal 8 karakter";
  if (baru.length > 72) return "Password baru maksimal 72 karakter";
  if (baru.trim() !== baru) return "Password baru tidak boleh diawali atau diakhiri spasi";
  if (!/\p{L}/u.test(baru) || !/\p{N}/u.test(baru)) return "Password baru harus mengandung huruf dan angka";
  if (baru === lama) return "Password baru tidak boleh sama dengan password lama";
  if (baru !== konfirmasi) return "Konfirmasi password tidak cocok";
  return "";
}

function Baris({ label, nilai }: { label: string; nilai?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-4 py-2.5">
      <dt className="text-xs font-medium text-slate-500 sm:w-32 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-slate-900 break-words">{nilai || "-"}</dd>
    </div>
  );
}

function KolomPassword({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [lihat, setLihat] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={lihat ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-slate-100/80 border border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl pl-4 pr-11 py-3 text-sm text-slate-900 outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-700"
        >
          {lihat ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function SiswaProfilPage() {
  const { data: siswa, isLoading, isError, refetch } = useMeSiswa();
  const ubah = useUbahPassword();

  const [lama, setLama] = useState("");
  const [baru, setBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");
  const [error, setError] = useState("");

  function simpan(e: React.FormEvent) {
    e.preventDefault();
    const msg = cekPasswordBaru(lama, baru, konfirmasi);
    setError(msg);
    if (msg) return;

    ubah.mutate(
      { password_lama: lama, password_baru: baru },
      {
        onSuccess: () => {
          toast.success("Password berhasil diubah");
          setLama("");
          setBaru("");
          setKonfirmasi("");
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Gagal mengubah password"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="h-40 rounded-2xl bg-slate-200 animate-pulse" />
        <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
      </div>
    );
  }

  if (isError || !siswa) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 text-center">
        <p className="text-sm text-slate-700">Gagal memuat profil.</p>
        <Button className="mt-3" size="sm" variant="secondary" onClick={() => refetch()}>
          Coba lagi
        </Button>
      </div>
    );
  }

  const nama = siswa.user?.nama_lengkap ?? "";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Profil</h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">Data diri dan keamanan akun</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#1E3A8A] text-white text-xl font-bold flex items-center justify-center shrink-0">
            {inisial(nama)}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 truncate">{nama}</h3>
            <p className="text-sm text-slate-500">Siswa • {siswa.kelas?.nama_kelas ?? "Belum ada kelas"}</p>
          </div>
        </div>
        <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
          <Baris label="NISN" nilai={siswa.nisn} />
          <Baris label="NIS" nilai={siswa.nis} />
          <Baris label="Kelas" nilai={siswa.kelas?.nama_kelas} />
          <Baris label="Jenis kelamin" nilai={siswa.jenis_kelamin} />
          <Baris label="Email" nilai={siswa.user?.email} />
          <Baris label="No. telepon" nilai={siswa.no_telepon} />
          <Baris label="Alamat" nilai={siswa.alamat} />
        </dl>
        <p className="text-xs text-slate-400 mt-3">
          Untuk mengubah data diri, hubungi Kurikulum atau wali kelas.
        </p>
      </div>

      <form onSubmit={simpan} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Ubah Password</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Minimal 8 karakter, mengandung huruf dan angka.
          </p>
        </div>

        <KolomPassword id="pw-lama" label="Password lama" value={lama} onChange={setLama} autoComplete="current-password" />
        <KolomPassword id="pw-baru" label="Password baru" value={baru} onChange={setBaru} autoComplete="new-password" />
        <KolomPassword id="pw-konfirmasi" label="Konfirmasi password baru" value={konfirmasi} onChange={setKonfirmasi} autoComplete="new-password" />

        {error && (
          <p role="alert" className={cn("text-xs font-medium text-red-600")}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={ubah.isPending} className="w-full sm:w-auto">
          {ubah.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Simpan Password
        </Button>
      </form>
    </div>
  );
}