'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  ClipboardCheck,
  HelpCircle,
  UserCheck,
  Upload,
  PlusCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import { MetricCard } from '@/components/ui/metric-card';
import { Button } from '@/components/ui/button';
import { getStoredUser, AuthUser } from '@/lib/auth';

// Komponen-komponen modul guru
import { MateriModule } from '@/components/materi/MateriModule';
import { TugasModule } from '@/components/tugas/TugasModule';
import { AbsensiModule } from '@/components/absensi/AbsensiModule';
import { NilaiModule } from '@/components/nilai/NilaiModule';
import { UploadMateriModal } from '@/components/modals/UploadMateriModal';
import { CreateTugasModal } from '@/components/modals/CreateTugasModal';
import { BranchCollabInfoModal } from '@/components/modals/BranchCollabInfoModal';

import {
  KELAS_LIST,
  INITIAL_MATERI_LIST,
  INITIAL_TUGAS_LIST,
  INITIAL_SUBMISSIONS,
  INITIAL_ABSENSI_TODAY,
  INITIAL_NILAI_LIST,
} from '@/data/mockData';
import { Materi, TugasKuis, PengumpulanTugas, Absensi, StatusKehadiran, NilaiSiswa } from '@/types/lms';

export default function GuruDashboardPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Tab View Aktif: 'dashboard' | 'materi' | 'tugas' | 'absensi' | 'nilai'
  const [activeView, setActiveView] = useState<'dashboard' | 'materi' | 'tugas' | 'absensi' | 'nilai'>('dashboard');

  // State Data
  const [materiList, setMateriList] = useState<Materi[]>(INITIAL_MATERI_LIST);
  const [tugasList, setTugasList] = useState<TugasKuis[]>(INITIAL_TUGAS_LIST);
  const [submissionsList, setSubmissionsList] = useState<PengumpulanTugas[]>(INITIAL_SUBMISSIONS);
  const [absensiList, setAbsensiList] = useState<Absensi[]>(INITIAL_ABSENSI_TODAY);
  const [nilaiList, setNilaiList] = useState<NilaiSiswa[]>(INITIAL_NILAI_LIST);

  // Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateTugasOpen, setIsCreateTugasOpen] = useState(false);
  const [isBranchInfoOpen, setIsBranchInfoOpen] = useState(false);
  const [selectedTugasId, setSelectedTugasId] = useState<string | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string>('f0000000-0000-0000-0000-000000000001');

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const teacherName = currentUser?.nama_lengkap || 'Irma Satikarama, S.Pd.';
  const isWali = Boolean(
    currentUser?.extra?.is_wali_kelas ||
      (currentUser?.extra?.kelas_binaan && currentUser.extra.kelas_binaan.length > 0) ||
      currentUser?.role === 'wali_kelas'
  );
  const kelasBinaan = currentUser?.extra?.kelas_binaan?.[0];
  const namaKelasBinaan = kelasBinaan?.nama_kelas || 'XII IPA 1';

  // Handler Simpan Materi
  const handleSaveMateri = (newM: Omit<Materi, 'id_materi' | 'tanggal_unggah' | 'unduhan_count'>) => {
    const created: Materi = {
      ...newM,
      id_materi: `mat-${Date.now()}`,
      tanggal_unggah: '2026-11-04 10:00',
      unduhan_count: 0,
    };
    setMateriList([created, ...materiList]);
    setActiveView('materi');
  };

  // Handler Simpan Tugas
  const handleSaveTugas = (newT: Omit<TugasKuis, 'id_tugas_kuis' | 'total_siswa' | 'jumlah_mengumpulkan' | 'jumlah_dinilai'>) => {
    const created: TugasKuis = {
      ...newT,
      id_tugas_kuis: `tugas-${Date.now()}`,
      total_siswa: 32,
      jumlah_mengumpulkan: 0,
      jumlah_dinilai: 0,
    };
    setTugasList([created, ...tugasList]);
    setActiveView('tugas');
  };

  // Handler Simpan Nilai Tugas Siswa
  const handleSaveNilaiSubmission = (idSub: string, nilai: number, feedback: string) => {
    setSubmissionsList(
      submissionsList.map((s) => (s.id_pengumpulan === idSub ? { ...s, nilai, feedback } : s))
    );
  };

  // Handler Update Kehadiran
  const handleUpdateStatus = (idAbsen: string, status: StatusKehadiran) => {
    setAbsensiList(
      absensiList.map((a) => (a.id_absensi === idAbsen ? { ...a, status_kehadiran: status } : a))
    );
  };

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
                Selamat Datang, {teacherName} 👏
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-600">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-900 font-semibold">
                  Guru Pengampu
                </span>
                {isWali && (
                  <>
                    <span>•</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300/60">
                      Wali Kelas {namaKelasBinaan}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>NIP: {currentUser?.extra?.nip || '1783972561983'}</span>
                <span>•</span>
                <span className="font-medium text-slate-800">
                  Mata Pelajaran: Matematika Peminatan
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

          {/* Banner Khusus jika Guru merangkap Wali Kelas */}
          {isWali && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/30">
                    Tugas Tambahan Aktif
                  </span>
                  <span>Semester Ganjil 2026/2027</span>
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

          {/* 4 Kartu Metrik Interaktif */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div onClick={() => setActiveView('materi')} className="cursor-pointer">
              <MetricCard
                title="Total Kelas"
                value="5"
                subtitle="Kelas Binaan & Reguler"
                icon={Users}
                variant="primary"
              />
            </div>
            <div onClick={() => setActiveView('tugas')} className="cursor-pointer">
              <MetricCard
                title="Tugas Perlu Dinilai"
                value="64"
                subtitle="Menunggu evaluasi guru"
                icon={ClipboardCheck}
                variant="white"
              />
            </div>
            <div onClick={() => setActiveView('tugas')} className="cursor-pointer">
              <MetricCard
                title="Kuis Aktif"
                value="3"
                subtitle="Sesi penilaian berlangsung"
                icon={HelpCircle}
                variant="cyan"
              />
            </div>
            <div onClick={() => setActiveView('absensi')} className="cursor-pointer">
              <MetricCard
                title="Kehadiran Siswa Hari Ini"
                value="95%"
                subtitle="800 dari 823 siswa hadir"
                icon={UserCheck}
                variant="success"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Kolom Kiri: Jadwal Mengajar */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-900" />
                  Jadwal Mengajar Hari Ini (Senin)
                </h2>
                <span className="text-xs text-slate-500 font-medium">Semester Ganjil 2026/2027</span>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                        XII IPA 1
                      </span>
                      <span className="text-xs text-slate-500 font-medium">32 Siswa</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Matematika Peminatan</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-700" />
                        07:00 - 09:00 WIB
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Ruang R.XII-1
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs cursor-pointer"
                      onClick={() => {
                        setSelectedKelasId('f0000000-0000-0000-0000-000000000001');
                        setActiveView('absensi');
                      }}
                    >
                      Absensi Kelas
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-50 text-blue-900 border border-blue-200">
                        XII IPA 3
                      </span>
                      <span className="text-xs text-slate-500 font-medium">30 Siswa</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Matematika Peminatan</h3>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-700" />
                        09:30 - 11:30 WIB
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        Ruang R.XII-3
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs cursor-pointer"
                      onClick={() => {
                        setSelectedKelasId('f0000000-0000-0000-0000-000000000002');
                        setActiveView('absensi');
                      }}
                    >
                      Absensi Kelas
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Tugas & Bahan Ajar */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-amber-600" />
                  Tugas Perlu Dinilai
                </h2>
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-900">
                  2 Tugas Menunggu
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3.5">
                <div className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Latihan Matriks dan Determinan Ordo 3x3
                      </h4>
                      <p className="text-[11px] text-slate-500">Kelas XII IPA 1</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md shrink-0">
                      28/32 Mengumpulkan
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">Tenggat: Kemarin, 23:59 WIB</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTugasId('tugas-01');
                        setActiveView('tugas');
                      }}
                      className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="pb-3 border-b border-slate-100 last:border-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Analisis Limit Fungsi Aljabar Tak Hingga
                      </h4>
                      <p className="text-[11px] text-slate-500">Kelas XII IPA 3</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 rounded-md shrink-0">
                      18/30 Mengumpulkan
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-[11px] text-slate-400">Tenggat: Hari Ini, 18:00 WIB</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTugasId('tugas-02');
                        setActiveView('tugas');
                      }}
                      className="text-xs font-semibold text-blue-900 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
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

      {/* 2. MODUL MATERI */}
      {activeView === 'materi' && (
        <MateriModule
          materiList={materiList}
          kelasList={KELAS_LIST}
          onUploadMateri={() => setIsUploadOpen(true)}
          onEditMateri={(m) => alert(`Edit materi: ${m.judul_materi}`)}
          onDeleteMateri={(id) => setMateriList(materiList.filter((m) => m.id_materi !== id))}
          onDownloadMateri={(m) => alert(`Mengunduh berkas ${m.judul_materi}...`)}
        />
      )}

      {/* 3. MODUL TUGAS & PENILAIAN */}
      {activeView === 'tugas' && (
        <TugasModule
          tugasList={tugasList}
          submissionsList={submissionsList}
          kelasList={KELAS_LIST}
          activeTugasId={selectedTugasId}
          onClearActiveTugas={() => setSelectedTugasId(null)}
          onOpenCreateTugas={() => setIsCreateTugasOpen(true)}
          onSaveNilaiSubmission={handleSaveNilaiSubmission}
        />
      )}

      {/* 4. MODUL ABSENSI */}
      {activeView === 'absensi' && (
        <AbsensiModule
          absensiList={absensiList}
          kelasList={KELAS_LIST}
          initialKelasId={selectedKelasId}
          onUpdateStatusKehadiran={handleUpdateStatus}
          onVerifyAbsensi={(kId) => alert(`Presensi kelas telah diverifikasi!`)}
        />
      )}

      {/* 5. MODUL NILAI */}
      {activeView === 'nilai' && (
        <NilaiModule
          nilaiList={nilaiList}
          kelasList={KELAS_LIST}
          onUpdateNilai={(u) => setNilaiList(nilaiList.map((n) => (n.id_nilai === u.id_nilai ? u : n)))}
        />
      )}

      {/* 6. POPUP MODAL UPLOAD, BUAT TUGAS & INFO BRANCH */}
      <UploadMateriModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        kelasList={KELAS_LIST}
        currentBidangStudi="Matematika Peminatan"
        onSaveMateri={handleSaveMateri}
      />

      <CreateTugasModal
        isOpen={isCreateTugasOpen}
        onClose={() => setIsCreateTugasOpen(false)}
        kelasList={KELAS_LIST}
        currentBidangStudi="Matematika Peminatan"
        onSaveTugas={handleSaveTugas}
      />

      <BranchCollabInfoModal
        isOpen={isBranchInfoOpen}
        onClose={() => setIsBranchInfoOpen(false)}
      />
    </div>
  );
}