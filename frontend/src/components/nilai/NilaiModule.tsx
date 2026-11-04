import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  Edit3, 
  Download, 
  Printer, 
  CheckCircle2, 
  Info, 
  Lock, 
  Unlock,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { NilaiSiswa, Kelas } from '../../types/lms';

interface NilaiModuleProps {
  nilaiList: NilaiSiswa[];
  kelasList: Kelas[];
  onUpdateNilai: (updated: NilaiSiswa) => void;
}

export const NilaiModule: React.FC<NilaiModuleProps> = ({
  nilaiList,
  kelasList,
  onUpdateNilai,
}) => {
  const [selectedKelasId, setSelectedKelasId] = useState('k-12-ipa-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<NilaiSiswa | null>(null);
  const [tugasVal, setTugasVal] = useState<number>(0);
  const [uhVal, setUhVal] = useState<number>(0);
  const [utsVal, setUtsVal] = useState<number>(0);
  const [uasVal, setUasVal] = useState<number>(0);
  const [feedbackVal, setFeedbackVal] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const currentKelas = kelasList.find((k) => k.id_kelas === selectedKelasId) || kelasList[0];

  const classGrades = nilaiList.filter((n) => {
    const matchesKelas = n.id_kelas === selectedKelasId;
    const matchesSearch =
      n.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.nis.includes(searchQuery);
    return matchesKelas && matchesSearch;
  });

  // Calculate class average
  const classAvg = classGrades.length
    ? (
        classGrades.reduce((acc, curr) => acc + curr.nilai_akhir, 0) /
        classGrades.length
      ).toFixed(1)
    : '0.0';

  const countA = classGrades.filter((g) => g.skor_huruf === 'A').length;
  const countB = classGrades.filter((g) => g.skor_huruf === 'B').length;
  const countC = classGrades.filter((g) => g.skor_huruf === 'C').length;
  const countD = classGrades.filter((g) => g.skor_huruf === 'D').length;

  const handleOpenEdit = (student: NilaiSiswa) => {
    setEditingStudent(student);
    setTugasVal(student.nilai_tugas);
    setUhVal(student.nilai_uh);
    setUtsVal(student.nilai_uts);
    setUasVal(student.nilai_uas);
    setFeedbackVal(student.feedback || '');
  };

  const calculateHuruf = (finalScore: number): 'A' | 'B' | 'C' | 'D' => {
    if (finalScore >= 88) return 'A';
    if (finalScore >= 78) return 'B';
    if (finalScore >= 68) return 'C';
    return 'D';
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Bobot Kurikulum: Tugas 30%, UH 20%, UTS 25%, UAS 25%
    const calculatedFinal = Number(
      (tugasVal * 0.3 + uhVal * 0.2 + utsVal * 0.25 + uasVal * 0.25).toFixed(1)
    );
    const calculatedHuruf = calculateHuruf(calculatedFinal);

    const updated: NilaiSiswa = {
      ...editingStudent,
      nilai_tugas: tugasVal,
      nilai_uh: uhVal,
      nilai_uts: utsVal,
      nilai_uas: uasVal,
      nilai_akhir: calculatedFinal,
      skor_huruf: calculatedHuruf,
      feedback: feedbackVal,
    };

    onUpdateNilai(updated);
    setSuccessToast(`Nilai akademik untuk ${editingStudent.nama_siswa} berhasil diperbarui.`);
    setTimeout(() => setSuccessToast(null), 3000);
    setEditingStudent(null);
  };

  const handleExportCSV = () => {
    const headers = ['No', 'Nama Siswa', 'NIS', 'Tugas (30%)', 'UH (20%)', 'UTS (25%)', 'UAS (25%)', 'Nilai Akhir', 'Predikat', 'Feedback'];
    const rows = classGrades.map((g, idx) => [
      idx + 1,
      `"${g.nama_siswa}"`,
      `"${g.nis}"`,
      g.nilai_tugas,
      g.nilai_uh,
      g.nilai_uts,
      g.nilai_uas,
      g.nilai_akhir,
      `"${g.skor_huruf}"`,
      `"${g.feedback || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Leger_Nilai_${currentKelas.nama_kelas}_Matematika.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Modul Penilaian Akademik Mata Pelajaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan buku nilai (Tugas, UH, UTS, UAS), pembobotan terprogram, dan konversi predikat (FR-NIL-01 s/d 04)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Ekspor CSV / Leger</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Class Selector & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Class Selection & Search */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Kelas:
              </label>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {kelasList.map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cari Siswa:
              </label>
              <input
                type="text"
                placeholder="Nama / NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Average Metric Card */}
        <div className="bg-[#1d4ed8] text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
              Rata-Rata Nilai Kelas
            </p>
            <h3 className="text-3xl font-extrabold font-mono mt-0.5 tabular-nums">{classAvg}</h3>
            <p className="text-[10px] text-blue-100 mt-0.5 font-medium">Batas KKM: 75.00</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Predicate Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs grid grid-cols-4 gap-1 text-center">
          <div className="bg-emerald-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-emerald-700">Predikat A</span>
            <p className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">{countA}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-blue-700">Predikat B</span>
            <p className="text-base font-extrabold text-blue-800 font-mono mt-0.5">{countB}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-amber-700">Predikat C</span>
            <p className="text-base font-extrabold text-amber-800 font-mono mt-0.5">{countC}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-rose-700">Predikat D</span>
            <p className="text-base font-extrabold text-rose-800 font-mono mt-0.5">{countD}</p>
          </div>
        </div>
      </div>

      {/* Grade Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Buku Nilai Mata Pelajaran: Matematika Peminatan ({currentKelas.nama_kelas})
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <Unlock className="w-3.5 h-3.5" /> Draf Guru (Dapat Diedit)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Siswa / NIS</th>
                <th className="py-3 px-3 text-center">Tugas (30%)</th>
                <th className="py-3 px-3 text-center">UH (20%)</th>
                <th className="py-3 px-3 text-center">UTS (25%)</th>
                <th className="py-3 px-3 text-center">UAS (25%)</th>
                <th className="py-3 px-3 text-center font-bold text-slate-900">Nilai Akhir</th>
                <th className="py-3 px-3 text-center">Predikat</th>
                <th className="py-3 px-4">Catatan Kompetensi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classGrades.map((g, idx) => (
                <tr key={g.id_nilai} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{g.nama_siswa}</p>
                    <p className="font-mono text-[11px] text-slate-400">NIS: {g.nis}</p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_tugas}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uh}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uts}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uas}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-extrabold text-blue-700 bg-blue-50/60">
                    {g.nilai_akhir.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono ${
                      g.skor_huruf === 'A'
                        ? 'bg-emerald-100 text-emerald-800'
                        : g.skor_huruf === 'B'
                        ? 'bg-blue-100 text-blue-800'
                        : g.skor_huruf === 'C'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {g.skor_huruf}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <p className="truncate text-slate-600 text-[11px]" title={g.feedback || ''}>
                      {g.feedback || <span className="text-slate-400 italic">Belum ada catatan</span>}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Grade Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Input & Koreksi Nilai Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStudent.nama_siswa} • NIS: {editingStudent.nis} ({currentKelas.nama_kelas})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai Tugas (Bobot 30%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={tugasVal}
                  onChange={(e) => setTugasVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangan Harian (Bobot 20%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={uhVal}
                  onChange={(e) => setUhVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UTS (Bobot 25%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={utsVal}
                  onChange={(e) => setUtsVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UAS (Bobot 25%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={uasVal}
                  onChange={(e) => setUasVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>
            </div>

            {/* Live calculation preview */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
              <span>Proyeksi Nilai Akhir Otomatis:</span>
              <span className="text-base font-bold font-mono text-blue-700">
                {(tugasVal * 0.3 + uhVal * 0.2 + utsVal * 0.25 + uasVal * 0.25).toFixed(1)}{' '}
                (Predikat {calculateHuruf(tugasVal * 0.3 + uhVal * 0.2 + utsVal * 0.25 + uasVal * 0.25)})
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Capaian Kompetensi (Deskripsi Nilai)
              </label>
              <textarea
                rows={2}
                value={feedbackVal}
                onChange={(e) => setFeedbackVal(e.target.value)}
                placeholder="Catatan kemajuan siswa untuk diteruskan ke leger nilai wali kelas..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
