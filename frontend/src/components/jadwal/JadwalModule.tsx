import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  BookOpen, 
  UserCheck, 
  Filter 
} from 'lucide-react';
import { JadwalPelajaran } from '../../types/lms';

interface JadwalModuleProps {
  jadwalList: JadwalPelajaran[];
  onOpenAbsensiKelas: (kelasId: string) => void;
}

export const JadwalModule: React.FC<JadwalModuleProps> = ({
  jadwalList,
  onOpenAbsensiKelas,
}) => {
  const [selectedHari, setSelectedHari] = useState<string>('ALL');

  const daysOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const filteredJadwal = jadwalList.filter((j) => {
    return selectedHari === 'ALL' || j.hari === selectedHari;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Jadwal Kegiatan Belajar Mengajar (KBM)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Plotting sesi mengajar mingguan guru pengampu semester ganjil 2026/2027 (PRD Modul 8: /api/v1/jadwal)
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSelectedHari('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedHari === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Hari
          </button>
          {daysOrder.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedHari(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedHari === day
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredJadwal.length === 0 ? (
          <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-500">
            Tidak ada jadwal mengajar pada hari yang dipilih.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJadwal.map((jadwal) => (
              <div
                key={jadwal.id_jadwal}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-extrabold">
                      {jadwal.hari}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-bold">
                      {jadwal.nama_kelas}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900">{jadwal.nama_mapel}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Sesi Tatap Muka Reguler</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 font-medium pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{jadwal.jam_mulai} - {jadwal.jam_selesai} WIB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{jadwal.ruangan}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{jadwal.jumlah_siswa} Siswa Terdaftar</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    Sesi Aktif
                  </span>
                  <button
                    onClick={() => onOpenAbsensiKelas(jadwal.id_kelas)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Presensi Kelas</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
