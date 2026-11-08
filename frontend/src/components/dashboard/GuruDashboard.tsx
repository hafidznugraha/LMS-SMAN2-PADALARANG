import React from 'react';
import { 
  Upload, 
  Plus, 
  Users, 
  FileCheck2, 
  ClipboardList, 
  UserCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  ArrowRight,
  ClipboardCheck,
  Info
} from 'lucide-react';
import { Guru, JadwalPelajaran, TugasKuis } from '../../types/lms';
import { ActiveTab } from '../layout/Sidebar';

interface GuruDashboardProps {
  currentGuru: Guru;
  jadwalHariIni: JadwalPelajaran[];
  tugasPerluDinilai: TugasKuis[];
  totalKelas: number;
  totalTugasCount?: number;
  onOpenUploadMateri: () => void;
  onOpenCreateTugas: () => void;
  onOpenAbsensiKelas?: (kelasId: string) => void;
  onOpenPenilaianTugas: (tugasId: string) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenBranchInfo: () => void;
}

export const GuruDashboard: React.FC<GuruDashboardProps> = ({
  currentGuru,
  jadwalHariIni,
  tugasPerluDinilai,
  totalKelas,
  totalTugasCount,
  onOpenUploadMateri,
  onOpenCreateTugas,
  onOpenAbsensiKelas,
  onOpenPenilaianTugas,
  onNavigateTab,
  onOpenBranchInfo,
}) => {
  const isIrma = currentGuru.nip === '1783972561983';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Selamat Datang, {isIrma ? 'Irma Satikarama' : 'Drs. Bambang Haryadi'}
            <span role="img" aria-label="wave">👋</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs sm:text-sm text-slate-600">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              Guru Pengampu
            </span>
            <span>•</span>
            <span className="font-mono text-slate-700">NIP: {currentGuru.nip}</span>
            <span>•</span>
            <span className="font-medium text-slate-700">
              Mata Pelajaran: {currentGuru.bidang_studi}
            </span>
            {currentGuru.is_wali_kelas && (
              <>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Wali Kelas {currentGuru.nama_kelas_binaan}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons matching screenshot */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenUploadMateri}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold transition-all shadow-xs hover:border-slate-400 cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-600" />
            <span>Upload Materi</span>
          </button>

          <button
            onClick={onOpenCreateTugas}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* Explanatory notice banner for university practical assignment */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-xs">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-blue-950">
              Modul Praktikum: Halaman & Fitur Guru Mata Pelajaran
            </h4>
            <p className="text-xs text-blue-800 mt-0.5 leading-relaxed">
              Halaman ini didedikasikan untuk <strong>Guru Pengampu (Mapel)</strong> sesuai pembagian tugas praktikum. Guru dapat mengunggah bahan ajar, menerbitkan penugasan, menilai tugas siswa, serta memvalidasi presensi harian per sesi. Modul wali kelas dikerjakan pada branch terpisah.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenBranchInfo}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/60 px-3 py-1.5 rounded-lg border border-blue-200 shrink-0 transition-colors cursor-pointer"
        >
          Lihat Arsitektur Branch
        </button>
      </div>

      {/* 4 Metric Cards matching exact screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Kelas (Blue) */}
        <div 
          onClick={() => onNavigateTab('jadwal')}
          className="bg-[#1d4ed8] text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Total Kelas
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight mt-1 font-mono tabular-nums">
                {totalKelas}
              </h3>
              <p className="text-xs text-blue-100/90 mt-1 font-medium">
                Kelas Binaan & Reguler
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Card 2: Tugas Perlu Dinilai (White) */}
        <div 
          onClick={() => onNavigateTab('tugas')}
          className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tugas Perlu Dinilai
              </p>
              <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-1 font-mono tabular-nums">
                64
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Menunggu evaluasi guru
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-6 h-6 text-slate-700" />
            </div>
          </div>
        </div>

        {/* Card 3: Total Penugasan (Cyan) */}
        <div 
          onClick={() => onNavigateTab('tugas')}
          className="bg-[#0284c7] text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-sky-100 uppercase tracking-wider">
                Total Penugasan
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight mt-1 font-mono tabular-nums">
                {totalTugasCount ?? 0}
              </h3>
              <p className="text-xs text-sky-100/90 mt-1 font-medium">
                Penugasan terbit aktif
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Card 4: Kehadiran Siswa Hari Ini (Green) */}
        <div 
          className="bg-[#059669] text-white rounded-2xl p-5 shadow-sm relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                Kehadiran Siswa Hari Ini
              </p>
              <h3 className="text-4xl font-extrabold tracking-tight mt-1 font-mono tabular-nums">
                95%
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1 font-medium">
                800 dari 823 siswa hadir
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Jadwal Mengajar vs Tugas Perlu Dinilai */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Jadwal Mengajar Hari Ini */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Jadwal Mengajar Hari Ini (Senin)
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Semester Ganjil 2026/2027
              </span>
            </div>

            {/* Class Cards */}
            <div className="mt-4 space-y-3.5">
              {jadwalHariIni.map((jadwal) => (
                <div
                  key={jadwal.id_jadwal}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/60 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                        {jadwal.nama_kelas}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {jadwal.jumlah_siswa} Siswa
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">
                      {jadwal.nama_mapel}
                    </h4>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {jadwal.jam_mulai} - {jadwal.jam_selesai} WIB
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {jadwal.ruangan}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigateTab('materi')}
                    className="self-start sm:self-center px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                  >
                    Bahan Ajar
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Punya 5 sesi mengajar aktif minggu ini.
              </span>
              <button
                onClick={() => onNavigateTab('jadwal')}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Lihat Jadwal Lengkap <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Tugas Perlu Dinilai & Distribusi Bahan Ajar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Tugas Perlu Dinilai
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                2 Tugas Menunggu
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {tugasPerluDinilai.slice(0, 2).map((tugas) => (
                <div
                  key={tugas.id_tugas_kuis}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 space-y-2.5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {tugas.judul}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                      tugas.jumlah_mengumpulkan > 20
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tugas.jumlah_mengumpulkan}/{tugas.total_siswa} Mengumpulkan
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="font-medium text-slate-700">Kelas {tugas.nama_kelas}</p>
                    <p>
                      Tenggat:{' '}
                      <span className="font-medium text-slate-600">
                        {tugas.tenggat_waktu.includes('11-02') ? 'Kemarin, 23:59 WIB' : 'Hari Ini, 18:00 WIB'}
                      </span>
                    </p>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => onOpenPenilaianTugas(tugas.id_tugas_kuis)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      Buka Penilaian <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Banner Promo / Distribution matching screenshot */}
          <div className="bg-[#142d72] text-white rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-200">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Distribusi Bahan Ajar</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                Kelola Berkas Materi Pelajaran
              </h4>
            </div>

            <button
              onClick={() => onNavigateTab('materi')}
              className="px-4 py-2 rounded-xl bg-white text-[#142d72] hover:bg-slate-100 text-xs font-bold shadow-xs shrink-0 transition-colors cursor-pointer"
            >
              Lihat Materi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
