import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Save, 
  Filter, 
  Check, 
  X,
  FileSpreadsheet,
  Info,
  ArrowLeft
} from 'lucide-react';
import { Absensi, StatusKehadiran, Kelas } from '../../types/lms';

interface AbsensiModuleProps {
  absensiList: Absensi[];
  kelasList: Kelas[];
  onUpdateStatusKehadiran: (idAbsensi: string, newStatus: StatusKehadiran, keterangan?: string, item?: Absensi) => void;
  onVerifyAbsensi: (kelasId: string) => void;
  initialKelasId?: string;
  onKelasChange?: (kelasId: string) => void;
  onDateChange?: (tanggal: string) => void;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
  isLockedToSingleClass?: boolean;
}

export const AbsensiModule: React.FC<AbsensiModuleProps> = ({
  absensiList,
  kelasList,
  onUpdateStatusKehadiran,
  onVerifyAbsensi,
  initialKelasId,
  onKelasChange,
  onDateChange,
  title,
  subtitle,
  showBackButton,
  backButtonHref,
  backButtonLabel,
  isLockedToSingleClass,
}) => {
  const [selectedKelasId, setSelectedKelasId] = useState<string>(initialKelasId || kelasList[0]?.id_kelas || '');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewingKeterangan, setViewingKeterangan] = useState<Absensi | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialKelasId) {
      setSelectedKelasId(initialKelasId);
    } else if (!selectedKelasId && kelasList.length > 0) {
      setSelectedKelasId(kelasList[0].id_kelas);
    }
  }, [initialKelasId, kelasList, selectedKelasId]);

  const currentKelas = kelasList.find((k) => k.id_kelas === selectedKelasId) || kelasList[0];

  const classAttendance = absensiList.filter((a) => !selectedKelasId || a.id_kelas === selectedKelasId);

  const hadirCount = classAttendance.filter((a) => a.status_kehadiran === 'Hadir').length;
  const sakitCount = classAttendance.filter((a) => a.status_kehadiran === 'Sakit').length;
  const izinCount = classAttendance.filter((a) => a.status_kehadiran === 'Izin').length;
  const alfaCount = classAttendance.filter((a) => a.status_kehadiran === 'Alfa').length;
  const total = classAttendance.length;
  const kehadiranPersen = total > 0 ? Math.round((hadirCount / total) * 100) : 0;

  const handleVerify = () => {
    onVerifyAbsensi(selectedKelasId);
    setToastMessage(`Presensi harian untuk ${currentKelas?.nama_kelas || 'kelas'} berhasil diverifikasi.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectKelas = (kId: string) => {
    setSelectedKelasId(kId);
    if (onKelasChange) {
      onKelasChange(kId);
    }
  };

  const handleSelectDate = (dateVal: string) => {
    setSelectedDate(dateVal);
    if (onDateChange) {
      onDateChange(dateVal);
    }
  };

  const isSingleClass = isLockedToSingleClass || kelasList.length <= 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {title || 'Modul Presensi & Validasi Absensi Siswa'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {subtitle || 'Validasi kehadiran siswa terintegrasi secara langsung dengan sistem'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {showBackButton && backButtonHref && (
            <Link
              href={backButtonHref}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-semibold transition-all shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{backButtonLabel || 'Kembali'}</span>
            </Link>
          )}

          <button
            onClick={handleVerify}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Verifikasi & Simpan Presensi</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Rombongan Belajar:
            </label>
            {isSingleClass ? (
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-800">
                  Kelas {currentKelas?.nama_kelas || 'Binaan'} ({currentKelas?.jumlah_siswa ?? total} Siswa)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                  Kelas Binaan
                </span>
              </div>
            ) : (
              <select
                value={selectedKelasId}
                onChange={(e) => handleSelectKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {kelasList.map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas} ({k.jumlah_siswa} Siswa)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="w-36">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tanggal Sesi:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleSelectDate(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-[#059669] text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-emerald-100 uppercase tracking-wider">
              Tingkat Kehadiran
            </p>
            <h3 className="text-2xl font-extrabold font-mono mt-0.5">{kehadiranPersen}%</h3>
            <p className="text-[10px] text-emerald-100 mt-0.5">{hadirCount} dari {total} hadir</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs grid grid-cols-4 gap-1 text-center">
          <div className="bg-emerald-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-emerald-700">HADIR</span>
            <p className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">{hadirCount}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-amber-700">SAKIT</span>
            <p className="text-base font-extrabold text-amber-800 font-mono mt-0.5">{sakitCount}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-blue-700">IZIN</span>
            <p className="text-base font-extrabold text-blue-800 font-mono mt-0.5">{izinCount}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-rose-700">ALFA</span>
            <p className="text-base font-extrabold text-rose-800 font-mono mt-0.5">{alfaCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Presensi Kelas {currentKelas?.nama_kelas || ''}
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Tanggal Sesi: {selectedDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Lengkap Siswa</th>
                <th className="py-3 px-3">NIS</th>
                <th className="py-3 px-3">Jam Masuk Mandiri</th>
                <th className="py-3 px-4 text-center">Status Kehadiran (Klik untuk Koreksi Guru)</th>
                <th className="py-3 px-4">Keterangan / Bukti</th>
                <th className="py-3 px-3 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classAttendance.map((item, idx) => (
                <tr key={item.id_absensi} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{item.nama_siswa}</td>
                  <td className="py-3 px-3 font-mono text-slate-500">{item.nis}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">
                    {item.waktu === '00:00:00' ? (
                      <span className="text-rose-500 italic">Belum absen</span>
                    ) : (
                      `${item.waktu} WIB`
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 gap-0.5">
                      {(['Hadir', 'Sakit', 'Izin', 'Alfa'] as StatusKehadiran[]).map((status) => {
                        const isCurrent = item.status_kehadiran === status;
                        return (
                          <button
                            key={status}
                            onClick={() => onUpdateStatusKehadiran(item.id_absensi, status, undefined, item)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isCurrent
                                ? status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : status === 'Sakit'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : status === 'Izin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </td>

                  <td className="py-3 px-4 max-w-[200px]">
                    {item.keterangan ? (
                      <button
                        onClick={() => setViewingKeterangan(item)}
                        className="text-left text-xs text-blue-600 hover:text-blue-800 underline truncate max-w-full block cursor-pointer"
                        title={item.keterangan}
                      >
                        {item.keterangan}
                      </button>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">-</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {item.diverifikasi_oleh_guru ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3 text-emerald-600" /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        Menunggu
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewingKeterangan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Surat Izin / Keterangan Sakit Siswa
                </h3>
                <p className="text-xs text-slate-500">{viewingKeterangan.nama_siswa}</p>
              </div>
              <button
                onClick={() => setViewingKeterangan(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
              <p className="font-bold text-slate-700">Alasan / Catatan Siswa:</p>
              <p className="text-slate-800 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-200">
                &ldquo;{viewingKeterangan.keterangan}&rdquo;
              </p>
              {viewingKeterangan.bukti_surat_url && (
                <div className="pt-2">
                  <p className="font-bold text-slate-700 mb-1">Lampiran Berkas:</p>
                  <a
                    href={viewingKeterangan.bukti_surat_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline font-mono"
                  >
                    <FileText className="w-4 h-4" />
                    surat_keterangan_resmi.pdf
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingKeterangan(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
