'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  ClipboardCheck,
  ClipboardList,
  Upload,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { getStoredUser, AuthUser } from '@/lib/auth';

import { MateriModule } from '@/components/materi/MateriModule';
import { TugasModule } from '@/components/tugas/TugasModule';
import { NilaiModule } from '@/components/nilai/NilaiModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { BranchCollabInfoModal } from '@/components/modals/BranchCollabInfoModal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { downloadMateriFile } from '@/lib/pdfHelper';

import {
  getKelasGuru,
  getMateriGuru,
  deleteMateriGuru,
  getTugasGuru,
  getTugasSubmissions,
  gradeSubmissionGuru,
  getNilaiGuru,
  updateNilaiGuru,
  getJadwalGuru,
} from '@/services/guruService';

import {
  Materi,
  TugasKuis,
  PengumpulanTugas,
  NilaiSiswa,
  Kelas,
  JadwalPelajaran,
} from '@/types/lms';

export default function GuruDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'materi' | 'tugas' | 'nilai'>('dashboard');

  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [materiList, setMateriList] = useState<Materi[]>([]);
  const [tugasList, setTugasList] = useState<TugasKuis[]>([]);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>([]);
  const [jadwalList, setJadwalList] = useState<JadwalPelajaran[]>([]);

  // Modals & State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<Materi | null>(null);
  const [deletingTarget, setDeletingTarget] = useState<{ id: string; judul: string } | null>(null);
  const [isDeletingMateri, setIsDeletingMateri] = useState(false);
  const [isCreateTugasOpen, setIsCreateTugasOpen] = useState(false);
  const [isBranchInfoOpen, setIsBranchInfoOpen] = useState(false);
  const [selectedTugasId, setSelectedTugasId] = useState<string | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const teacherName = currentUser?.nama_lengkap || 'Pendidik';
  const currentBidangStudi =
    currentUser?.extra?.mapel?.nama_mapel ||
    (currentUser?.extra?.mapel_nama as string) ||
    (currentUser?.extra?.bidang_studi as string) ||
    'Mata Pelajaran';

  const isWali = Boolean(
    currentUser?.extra?.is_wali_kelas ||
      (currentUser?.extra?.kelas_binaan && currentUser.extra.kelas_binaan.length > 0) ||
      currentUser?.role === 'wali_kelas'
  );
  const kelasBinaan = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelasBinaan = kelasBinaan?.nama_kelas || '';

  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = getStoredUser();
      if (user) {
        setCurrentUser(user);
      }

      const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
      const mapelId = (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '';

      const [kelasData, materiData, allTugas, jadwalData] = await Promise.all([
        getKelasGuru(guruId),
        getMateriGuru(undefined, guruId),
        getTugasGuru({ guru_id: guruId }),
        getJadwalGuru({ guru_id: guruId }),
      ]);

      setKelasList(kelasData);
      setMateriList(materiData);
      setTugasList(allTugas);
      setJadwalList(jadwalData);

      const targetKelas = kelasData[0]?.id_kelas || '';
      setSelectedKelasId(targetKelas);

      if (targetKelas) {
        const nilData = await getNilaiGuru(targetKelas, mapelId, guruId);
        setNilaiList(nilData);
      }
    } catch (err) {
      console.warn(err);
      toast.error('Gagal memuat data dashboard guru');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleKelasChangeForNilai = async (kId: string) => {
    setSelectedKelasId(kId);
    try {
      const user = getStoredUser();
      const mapelId = (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '';
      const guruId = (user?.extra?.guru_id as string) || (user?.id as string) || '';
      const data = await getNilaiGuru(kId, mapelId, guruId);
      setNilaiList(data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Handler Simpan / Edit Materi
  const handleSaveMateri = async (saved: Materi) => {
    if (editingMateri) {
      setMateriList((prev) =>
        prev.map((m) =>
          m.id_materi === editingMateri.id_materi || m.id_materi === saved.id_materi
            ? saved
            : m
        )
      );
      setEditingMateri(null);
    } else {
      setMateriList((prev) => [saved, ...prev.filter((m) => m.id_materi !== saved.id_materi)]);
    }
    const currentGuruId = (currentUser?.extra?.guru_id as string) || (currentUser?.id as string) || '';
    const refreshed = await getMateriGuru(undefined, currentGuruId);
    if (refreshed.length > 0) {
      setMateriList(refreshed);
    }
    setActiveView('materi');
  };

  const handleDownloadMateri = async (materi: Materi) => {
    setMateriList((prev) =>
      prev.map((m) =>
        m.id_materi === materi.id_materi
          ? { ...m, unduhan_count: (m.unduhan_count || 0) + 1 }
          : m
      )
    );
    await downloadMateriFile(materi);
  };

  const handleConfirmDeleteMateri = async () => {
    if (!deletingTarget) return;
    try {
      setIsDeletingMateri(true);
      const res = await deleteMateriGuru(deletingTarget.id);
      if (res?.success) {
        toast.success(`Materi "${deletingTarget.judul}" berhasil dihapus`);
      } else {
        toast.success(`Materi "${deletingTarget.judul}" berhasil dihapus`);
      }
    } catch {
      toast.error('Gagal menghapus materi dari server');
    } finally {
      setMateriList((prev) => prev.filter((m) => m.id_materi !== deletingTarget.id));
      setDeletingTarget(null);
      setIsDeletingMateri(false);
    }
  };

  // Handler Simpan Tugas
  const handleSaveTugas = (newT: TugasKuis) => {
    setTugasList((prev) => [newT, ...prev.filter((t) => t.id_tugas_kuis !== newT.id_tugas_kuis)]);
    setActiveView('tugas');
  };

  // Handler Buka Penilaian Siswa
  const handleOpenGrading = async (tugas: TugasKuis) => {
    const tugasId = tugas.id_tugas_kuis || (tugas as unknown as { id?: string }).id;
    if (!tugasId) return;

    try {
      const subs = await getTugasSubmissions(tugasId);
      setSubmissionsList(subs);
    } catch (err) {
      console.error(err);
    }
  };

  // Handler Simpan Nilai Tugas Siswa
  const handleSaveNilaiSubmission = async (
    idSub: string,
    nilai: number,
    feedback: string,
    submission?: PengumpulanTugas
  ) => {
    try {
      setSubmissionsList((prev) =>
        prev.map((s) => {
          const sId = s.id_pengumpulan || (s as unknown as { id?: string }).id;
          if (sId === idSub) {
            return {
              ...s,
              nilai,
              feedback,
              status_kumpul: s.status_kumpul === 'Belum Mengumpulkan' ? 'Tepat Waktu' : s.status_kumpul,
            };
          }
          return s;
        })
      );

      await gradeSubmissionGuru(idSub, {
        nilai,
        feedback_guru: feedback,
        tugas_id: submission?.id_tugas_kuis || (submission as unknown as { tugas_id?: string })?.tugas_id,
        siswa_id: submission?.id_siswa || (submission as unknown as { siswa_id?: string })?.siswa_id,
      });

      const currentGuruId = (currentUser?.extra?.guru_id as string) || (currentUser?.id as string) || '';
      const refreshed = await getTugasGuru({ guru_id: currentGuruId });
      if (refreshed.length > 0) {
        setTugasList(refreshed);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Handler Update Nilai
  const handleUpdateNilai = async (updated: NilaiSiswa) => {
    setNilaiList((prev) =>
      prev.map((n) => (n.id_nilai === updated.id_nilai || n.id_siswa === updated.id_siswa ? updated : n))
    );

    try {
      const user = getStoredUser();
      const res = await updateNilaiGuru({
        siswa_id: updated.id_siswa,
        guru_id: (user?.extra?.guru_id as string) || (user?.id as string) || '',
        mapel_id: (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '',
        nilai_tugas: updated.nilai_tugas,
        nilai_uh: updated.nilai_uh,
        nilai_uts: updated.nilai_uts,
        nilai_uas: updated.nilai_uas,
        feedback: updated.feedback,
      });

      if (res?.success) {
        toast.success(`Nilai ${updated.nama_siswa} berhasil disimpan`);
      }
    } catch (err) {
      console.warn(err);
      toast.error('Gagal menyimpan nilai ke server');
    }
  };

  const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;
  const todayHari = hariList[new Date().getDay()];
  const jadwalHariIni = jadwalList.filter((j) => j.hari === todayHari || !j.hari);
  const displayJadwal = jadwalHariIni.length > 0 ? jadwalHariIni : jadwalList.slice(0, 3);

  const pendingEvaluationCount = tugasList.reduce(
    (acc, curr) => acc + (Math.max(0, (curr.jumlah_mengumpulkan || 0) - (curr.jumlah_dinilai || 0))),
    0
  );
  const tugasPerluDinilai = tugasList.filter((t) => (t.jumlah_mengumpulkan || 0) > (t.jumlah_dinilai || 0));

  if (isLoading && kelasList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <div className="w-8 h-8 border-4 border-[#142d72] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Memuat Dashboard Guru...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tombol Kembali jika sedang membuka sub-halaman Materi / Tugas / Absensi */}
      {activeView !== 'dashboard' && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-2 text-xs font-bold text-blue-900 hover:text-blue-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Ringkasan Dashboard Guru</span>
          </button>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Modul Aktif: {activeView}
          </span>
        </div>
      )}

      {/* 1. TAMPILAN DASHBOARD UTAMA */}
      {activeView === 'dashboard' && (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Selamat Datang, {teacherName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
                  Guru Pengampu
                </span>
                {isWali && namaKelasBinaan && (
                  <>
                    <span>•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300/60">
                      Wali Kelas {namaKelasBinaan}
                    </span>
                  </>
                )}
                {currentUser?.extra?.nip && (
                  <>
                    <span>•</span>
                    <span>NIP: {currentUser.extra.nip}</span>
                  </>
                )}
                <span>•</span>
                <span className="font-medium text-slate-800">
                  Mata Pelajaran: {currentBidangStudi}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 cursor-pointer"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="w-4 h-4" />
                <span>Upload Materi</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 cursor-pointer bg-[#142d72] text-white hover:bg-blue-900"
                onClick={() => setIsCreateTugasOpen(true)}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Buat Tugas Baru</span>
              </Button>
            </div>
          </div>

          {isWali && namaKelasBinaan && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30">
                    Tugas Tambahan Aktif
                  </span>
                </div>
                <h2 className="text-base font-bold text-white">
                  Wali Kelas: Rombel {namaKelasBinaan}
                </h2>
                <p className="text-xs text-emerald-100/80">
                  Pantau rekap absensi harian dan kelola catatan rapor buku leger kelas binaan Anda.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <Link href="/wali-kelas">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-white text-emerald-950 hover:bg-emerald-50 border-0 text-xs font-semibold gap-1.5"
                  >
                    <span>Kelola Kelas Binaan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div onClick={() => setActiveView('materi')} className="cursor-pointer">
              <MetricCard
                title="Total Rombel"
                value={`${kelasList.length}`}
                subtitle="Rombongan Belajar Aktif"
                icon={Users}
                variant="primary"
              />
            </div>
            <div onClick={() => setActiveView('tugas')} className="cursor-pointer">
              <MetricCard
                title="Tugas Perlu Dinilai"
                value={`${pendingEvaluationCount}`}
                subtitle="Berkas tugas menunggu respon"
                icon={ClipboardCheck}
                variant="white"
              />
            </div>
            <div onClick={() => setActiveView('tugas')} className="cursor-pointer">
              <MetricCard
                title="Total Penugasan"
                value={`${tugasList.length}`}
                subtitle="Penugasan terbit aktif"
                icon={ClipboardList}
                variant="cyan"
              />
            </div>
            <div onClick={() => setActiveView('materi')} className="cursor-pointer">
              <MetricCard
                title="Materi Pembelajaran"
                value={`${materiList.length}`}
                subtitle="Berkas ajar tersimpan"
                icon={BookOpen}
                variant="success"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-900" />
                  Jadwal Mengajar ({todayHari})
                </h2>
              </div>

              <div className="space-y-3">
                {displayJadwal.length > 0 ? (
                  displayJadwal.map((j) => (
                    <div
                      key={j.id_jadwal}
                      className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                            {j.nama_kelas}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{j.hari}</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{j.nama_mapel}</h3>
                        <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-700" />
                            {j.jam_mulai} - {j.jam_selesai} WIB
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            Ruang {j.ruangan}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center">
                        {isWali && j.nama_kelas === namaKelasBinaan ? (
                          <Link href="/wali-kelas/kehadiran">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="text-xs cursor-pointer border-emerald-300 text-emerald-800 hover:bg-emerald-50 font-semibold"
                            >
                              Kehadiran Rombel
                            </Button>
                          </Link>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs cursor-pointer border-slate-300 text-slate-700 hover:bg-slate-50"
                            onClick={() => {
                              setSelectedKelasId(j.id_kelas);
                              setActiveView('materi');
                            }}
                          >
                            Bahan Ajar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                    Tidak ada jadwal mengajar pada sesi hari ini.
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  Tugas Perlu Dinilai
                </h2>
                {pendingEvaluationCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
                    {pendingEvaluationCount} Menunggu
                  </span>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
                {tugasPerluDinilai.length > 0 ? (
                  tugasPerluDinilai.slice(0, 3).map((t) => (
                    <div
                      key={t.id_tugas_kuis}
                      className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{t.judul}</h4>
                          <p className="text-[11px] text-slate-500">Kelas {t.nama_kelas}</p>
                        </div>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                          {t.jumlah_mengumpulkan}/{t.total_siswa} Mengumpulkan
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-slate-400">
                          Tenggat: {t.tenggat_waktu ? t.tenggat_waktu.slice(0, 16) : '-'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTugasId(t.id_tugas_kuis);
                            handleOpenGrading(t);
                            setActiveView('tugas');
                          }}
                          className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                        >
                          Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-3 text-center">
                    Semua penugasan siswa telah dinilai.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-xs flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-blue-200">
                    <BookOpen className="w-4 h-4 text-sky-300" />
                    <span>Distribusi Bahan Ajar</span>
                  </div>
                  <p className="text-xs font-bold text-white">Kelola Berkas Materi Pelajaran</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveView('materi')}
                  className="text-xs bg-white text-blue-950 hover:bg-blue-50 border-0 cursor-pointer"
                >
                  Lihat Materi
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeView === 'materi' && (
        <MateriModule
          materiList={materiList}
          kelasList={kelasList}
          onUploadMateri={() => {
            setEditingMateri(null);
            setIsUploadOpen(true);
          }}
          onEditMateri={(m) => {
            setEditingMateri(m);
            setIsUploadOpen(true);
          }}
          onDeleteMateri={(id, judul) => {
            const found = materiList.find((m) => m.id_materi === id);
            setDeletingTarget({ id, judul: judul || found?.judul_materi || 'Materi ini' });
          }}
          onDownloadMateri={handleDownloadMateri}
        />
      )}

      {activeView === 'tugas' && (
        <TugasModule
          tugasList={tugasList}
          submissionsList={submissionsList}
          kelasList={kelasList}
          activeTugasId={selectedTugasId}
          onClearActiveTugas={() => setSelectedTugasId(null)}
          onOpenCreateTugas={() => setIsCreateTugasOpen(true)}
          onOpenGrading={handleOpenGrading}
          onSaveNilaiSubmission={handleSaveNilaiSubmission}
        />
      )}


      {activeView === 'nilai' && (
        <NilaiModule
          nilaiList={nilaiList}
          kelasList={kelasList}
          namaMapel={currentBidangStudi}
          onKelasChange={handleKelasChangeForNilai}
          onUpdateNilai={handleUpdateNilai}
        />
      )}

      <UploadMateriModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setEditingMateri(null);
        }}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        initialData={editingMateri}
        onSaveMateri={handleSaveMateri}
      />

      <ConfirmModal
        isOpen={Boolean(deletingTarget)}
        onClose={() => setDeletingTarget(null)}
        onConfirm={handleConfirmDeleteMateri}
        title="Hapus Materi Pembelajaran"
        message={`Apakah Anda yakin ingin menghapus materi "${deletingTarget?.judul || ''}" secara permanen?`}
        confirmText="Ya, Hapus Materi"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeletingMateri}
      />

      <CreateTugasModal
        isOpen={isCreateTugasOpen}
        onClose={() => setIsCreateTugasOpen(false)}
        kelasList={kelasList}
        currentBidangStudi={currentBidangStudi}
        onSaveTugas={handleSaveTugas}
      />

      <BranchCollabInfoModal
        isOpen={isBranchInfoOpen}
        onClose={() => setIsBranchInfoOpen(false)}
      />
    </div>
  );
}
