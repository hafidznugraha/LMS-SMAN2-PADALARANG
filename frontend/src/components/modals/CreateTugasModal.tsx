'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Loader2,
  Edit3,
  Calendar,
  FileText,
  Image,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { TugasKuis, JenisPenugasan, Kelas } from '../../types/lms';
import { createTugasGuru, updateTugasGuru } from '../../services/guruService';
import { getStoredUser } from '@/lib/auth';

interface CreateTugasModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  currentBidangStudi: string;
  onSaveTugas: (savedTugas: TugasKuis) => void;
  initialData?: TugasKuis | null;
  lockedKelasId?: string;
}

interface FormatOption {
  id: string;
  label: string;
  extensions: string[];
  badge: string;
  iconDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILE_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    label: 'Dokumen PDF',
    extensions: ['pdf'],
    badge: '.pdf',
    iconDesc: 'Scan / Lembar Dokumen',
    icon: FileText,
  },
  {
    id: 'word',
    label: 'Microsoft Word',
    extensions: ['docx', 'doc'],
    badge: '.docx',
    iconDesc: 'Makalah / Laporan Ketik',
    icon: FileText,
  },
  {
    id: 'image',
    label: 'Foto / Gambar',
    extensions: ['jpg', 'jpeg', 'png'],
    badge: '.jpg, .png',
    iconDesc: 'Foto Buku Catatan Manual',
    icon: Image,
  },
  {
    id: 'excel',
    label: 'Microsoft Excel',
    extensions: ['xlsx', 'xls'],
    badge: '.xlsx',
    iconDesc: 'Tabel & Analisis Angka',
    icon: FileSpreadsheet,
  },
  {
    id: 'ppt',
    label: 'Presentasi PPT',
    extensions: ['pptx', 'ppt'],
    badge: '.pptx',
    iconDesc: 'Slide Tugas Kelompok',
    icon: Presentation,
  },
  {
    id: 'zip',
    label: 'Arsip ZIP / RAR',
    extensions: ['zip', 'rar'],
    badge: '.zip',
    iconDesc: 'Proyek / Multi-berkas',
    icon: FileArchive,
  },
];

function parseFormatStringToIds(formatStr?: string): string[] {
  if (!formatStr) return ['pdf', 'word'];
  const clean = formatStr.toLowerCase();
  const matched = new Set<string>();

  if (clean.includes('pdf')) matched.add('pdf');
  if (clean.includes('doc')) matched.add('word');
  if (
    clean.includes('jpg') ||
    clean.includes('jpeg') ||
    clean.includes('png') ||
    clean.includes('gambar') ||
    clean.includes('foto')
  ) {
    matched.add('image');
  }
  if (clean.includes('xls')) matched.add('excel');
  if (clean.includes('ppt')) matched.add('ppt');
  if (clean.includes('zip') || clean.includes('rar')) matched.add('zip');

  return matched.size > 0 ? Array.from(matched) : ['pdf', 'word'];
}

function getFormatStringFromIds(ids: string[]): string {
  const exts: string[] = [];
  ids.forEach((id) => {
    const opt = FILE_FORMAT_OPTIONS.find((o) => o.id === id);
    if (opt) {
      exts.push(...opt.extensions);
    }
  });
  return exts.join(', ');
}

function getDefaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T23:59`;
}

function toDateTimeLocalValue(dateStr?: string): string {
  if (!dateStr) return getDefaultDeadline();
  const clean = dateStr.trim();
  if (clean.includes('T')) {
    return clean.slice(0, 16);
  }
  if (clean.includes(' ')) {
    const [d, t] = clean.split(' ');
    const timePart = t ? t.slice(0, 5) : '23:59';
    return `${d}T${timePart}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return `${clean}T23:59`;
  }
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  return getDefaultDeadline();
}

function toBackendDeadline(val: string): string {
  if (!val) return '';
  if (val.includes('T')) {
    const [d, t] = val.split('T');
    const timePart = t.length === 5 ? `${t}:00` : t;
    return `${d} ${timePart}`;
  }
  return val;
}

