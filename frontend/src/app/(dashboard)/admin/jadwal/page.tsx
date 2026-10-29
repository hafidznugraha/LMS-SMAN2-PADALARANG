"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  ChevronDown,
  Trash2,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertConflict } from "@/components/ui/alert-conflict";
import { fetchAPI, ApiClientError } from "@/lib/api";
import { Kelas, MataPelajaran, Guru, JadwalPelajaran } from "@/types";
import { getMapelBadgeClass } from "@/lib/utils";

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

interface ConflictState {
  guru: string;
  mapelKelas: string;
  waktu: string;
}

export default function KelolaJadwalPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isJadwalLoading, setIsJadwalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const [formKelasId, setFormKelasId] = useState("");
  const [formMapelId, setFormMapelId] = useState("");
  const [formGuruId, setFormGuruId] = useState("");
  const [formHari, setFormHari] = useState("Senin");
  const [formJamMulai, setFormJamMulai] = useState("07:00");
  const [formJamSelesai, setFormJamSelesai] = useState("09:00");
  const [formRuang, setFormRuang] = useState("Kelas Reguler");

  const loadJadwal = useCallback(async (kelasId: string) => {
    setIsJadwalLoading(true);
    try {
      const res = await fetchAPI<{ data: JadwalPelajaran[] }>(`/jadwal?kelas_id=${kelasId}`);
      setJadwalList(res.data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsJadwalLoading(false);
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resKelas, resMapel, resGuru] = await Promise.all([
        fetchAPI<{ data: Kelas[] }>("/master/kelas"),
        fetchAPI<{ data: MataPelajaran[] }>("/master/mapel"),
        fetchAPI<{ data: Guru[] }>("/master/guru"),
      ]);

      const classes = resKelas.data || [];
      setKelasList(classes);
      setMapelList(resMapel.data || []);
      setGuruList(resGuru.data || []);

      if (classes.length > 0) {
        setSelectedKelas(classes[0]);
        setFormKelasId(classes[0].id);
        await loadJadwal(classes[0].id);
      }
      if (resMapel.data && resMapel.data.length > 0) {
        setFormMapelId(resMapel.data[0].id);
      }
      if (resGuru.data && resGuru.data.length > 0) {
        setFormGuruId(resGuru.data[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [loadJadwal]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleSelectKelas = (k: Kelas) => {
    setSelectedKelas(k);
    setFormKelasId(k.id);
    setIsClassDropdownOpen(false);
    loadJadwal(k.id);
  };

  const handleOpenModal = () => {
    if (selectedKelas) {
      setFormKelasId(selectedKelas.id);
    }
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCreateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await fetchAPI("/jadwal", {
        method: "POST",
        body: JSON.stringify({
          kelas_id: formKelasId,
          mapel_id: formMapelId,
          guru_id: formGuruId,
          hari: formHari,
          jam_mulai: formJamMulai,
          jam_selesai: formJamSelesai,
          ruang: formRuang,
        }),
      });

      setConflict(null);
      setSuccessMsg("Jadwal pelajaran berhasil ditambahkan!");
      setIsModalOpen(false);
      if (selectedKelas) {
        await loadJadwal(selectedKelas.id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 409) {
        const cData = err.data;
        if (cData) {
          setConflict({
            guru: cData.guru || "Guru Pengampu",
            mapelKelas: `${cData.mapel || "Pelajaran"} - ${cData.kelas || "Kelas Lain"}`,
            waktu: `${cData.hari || formHari}, ${cData.waktu || `${formJamMulai} - ${formJamSelesai}`} WIB`,
          });
        } else {
          setConflict({
            guru: "Guru / Ruangan",
            mapelKelas: err.message,
            waktu: `${formHari}, ${formJamMulai} - ${formJamSelesai} WIB`,
          });
        }
        setIsModalOpen(false);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJadwal = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) return;
    setIsDeletingId(id);
    try {
      await fetchAPI(`/jadwal/${id}`, { method: "DELETE" });
      setSuccessMsg("Jadwal pelajaran berhasil dihapus");
      if (selectedKelas) {
        await loadJadwal(selectedKelas.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsDeletingId(null);
    }
  };

  const schedulesByDay = HARI_LIST.reduce<Record<string, JadwalPelajaran[]>>((acc, day) => {
    acc[day] = jadwalList.filter((j) => j.hari.toLowerCase() === day.toLowerCase());
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            Kelola Jadwal Pelajaran
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Atur plotting mata pelajaran, guru pengampu, dan ruang kelas bebas bentrok
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleOpenModal}>
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal</span>
        </Button>
      </div>

      {conflict && (
        <AlertConflict
          guru={conflict.guru}
          mapelKelas={conflict.mapelKelas}
          waktu={conflict.waktu}
          onClose={() => setConflict(null)}
          onFix={handleOpenModal}
        />
      )}

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

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Jadwal Pembelajaran Kelas: {selectedKelas ? selectedKelas.nama_kelas : "-"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tingkat {selectedKelas?.tingkat || 12} • Jurusan {selectedKelas?.jurusan || "MIPA"}
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="inline-flex items-center justify-between gap-2 min-w-[160px] bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <span>{selectedKelas ? selectedKelas.nama_kelas : "Pilih Kelas"}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 max-h-60 overflow-y-auto">
                {kelasList.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleSelectKelas(k)}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                      selectedKelas?.id === k.id
                        ? "bg-blue-50 text-blue-900 font-bold"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{k.nama_kelas}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{k.jurusan}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading || isJadwalLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-xs font-medium">Memuat data jadwal pelajaran...</p>
          </div>
        ) : jadwalList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Jadwal</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Belum ada plotting jadwal mata pelajaran untuk kelas {selectedKelas?.nama_kelas}. Klik
              tombol Tambah Jadwal untuk mengatur jadwal baru.
            </p>
            <Button variant="primary" size="sm" onClick={handleOpenModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Tambah Jadwal Sekarang</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HARI_LIST.map((day) => {
              const daySchedules = schedulesByDay[day] || [];
              return (
                <div
                  key={day}
                  className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{day}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {daySchedules.length} Sesi
                    </span>
                  </div>

                  {daySchedules.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 italic">
                      Tidak ada jam KBM
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {daySchedules.map((item) => {
                        const mapelName = item.mapel?.nama_mapel || "Mata Pelajaran";
                        const guruName =
                          item.guru?.user?.nama_lengkap || item.guru?.gelar
                            ? `${item.guru?.user?.nama_lengkap || "Guru"}, ${item.guru?.gelar || ""}`
                            : "Guru Pengampu";
                        const badgeStyle = getMapelBadgeClass(mapelName);

                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs space-y-2 transition-all hover:border-slate-300"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold ${badgeStyle}`}
                              >
                                {mapelName}
                              </span>
                              <button
                                type="button"
                                disabled={isDeletingId === item.id}
                                onClick={() => handleDeleteJadwal(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                                title="Hapus Jadwal"
                              >
                                {isDeletingId === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            <div className="text-xs text-slate-700 font-medium">{guruName}</div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {item.jam_mulai} - {item.jam_selesai}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[110px]">{item.ruang}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Jadwal Pelajaran</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sistem otomatis mendeteksi bentrok jam guru dan kelas
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJadwal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kelas</label>
                  <select
                    value={formKelasId}
                    onChange={(e) => setFormKelasId(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas} ({k.jurusan})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Hari</label>
                  <select
                    value={formHari}
                    onChange={(e) => setFormHari(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                  >
                    {HARI_LIST.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mata Pelajaran</label>
                <select
                  value={formMapelId}
                  onChange={(e) => setFormMapelId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {mapelList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nama_mapel} ({m.kode_mapel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Guru Pengampu</label>
                <select
                  value={formGuruId}
                  onChange={(e) => setFormGuruId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900 bg-white"
                >
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.user?.nama_lengkap || "Guru"} ({g.nip})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    value={formJamMulai}
                    onChange={(e) => setFormJamMulai(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    value={formJamSelesai}
                    onChange={(e) => setFormJamSelesai(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ruangan</label>
                <input
                  type="text"
                  value={formRuang}
                  onChange={(e) => setFormRuang(e.target.value)}
                  placeholder="Contoh: Ruang R.XII-1 / Lab Fisika"
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Simpan Jadwal</span>
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
