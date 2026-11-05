"use client";

import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft 
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredUser, AuthUser } from "@/lib/auth";

interface LaporanAkademik {
  id_laporan: string;
  siswa_id: string;
  nama: string;
  nis: string;
  nisn: string;
  rombel: string;
  kelas_id: string;
  nilai_pengetahuan: number | null;
  nilai_keterampilan: number | null;
  rata_rata: number | null;
  catatan_wali: string;
  status_laporan: string;
}

export default function RaportLegerPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [laporanList, setLaporanList] = useState<LaporanAkademik[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const kelas = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelas = kelas?.nama_kelas || "X IPS 2";

  const fetchLaporanData = async (kelasId: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("lms_access_token");
      
      const res = await fetch(`http://localhost:8088/api/v1/laporan/kelas/${kelasId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
const json = await res.json();

if (res.ok && json.success && Array.isArray(json.data)) {
  setLaporanList(json.data);
  setMessage(null);
} else {
  setLaporanList([]);
  setMessage({
    type: "error",
    text: json.message || "Gagal memuat laporan akademik",
  });
}
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan koneksi ke server backend" });
    } finally {
      setLoading(false);
    }
  };

  const kelasIdBinaan = kelas?.id;

useEffect(() => {
  if (!currentUser) return;

  if (!kelasIdBinaan) {
    setLaporanList([]);
    setLoading(false);
    setMessage({
      type: "error",
      text: "Data kelas binaan belum tersedia. Periksa akun wali kelas.",
    });
    return;
  }

  fetchLaporanData(kelasIdBinaan);
}, [currentUser, kelasIdBinaan]);

  const handleUpdateCatatan = async (idLaporan: string, catatanBaru: string) => {
    try {
      setSavingId(idLaporan);
      setMessage(null);
      const token = localStorage.getItem("lms_access_token");

      const res = await fetch(`http://localhost:8088/api/v1/laporan/${idLaporan}/catatan-wali`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ catatan_wali: catatanBaru }),
      });

      const json = await res.json();
      if (json.success) {
        setMessage({ type: "success", text: "Catatan perkembangan karakter berhasil disimpan!" });
      } else {
        setMessage({ type: "error", text: json.message || "Gagal menyimpan catatan" });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: "Terjadi kesalahan saat menyimpan data" });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            Raport & Draf Buku Leger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola nilai akhir semester dan catatan pembinaan rapor siswa kelas {namaKelas}.
          </p>
        </div>
        <Link href="/wali-kelas">
          <Button variant="secondary" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ringkasan</span>
          </Button>
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center gap-2 ${
          message.type === "success" ? "bg-emerald-50 text-emerald-900 border border-emerald-200" : "bg-rose-50 text-rose-900 border border-rose-200"
        }`}>
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Tabel Draf Leger Kelas {namaKelas}</h2>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
            Total Siswa: {laporanList.length} Orang
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-medium">Memuat data dari server Go Fiber...</p>
          </div>
        ) : laporanList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <AlertCircle className="w-10 h-10 text-slate-300" />
            <p className="text-xs font-medium">Belum ada data laporan akademik untuk kelas ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="p-4">No</th>
                  <th className="p-4">Nama Siswa / NIS</th>
                  <th className="p-4 text-center">Pengetahuan</th>
                  <th className="p-4 text-center">Keterampilan</th>
                  <th className="p-4 text-center">Rata-Rata</th>
                  <th className="p-4 text-center">Status Raport</th>
                  <th className="p-4">Catatan Wali Kelas</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {laporanList.map((item, index) => (
                  <tr key={item.id_laporan} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-semibold text-slate-500">{index + 1}</td>
                        <td className="p-4">
                            <div className="font-bold text-slate-900">
                                 {item.nama || "Nama belum tersedia"}
                            </div>

                            <div className="text-[11px] text-slate-500">
                                NIS: {item.nis || "-"}
                            </div>
                            </td>

                            <td className="p-4 text-center font-semibold text-slate-700">
                             {item.nilai_pengetahuan ?? "-"}
                            </td>

                            <td className="p-4 text-center font-semibold text-slate-700">
                             {item.nilai_keterampilan ?? "-"}
                            </td>

                            <td className="p-4 text-center">
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                {item.rata_rata ?? "-"}
                            </span>
                            </td>

                <td className="p-4 text-center">
                    <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status_laporan === "DisahkanKurikulum"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.status_laporan === "DitinjauWali"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                    >
                        {item.status_laporan === "DisahkanKurikulum"
                        ? "Disahkan Kurikulum"
                        : item.status_laporan === "DitinjauWali"
                        ? "Ditinjau Wali Kelas"
                        : "Draf"}
                    </span>
                    </td>

                                                <td className="p-4">
                      <textarea
                        defaultValue={item.catatan_wali || ""}
                        placeholder="Tulis catatan perkembangan karakter..."
                        className="w-full min-h-[60px] p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-slate-50/50"
                        id={`catatan-${item.id_laporan}`}
                      />
                    </td>
                   

                    <td className="p-4 text-center">
                      <Button
                        size="sm"
                        variant="primary"
                        className="gap-1 text-[11px] bg-emerald-700 hover:bg-emerald-800 text-white"
                        disabled={savingId === item.id_laporan || item.status_laporan === "DisahkanKurikulum"}
                        onClick={() => {
                          const textarea = document.getElementById(`catatan-${item.id_laporan}`) as HTMLTextAreaElement;
                          if (textarea) {
                            handleUpdateCatatan(item.id_laporan, textarea.value);
                          }
                        }}
                      >
                        {savingId === item.id_laporan ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                        <span>Simpan</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}