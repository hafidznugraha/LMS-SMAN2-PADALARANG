import React from 'react';
import { X, GitBranch, Layers, CheckCircle2, UserCheck, ShieldCheck, ArrowRight, Code } from 'lucide-react';

interface BranchCollabInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BranchCollabInfoModal: React.FC<BranchCollabInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Arsitektur Modul Guru vs Wali Kelas & Strategi Git Branch
              </h3>
              <p className="text-xs text-slate-500">
                Mata Kuliah Praktikum Implementasi dan Pengujian Sistem Informasi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <h4 className="font-bold text-blue-950 flex items-center gap-1.5 text-sm">
              <Layers className="w-4 h-4 text-blue-600" />
              Bagaimana Hubungan Guru Mapel dan Wali Kelas di SMAN 2?
            </h4>
            <p>
              Berdasarkan <strong>PRD Bab 2 (RBAC) & Kamus Data Tabel 3 & 6</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-700">
              <li>
                <strong>Guru Pengampu (Mapel)</strong>: Bertanggung jawab pada kegiatan operasional mata pelajaran yang diajarnya (Distribusi Materi, Pembuatan Tugas, Lembar Penilaian Siswa, dan Validasi Presensi Jam Pelajaran).
              </li>
              <li>
                <strong>Wali Kelas</strong>: Merupakan guru yang <em>diberikan tugas tambahan</em> membina satu rombel kelas tertentu (memantau rekap absensi semester kelas binaan, meninjau kompilasi nilai leger seluruh mapel, dan mengisi catatan pembinaan rapor).
              </li>
              <li>
                <strong>Ada guru yang hanya Guru Mapel</strong> (misal Bu Irma Satikarama), dan <strong>ada guru yang merangkap Wali Kelas</strong> (misal Drs. Bambang Haryadi yang mengampu Fisika sekaligus Wali Kelas XII MIPA 2).
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl border-2 border-blue-300 bg-blue-50/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded">
                  feature/guru-mapel
                </span>
                <span className="text-[11px] font-bold text-blue-800">Branch Kamu (Aktif)</span>
              </div>
              <p className="font-bold text-slate-900">Ruang Lingkup Fitur Guru Mapel:</p>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>UI-04 Dashboard Guru:</strong> Jadwal hari ini & ringkasan tugas</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Modul Materi (FR-MAT-01 s/d 03):</strong> Upload, edit, download bahan ajar</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Modul Penugasan (FR-TG-01, 04):</strong> Deadline, rubrik & penilaian siswa</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Presensi Harian (FR-ABS-03):</strong> Validasi langsung sesi KBM</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Penilaian Akademik (FR-NIL-01 s/d 03):</strong> Input nilai Tugas/UH/UTS/UAS</span>
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[11px] bg-slate-700 text-white px-2 py-0.5 rounded">
                  feature/wali-kelas
                </span>
                <span className="text-[11px] font-bold text-slate-600">Branch Rekan Kelompok</span>
              </div>
              <p className="font-bold text-slate-900">Ruang Lingkup Fitur Wali Kelas:</p>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>UI-06 Dashboard Wali Kelas:</strong> Rekap kelas binaan</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>Leger Akademik (FR-LAP-01):</strong> Meninjau draf nilai seluruh mapel</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>Catatan Wali (FR-LAP-02):</strong> Catatan perkembangan karakter rapor</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>Rekapitulasi Kehadiran:</strong> Akumulasi persentase per semester</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>Koordinasi Kurikulum:</strong> Pengajuan pengesahan rapor</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
            <p className="font-bold text-amber-400 flex items-center gap-1.5">
              <Code className="w-4 h-4" />
              Rekomendasi Perintah Git untuk Pengerjaan Bertahap:
            </p>
            <div className="font-mono text-[11px] space-y-1 text-slate-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
              <p># 1. Pastikan buat branch fitur guru dari branch utama:</p>
              <p className="text-emerald-400">git checkout -b feature/guru-mapel</p>
              <p className="mt-1"># 2. Lakukan commit berkala per modul yang kamu selesaikan:</p>
              <p className="text-emerald-400">git commit -m "feat(guru): implementasi manajemen materi pembelajaran"</p>
              <p className="text-emerald-400">git commit -m "feat(guru): implementasi lembar penilaian dan koreksi presensi"</p>
              <p className="mt-1"># 3. Push ke remote repository untuk code review teman:</p>
              <p className="text-emerald-400">git push origin feature/guru-mapel</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            Mengerti & Lanjutkan Pengerjaan
          </button>
        </div>
      </div>
    </div>
  );
};
