'use client';

import React, { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { TugasKuis, JenisPenugasan, Kelas } from '../../types/lms';
import { createTugasGuru } from '../../services/guruService';

interface CreateTugasModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  currentBidangStudi: string;
  onSaveTugas: (newTugas: Omit<TugasKuis, 'id_tugas_kuis' | 'total_siswa' | 'jumlah_mengumpulkan' | 'jumlah_dinilai'>) => void;
}

export const CreateTugasModal: React.FC<CreateTugasModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentBidangStudi,
  onSaveTugas,
}) => {
  const [judul, setJudul] = useState('');
  const [idKelas, setIdKelas] = useState(kelasList[0]?.id_kelas || '');
  const [jenis, setJenis] = useState<JenisPenugasan>('Tugas');
  const [tenggatWaktu, setTenggatWaktu] = useState('2026-11-10 23:59:00');
  const [formatFile, setFormatFile] = useState('pdf, docx');
  const [instruksi, setInstruksi] = useState('');
  const [rubrik, setRubrik] = useState(
    '1. Ketepatan konsep matematis (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;

    setIsSubmitting(true);
    const kelasObj = kelasList.find((k) => k.id_kelas === idKelas) || kelasList[0];

    try {
      // 1. KIRIM DATA KE SUPABASE VIA BACKEND GOLANG
      const res = await createTugasGuru({
        judul: judul,
        deskripsi: instruksi || 'Kerjakan tugas sesuai rubrik penilaian',
        deadline: tenggatWaktu,
        file_lampiran: formatFile,
        kelas_id: kelasObj?.id_kelas,
      });

      console.log('Respon simpan Tugas Supabase:', res);

      // 2. PERBARUI TAMPILAN DI FRONTEND
      onSaveTugas({
        id_guru: 'guru-irma-01',
        id_mapel: 'mapel-mat-pem',
        nama_mapel: currentBidangStudi,
        id_kelas: kelasObj?.id_kelas || '',
        nama_kelas: kelasObj?.nama_kelas || 'XII IPA 1',
        judul,
        jenis,
        tenggat_waktu: tenggatWaktu,
        format_file: formatFile,
        rubrik_penilaian: rubrik,
        instruksi,
      });

      alert('Berhasil! Tugas baru berhasil disimpan ke Supabase.');
      onClose();
    } catch (err) {
      console.error('Error saat menyimpan tugas ke Supabase:', err);
      // Tetap update UI lokal
      onSaveTugas({
        id_guru: 'guru-irma-01',
        id_mapel: 'mapel-mat-pem',
        nama_mapel: currentBidangStudi,
        id_kelas: kelasObj?.id_kelas || '',
        nama_kelas: kelasObj?.nama_kelas || 'XII IPA 1',
        judul,
        jenis,
        tenggat_waktu: tenggatWaktu,
        format_file: formatFile,
        rubrik_penilaian: rubrik,
        instruksi,
      });
      alert('Tugas tersimpan di tampilan lokal! Pastikan backend Golang aktif di terminal.');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Penerbitan Tugas / Kuis Baru
            </h3>
            <p className="text-xs text-slate-500">
              Tersambung ke Supabase Cloud • Guru: Ibu Irma Satikarama
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
            Judul Tugas / Kuis *
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Latihan Soal Teorema Limit dan Bentuk Tak Tentu"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Kelas *
            </label>
            <select
              value={idKelas}
              onChange={(e) => setIdKelas(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {kelasList.map((k) => (
                <option key={k.id_kelas} value={k.id_kelas}>
                  Kelas {k.nama_kelas}
                </option>
              ))}
            </select>
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
              <option value="Kuis">Kuis Daring</option>
              <option value="Proyek">Proyek Praktikum</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tenggat Waktu (Deadline) *
            </label>
            <input
              type="text"
              required
              placeholder="YYYY-MM-DD HH:mm:ss"
              value={tenggatWaktu}
              onChange={(e) => setTenggatWaktu(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Format Berkas Diizinkan
            </label>
            <input
              type="text"
              placeholder="pdf, docx, zip, jpg"
              value={formatFile}
              onChange={(e) => setFormatFile(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
            />
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
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan ke Supabase...</span>
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