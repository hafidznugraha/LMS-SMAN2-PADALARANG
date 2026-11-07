import React, { useState } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Eye, 
  Award,
  BookOpen,
  X,
  FileCheck2,
  ExternalLink,
  Edit3,
  Trash2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { TugasKuis, PengumpulanTugas, Kelas, JenisPenugasan } from '../../types/lms';

interface TugasModuleProps {
  tugasList: TugasKuis[];
  submissionsList: PengumpulanTugas[];
  kelasList: Kelas[];
  onOpenCreateTugas: () => void;
  onSaveNilaiSubmission: (idPengumpulan: string, nilai: number, feedback: string, submission?: PengumpulanTugas) => void;
  activeTugasId?: string | null;
  onClearActiveTugas?: () => void;
  onOpenGrading?: (tugas: TugasKuis) => void;
  onEditTugas?: (tugas: TugasKuis) => void;
  onDeleteTugas?: (tugasId: string, judul?: string) => void;
}

export const TugasModule: React.FC<TugasModuleProps> = ({
  tugasList,
  submissionsList,
  kelasList,
  onOpenCreateTugas,
  onSaveNilaiSubmission,
  activeTugasId,
  onClearActiveTugas,
  onOpenGrading,
  onEditTugas,
  onDeleteTugas,
}) => {
  const [selectedJenis, setSelectedJenis] = useState<'ALL' | JenisPenugasan>('ALL');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedTugasForGrading, setSelectedTugasForGrading] = useState<TugasKuis | null>(() => {
    if (activeTugasId) {
      return (
        tugasList.find(
          (t) =>
            t.id_tugas_kuis === activeTugasId ||
            (t as unknown as { id?: string }).id === activeTugasId
        ) || null
      );
    }
    return null;
  });

  const [gradingSubmission, setGradingSubmission] = useState<PengumpulanTugas | null>(null);
  const [inputSkor, setInputSkor] = useState<number | ''>('');
  const [inputFeedback, setInputFeedback] = useState('');

  const [viewRubrikTugas, setViewRubrikTugas] = useState<TugasKuis | null>(null);

  const filteredTugas = tugasList.filter((t) => {
    const matchesJenis = selectedJenis === 'ALL' || t.jenis === selectedJenis;
    const matchesKelas =
      selectedKelas === 'ALL' ||
      t.id_kelas === selectedKelas ||
      (t as unknown as { kelas_id?: string }).kelas_id === selectedKelas;
    const matchesSearch =
      (t.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instruksi || (t as unknown as { deskripsi?: string }).deskripsi || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesJenis && matchesKelas && matchesSearch && !t.deleted_at;
  });

  const handleOpenGrading = (tugas: TugasKuis) => {
    setSelectedTugasForGrading(tugas);
    if (onOpenGrading) {
      onOpenGrading(tugas);
    }
  };

  const handleStartGradeStudent = (sub: PengumpulanTugas) => {
    if (sub.status_kumpul === 'Belum Mengumpulkan') {
      toast.warning('Siswa belum mengumpulkan tugas. Penilaian hanya dapat diberikan setelah tugas dikumpulkan.');
      return;
    }
    setGradingSubmission(sub);
    setInputSkor(sub.nilai ?? '');
    setInputFeedback(sub.feedback || (sub as unknown as { feedback_guru?: string }).feedback_guru || '');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    if (gradingSubmission.status_kumpul === 'Belum Mengumpulkan') {
      toast.error('Tidak dapat menilai siswa yang belum mengumpulkan tugas.');
      return;
    }

    const numScore = Number(inputSkor);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      toast.error('Skor harus bernilai numerik antara 0 sampai 100 sesuai PRD FR-TG-04.');
      return;
    }

    onSaveNilaiSubmission(
      gradingSubmission.id_pengumpulan || (gradingSubmission as unknown as { id?: string }).id || '',
      numScore,
      inputFeedback,
      gradingSubmission
    );
    toast.success(`Nilai untuk ${gradingSubmission.nama_siswa} berhasil disimpan!`);
    setGradingSubmission(null);
  };

  const currentTugasSubmissions = selectedTugasForGrading
    ? submissionsList.filter((s) => {
        const targetId = selectedTugasForGrading.id_tugas_kuis || (selectedTugasForGrading as unknown as { id?: string }).id;
        const subTaskId = s.id_tugas_kuis || (s as unknown as { tugas_id?: string }).tugas_id;
        return !targetId || !subTaskId || subTaskId === targetId;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Modul Tugas, Kuis & Penilaian
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Terbitkan penugasan berbatas waktu (deadline), periksa lembar jawaban, dan input nilai evaluasi
          </p>
        </div>

        <button
          onClick={onOpenCreateTugas}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tugas Baru</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas berdasarkan judul atau instruksi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Jenis Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['ALL', 'Tugas', 'Kuis', 'Proyek'] as const).map((jenis) => (
                <button
                  key={jenis}
                  onClick={() => setSelectedJenis(jenis)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedJenis === jenis
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {jenis === 'ALL' ? 'Semua Tipe' : jenis}
                </button>
              ))}
            </div>

            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredTugas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Belum Ada Penugasan</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {searchQuery || selectedJenis !== 'ALL' || selectedKelas !== 'ALL'
                ? 'Tidak ada tugas yang sesuai dengan kriteria filter pencarian Anda.'
                : 'Terbitkan tugas terstruktur, kuis daring, atau proyek praktikum baru untuk siswa Anda.'}
            </p>
          </div>
          <button
            onClick={onOpenCreateTugas}
            className="px-4 py-2 bg-[#142d72] hover:bg-[#1a388f] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Tugas Baru</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTugas.map((tugas) => {
            const isOverdue = new Date(tugas.tenggat_waktu).getTime() < new Date().getTime();
            return (
              <div
                key={tugas.id_tugas_kuis}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                        {tugas.nama_kelas}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {tugas.jenis}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      tugas.jumlah_mengumpulkan >= tugas.total_siswa * 0.8
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {tugas.jumlah_mengumpulkan}/{tugas.total_siswa} Mengumpulkan
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{tugas.judul}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {tugas.instruksi}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Tenggat: {tugas.tenggat_waktu} WIB
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Format: {tugas.format_file}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewRubrikTugas(tugas)}
                      className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 cursor-pointer py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Lihat Rubrik"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Rubrik</span>
                    </button>

                    {onEditTugas && (
                      <button
                        onClick={() => onEditTugas(tugas)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-blue-50 border border-blue-200 transition-colors"
                        title="Edit Tugas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    )}

                    {onDeleteTugas && (
                      <button
                        onClick={() => onDeleteTugas(tugas.id_tugas_kuis || (tugas as unknown as { id?: string }).id || '', tugas.judul)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-rose-50 border border-rose-200 transition-colors"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenGrading(tugas)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Lembar Penilaian Siswa</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rubric View Modal */}
      {viewRubrikTugas && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Rubrik Penilaian Tugas
                </h3>
                <p className="text-xs text-slate-500">{viewRubrikTugas.judul}</p>
              </div>
              <button
                onClick={() => setViewRubrikTugas(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
              {viewRubrikTugas.rubrik_penilaian}
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p>Format yang diizinkan: <strong>{viewRubrikTugas.format_file}</strong></p>
              <p>Maksimal berkas siswa: 10 MB (Sesuai Upload Policy PRD Bab 8.1)</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewRubrikTugas(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Tutup Rubrik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grading Drawer / Sheet (Lembar Penilaian Guru - UI-11 pada PRD) */}
      {selectedTugasForGrading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                    {selectedTugasForGrading.nama_kelas}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Lembar Penilaian: {selectedTugasForGrading.judul}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mata Pelajaran: {selectedTugasForGrading.nama_mapel} • Tenggat:{' '}
                  {selectedTugasForGrading.tenggat_waktu} WIB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTugasForGrading(null);
                  if (onClearActiveTugas) onClearActiveTugas();
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submissions Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Siswa / NIS</th>
                    <th className="py-3 px-3">Status Kumpul</th>
                    <th className="py-3 px-3">Berkas Jawaban</th>
                    <th className="py-3 px-3 text-center">Nilai (0-100)</th>
                    <th className="py-3 px-4">Umpan Balik Guru</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentTugasSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Belum ada data pengumpulan untuk penugasan ini.
                      </td>
                    </tr>
                  ) : (
                    currentTugasSubmissions.map((sub) => (
                      <tr key={sub.id_pengumpulan} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{sub.nama_siswa}</p>
                          <p className="font-mono text-[11px] text-slate-400">NIS: {sub.nis}</p>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            sub.status_kumpul === 'Tepat Waktu'
                              ? 'bg-emerald-100 text-emerald-800'
                              : sub.status_kumpul === 'Terlambat'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sub.status_kumpul}
                          </span>
                          {sub.tanggal_kumpul && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {sub.tanggal_kumpul.split(' ')[1]} WIB
                            </p>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          {sub.file_name ? (
                            sub.file_tugas ? (
                              <a
                                href={sub.file_tugas}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium hover:underline group"
                                title={`Buka berkas: ${sub.file_name}`}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                                <span className="truncate max-w-[120px]">
                                  {sub.file_name}
                                </span>
                                <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" />
                              </a>
                            ) : (
                              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[120px]" title={sub.file_name}>
                                  {sub.file_name}
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-slate-400 italic">Tidak ada berkas</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {sub.nilai !== null && sub.nilai !== undefined ? (
                            <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                              {sub.nilai}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-mono">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 max-w-[200px]">
                          <p className="truncate text-slate-600 italic" title={sub.feedback || ''}>
                            {sub.feedback || <span className="text-slate-400">Belum ada umpan balik</span>}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {sub.status_kumpul === 'Belum Mengumpulkan' ? (
                            <button
                              type="button"
                              disabled
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 font-semibold cursor-not-allowed text-xs border border-slate-200/80 select-none"
                              title="Siswa belum mengumpulkan tugas. Nilai hanya dapat diberikan setelah tugas dikumpulkan."
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Beri Nilai</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartGradeStudent(sub)}
                              className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors cursor-pointer text-xs"
                            >
                              {typeof sub.nilai === 'number' && sub.nilai !== null ? 'Koreksi Nilai' : 'Beri Nilai'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2 text-xs text-slate-500">
              <span>
                Total Siswa: {selectedTugasForGrading.total_siswa} • Dinilai:{' '}
                {currentTugasSubmissions.filter((s) => s.nilai !== null && s.nilai !== undefined).length}
              </span>
              <button
                onClick={() => setSelectedTugasForGrading(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                Selesai Menilai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Score & Feedback Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <form
            onSubmit={handleSaveGrade}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Input Nilai & Umpan Balik Guru
                </h3>
                <p className="text-xs text-slate-500">
                  {gradingSubmission.nama_siswa} (NIS: {gradingSubmission.nis})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {gradingSubmission.file_name && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-blue-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Berkas Jawaban Siswa:
                  </span>
                  {gradingSubmission.file_tugas && (
                    <a
                      href={gradingSubmission.file_tugas}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold underline"
                    >
                      Buka / Unduh Berkas
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </p>
                <p className="font-mono text-blue-800 break-all">{gradingSubmission.file_name}</p>
                {gradingSubmission.catatan_siswa && (
                  <p className="text-slate-600 italic pt-1">
                    "{gradingSubmission.catatan_siswa}"
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Skor Nilai Numerik (0 – 100) *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                required
                value={inputSkor}
                onChange={(e) => setInputSkor(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Contoh: 90"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Umpan Balik (Feedback) Evaluasi
              </label>
              <textarea
                rows={3}
                value={inputFeedback}
                onChange={(e) => setInputFeedback(e.target.value)}
                placeholder="Catatan koreksi, apresiasi, atau arahan perbaikan langkah penyelesaian..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Nilai</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