export const CreateTugasModal: React.FC<CreateTugasModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentBidangStudi,
  onSaveTugas,
  initialData,
  lockedKelasId,
}) => {
  const isEditMode = !!initialData;
  const [judul, setJudul] = useState('');
  const [idKelas, setIdKelas] = useState(lockedKelasId || kelasList[0]?.id_kelas || '');
  const [jenis, setJenis] = useState<JenisPenugasan>('Tugas');
  const [tenggatWaktu, setTenggatWaktu] = useState(getDefaultDeadline);
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>(['pdf', 'word']);
  const [instruksi, setInstruksi] = useState('');
  const [rubrik, setRubrik] = useState(
    '1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setTenggatWaktu(`${year}-${month}-${day}T23:59`);
  };

  const toggleFormatId = (id: string) => {
    setSelectedFormatIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) {
          toast.warning('Pilih minimal 1 format berkas yang diizinkan');
          return prev;
        }
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const now = new Date();
  const minDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  useEffect(() => {
    if (initialData) {
      setJudul(initialData.judul || '');
      setIdKelas(
        initialData.id_kelas ||
        (initialData as unknown as { kelas_id?: string }).kelas_id ||
        lockedKelasId ||
        kelasList[0]?.id_kelas ||
        ''
      );
      setJenis(initialData.jenis || 'Tugas');
      setTenggatWaktu(
        toDateTimeLocalValue(
          initialData.tenggat_waktu ||
          (initialData as unknown as { deadline?: string }).deadline
        )
      );
      setSelectedFormatIds(
        parseFormatStringToIds(initialData.format_file)
      );
      setInstruksi(
        initialData.instruksi ||
        (initialData as unknown as { deskripsi?: string }).deskripsi ||
        ''
      );
      setRubrik(
        initialData.rubrik_penilaian ||
        '1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)'
      );
    } else {
      setJudul('');
      setIdKelas(lockedKelasId || kelasList[0]?.id_kelas || '');
      setJenis('Tugas');
      setTenggatWaktu(getDefaultDeadline());
      setSelectedFormatIds(['pdf', 'word']);
      setInstruksi('');
      setRubrik(
        '1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)'
      );
    }
  }, [initialData, kelasList, isOpen, lockedKelasId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      toast.error('Judul tugas wajib diisi');
      return;
    }

    if (kelasList.length === 0 || !idKelas) {
      toast.error('Belum ada rombel/kelas yang dijadwalkan oleh Kurikulum');
      return;
    }

    if (!tenggatWaktu) {
      toast.error('Tenggat waktu (deadline) wajib ditentukan');
      return;
    }

    const selectedTime = new Date(tenggatWaktu).getTime();
    if (isNaN(selectedTime)) {
      toast.error('Format tanggal dan jam tenggat waktu tidak valid');
      return;
    }

    if (!isEditMode && selectedTime <= Date.now()) {
      toast.error('Tenggat waktu harus di masa depan (tidak boleh waktu lampau)');
      return;
    }

    if (selectedFormatIds.length === 0) {
      toast.error('Pilih minimal satu format berkas yang diizinkan');
      return;
    }

    setIsSubmitting(true);
    const kelasObj = kelasList.find((k) => k.id_kelas === idKelas) || kelasList[0];
    const user = getStoredUser();
    const tugasId =
      initialData?.id_tugas_kuis ||
      (initialData as unknown as { id?: string })?.id;

    const formattedDeadline = toBackendDeadline(tenggatWaktu);
    const compiledFormatFile = getFormatStringFromIds(selectedFormatIds);

    try {
      if (isEditMode && tugasId) {
        const res = await updateTugasGuru(tugasId, {
          judul: judul.trim(),
          deskripsi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          instruksi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          jenis,
          deadline: formattedDeadline,
          tenggat_waktu: formattedDeadline,
          format_file: compiledFormatFile,
          rubrik_penilaian: rubrik,
          kelas_id: kelasObj?.id_kelas,
        });

        if (res?.success && res.data) {
          onSaveTugas(res.data);
          toast.success('Tugas berhasil diperbarui di Supabase');
          onClose();
        } else {
          toast.error(res?.message || 'Gagal memperbarui tugas');
        }
      } else {
        const res = await createTugasGuru({
          judul: judul.trim(),
          deskripsi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          instruksi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          jenis,
          deadline: formattedDeadline,
          tenggat_waktu: formattedDeadline,
          format_file: compiledFormatFile,
          rubrik_penilaian: rubrik,
          kelas_id: kelasObj?.id_kelas,
          guru_id: user?.extra?.guru_id,
          mapel_id: user?.extra?.mapel_id || (user?.extra?.mapel as { id?: string })?.id,
        });

        if (res?.success && res.data) {
          onSaveTugas(res.data);
          toast.success('Tugas baru berhasil diterbitkan dan disimpan ke database');
          onClose();
        } else {
          toast.error(res?.message || 'Gagal menerbitkan tugas');
        }
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan tugas ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              {isEditMode ? (
                <>
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Edit Tugas</span>
                </>
              ) : (
                <span>Penerbitan Tugas Baru</span>
              )}
            </h3>
            <p className="text-xs text-slate-500">
              Mata Pelajaran: {currentBidangStudi}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Judul Tugas *
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Latihan Soal Algoritma dan Pemrograman"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {kelasList.length === 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Anda belum memiliki jadwal mengajar resmi dari Kurikulum. Hubungi bagian kurikulum untuk plotting jadwal KBM.</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Kelas *
            </label>
            {lockedKelasId ? (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50/90 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-1.5 truncate">
                  <Lock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span className="text-xs font-bold text-blue-950 truncate">
                    Kelas {kelasList.find((k) => k.id_kelas === idKelas)?.nama_kelas || idKelas}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 shrink-0 ml-1">
                  Terkunci
                </span>
              </div>
            ) : (
              <select
                value={idKelas}
                onChange={(e) => setIdKelas(e.target.value)}
                disabled={kelasList.length === 0}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {kelasList.length === 0 ? (
                  <option value="">Belum ada kelas terjadwal</option>
                ) : (
                  kelasList.map((k) => (
                    <option key={k.id_kelas} value={k.id_kelas}>
                      Kelas {k.nama_kelas}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tipe Asesmen *
            </label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as JenisPenugasan)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="Tugas">Tugas Terstruktur</option>
              <option value="Proyek">Proyek Praktikum</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-900" />
              <span>Tenggat Waktu (Deadline) *</span>
            </label>
            <span className="text-[10px] text-slate-400 font-medium">WIB</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <input
              type="datetime-local"
              required
              min={isEditMode ? undefined : minDateTime}
              value={tenggatWaktu}
              onChange={(e) => setTenggatWaktu(e.target.value)}
              className="w-full sm:max-w-xs px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Pintas:</span>
              <button
                type="button"
                onClick={() => setPresetDays(3)}
                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                +3 Hari
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(7)}
                className="px-2 py-1 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors cursor-pointer"
              >
                +1 Minggu
              </button>
              <button
                type="button"
                onClick={() => setPresetDays(14)}
                className="px-2 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                +2 Minggu
              </button>
            </div>
          </div>
        </div>

        {/* Format Berkas yang Diizinkan (Checkbox Card Grid) */}
        <div className="pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
            <div>
              <label className="block text-xs font-bold text-slate-800">
                Format Berkas yang Diizinkan Siswa *
              </label>
              <p className="text-[11px] text-slate-500">
                Pilih jenis berkas yang boleh dikumpulkan siswa
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Pilihan cepat:</span>
              <button
                type="button"
                onClick={() => setSelectedFormatIds(['pdf', 'word'])}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                Standar (PDF & Word)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormatIds(['pdf', 'word', 'image'])}
                className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors cursor-pointer"
              >
                + Foto Buku
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormatIds(FILE_FORMAT_OPTIONS.map((o) => o.id))}
                className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                Semua Format
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {FILE_FORMAT_OPTIONS.map((opt) => {
              const isSelected = selectedFormatIds.includes(opt.id);
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => toggleFormatId(opt.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleFormatId(opt.id)}
                    className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-700' : 'text-slate-500'}`} />
                      <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-950' : 'text-slate-800'}`}>
                        {opt.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-white/80 border border-slate-200/80 text-slate-600">
                        {opt.badge}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {opt.iconDesc}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Instruksi & Arahan Pengerjaan *
          </label>
          <textarea
            rows={3}
            required
            placeholder="Tuliskan petunjuk pengerjaan soal, langkah sistematis yang diharapkan, dan ketentuan upload..."
            value={instruksi}
            onChange={(e) => setInstruksi(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Rubrik Penilaian
          </label>
          <textarea
            rows={3}
            value={rubrik}
            onChange={(e) => setRubrik(e.target.value)}
            placeholder="Kriteria penskoran persentase nilai..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono leading-relaxed"
          ></textarea>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || kelasList.length === 0}
            className="px-5 py-2 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan ke Supabase...</span>
              </>
            ) : isEditMode ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Terbitkan Tugas</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
