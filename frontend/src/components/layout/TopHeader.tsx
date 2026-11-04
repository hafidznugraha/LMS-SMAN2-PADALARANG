import React, { useState } from 'react';
import { 
  Bell, 
  GraduationCap, 
  ChevronDown, 
  Layers, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  BookOpen
} from 'lucide-react';
import { Guru, Notifikasi } from '../../types/lms';

interface TopHeaderProps {
  currentGuru: Guru;
  onSwitchGuru: (guruType: 'irma' | 'bambang') => void;
  notifikasiList: Notifikasi[];
  onMarkAllRead: () => void;
  onOpenBranchInfo: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentGuru,
  onSwitchGuru,
  notifikasiList,
  onMarkAllRead,
  onOpenBranchInfo,
}) => {
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const unreadCount = notifikasiList.filter((n) => !n.status_dibaca).length;

  return (
    <header className="h-18 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Brand & Subtitle in Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-tight">
            SMAN 2 Padalarang LMS
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Sistem Informasi Pembelajaran Terpadu
          </p>
        </div>
      </div>

      {/* Action Controls & Profile */}
      <div className="flex items-center gap-4">
        {/* Branch / Modul Scope Indicator Button */}
        <button
          onClick={onOpenBranchInfo}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition-colors cursor-pointer"
          title="Lihat batas modul Guru vs Wali Kelas pada praktikum"
        >
          <Layers className="w-3.5 h-3.5 text-amber-600" />
          <span>Scope: Modul Guru Mapel</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 relative transition-colors cursor-pointer"
            aria-label="Pemberitahuan"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">Notifikasi Guru</h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2">
                {notifikasiList.map((notif) => (
                  <div
                    key={notif.id_notifikasi}
                    className={`p-3 rounded-xl transition-colors ${
                      notif.status_dibaca ? 'bg-transparent' : 'bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700 mt-0.5 shrink-0">
                        {notif.tipe_notifikasi === 'Tugas' && <BookOpen className="w-4 h-4" />}
                        {notif.tipe_notifikasi === 'Absensi' && <UserCheck className="w-4 h-4" />}
                        {notif.tipe_notifikasi === 'Nilai' && <CheckCircle2 className="w-4 h-4" />}
                        {notif.tipe_notifikasi === 'Sistem' && <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-900">{notif.judul_pesan}</p>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          {notif.isi_pesan}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {notif.created_at}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Display */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-3 pl-2 pr-3 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
          >
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {currentGuru.nip === '1783972561983' ? 'IS' : 'BH'}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {currentGuru.nip === '1783972561983'
                  ? 'Irma Satikarama'
                  : 'Drs. Bambang Haryadi'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                {currentGuru.is_wali_kelas ? 'Guru & Wali Kelas' : 'Guru Pendidik'}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Profile & Switcher Dropdown */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
              <div className="pb-3 border-b border-slate-100">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                  Akun Guru Aktif
                </p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {currentGuru.nip === '1783972561983'
                    ? 'Irma Satikarama, S.Pd.'
                    : 'Drs. Bambang Haryadi, M.Pd.'}
                </p>
                <p className="text-xs text-blue-600 font-mono mt-0.5">NIP: {currentGuru.nip}</p>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Mata Pelajaran: {currentGuru.bidang_studi}
                </p>
                {currentGuru.is_wali_kelas ? (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                    Wali Kelas: {currentGuru.nama_kelas_binaan}
                  </span>
                ) : (
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                    Guru Mata Pelajaran Murni
                  </span>
                )}
              </div>

              {/* Demo Switcher for Evaluation */}
              <div className="pt-3">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Uji Tipe Guru (Evaluasi Praktikum):
                </p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      onSwitchGuru('irma');
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      currentGuru.nip === '1783972561983'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p>Irma Satikarama (Matematika)</p>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Bukan Wali Kelas (Guru Mapel Saja)
                      </span>
                    </div>
                    {currentGuru.nip === '1783972561983' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      onSwitchGuru('bambang');
                      setShowProfileDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      currentGuru.nip !== '1783972561983'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p>Drs. Bambang Haryadi (Fisika)</p>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Merangkap Wali Kelas XII MIPA 2
                      </span>
                    </div>
                    {currentGuru.nip !== '1783972561983' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
