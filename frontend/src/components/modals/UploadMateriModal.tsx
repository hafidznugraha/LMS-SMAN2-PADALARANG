'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Materi, MateriFormat, Kelas } from '../../types/lms';
import { uploadMateriGuru } from '../../services/guruService';

interface UploadMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  currentBidangStudi: string;
  onSaveMateri: (newMateri: Omit<Materi, 'id_materi' | 'tanggal_unggah' | 'unduhan_count'>) => void;
}

export const UploadMateriModal: React.FC<UploadMateriModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentBidangStudi,
  onSaveMateri,
}) => {
  const [judul, setJudul] = useState('');
  const [idKelas, setIdKelas] = useState(kelasList[0]?.id_kelas || '');
  const [deskripsi, setDeskripsi] = useState('');
  const [formatFile, setFormatFile] = useState<MateriFormat>('PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [fileSize, setFileSize] = useState('3.8 MB');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;

    setIsSubmitting(true);
    const kelasObj = kelasList.find((k) => k.id_kelas === idKelas) || kelasList[0];

    try {
      // 1. KIRIM DATA KE SUPABASE VIA BACKEND GOLANG
      const res = await uploadMateriGuru({
        judul: judul,
        deskripsi: deskripsi,
        tipe: formatFile.toLowerCase(),
        tipe_file: formatFile,
        ukuran_mb: parseFloat(fileSize) || 3.5,
        file_url: `https://storage.sman2padalarang.sch.id/materi/${simulatedFileName || 'berkas_materi_ajar'}.${formatFile.toLowerCase()}`,
        kelas_id: kelasObj?.id_kelas,
        file: selectedFile,
      });

      console.log('Respon simpan Supabase:', res);

      // 2. PERBARUI TAMPILAN DI LAYAR FRONTEND
      onSaveMateri({
        id_guru: 'guru-irma-01',
        id_mapel: 'mapel-mat-pem',
        nama_mapel: currentBidangStudi,
        id_kelas: kelasObj?.id_kelas || '',
        nama_kelas: kelasObj?.nama_kelas || 'XII IPA 1',
        judul_materi: judul,
        deskripsi: deskripsi,
        format_file: formatFile,
        file_url: `https://storage.sman2padalarang.sch.id/materi/${simulatedFileName || 'berkas_materi_ajar'}.${formatFile.toLowerCase()}`,
        file_size: fileSize,
      });

      alert('Berhasil! Materi telah berhasil diunggah dan disimpan ke Supabase.');
      onClose();
    } catch (err) {
      console.error('Error saat menyimpan ke Supabase:', err);
      // Tetap perbarui UI lokal jika backend sedang tidak tersambung
      onSaveMateri({
        id_guru: 'guru-irma-01',
        id_mapel: 'mapel-mat-pem',
        nama_mapel: currentBidangStudi,
        id_kelas: kelasObj?.id_kelas || '',
        nama_kelas: kelasObj?.nama_kelas || 'XII IPA 1',
        judul_materi: judul,
        deskripsi: deskripsi,
        format_file: formatFile,
        file_url: `https://storage.sman2padalarang.sch.id/materi/${simulatedFileName || 'berkas_materi_ajar'}.${formatFile.toLowerCase()}`,
        file_size: fileSize,
      });
      alert('Materi tersimpan di tampilan lokal! (Catatan: Pastikan backend Golang aktif di terminal agar masuk ke Supabase).');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Upload Materi Pembelajaran Baru
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
            Judul Materi Pembelajaran *
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Bab 3 - Aplikasi Turunan Pertama dan Garis Singgung"
            value={judul}
            onChange={(e) => setJudul(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Rombel / Kelas *
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
              Format Berkas *
            </label>
            <select
              value={formatFile}
              onChange={(e) => setFormatFile(e.target.value as MateriFormat)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="PDF">PDF (Dokumen / Modul)</option>
              <option value="MP4">MP4 (Video Pembelajaran)</option>
              <option value="PPTX">PPTX (Slide Presentasi)</option>
              <option value="DOCX">DOCX (Rangkuman & Latihan)</option>
              <option value="LINK">LINK (URL Eksternal)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Deskripsi & Arahan Belajar Siswa
          </label>
          <textarea
            rows={3}
            placeholder="Tuliskan petunjuk pengerjaan atau ringkasan topik materi..."
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          ></textarea>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Lampiran Berkas Materi
          </label>
          <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
            <p className="text-xs font-semibold text-slate-700">
              Pilih berkas dari komputer atau seret ke sini
            </p>
            <input
              type="file"
              accept=".pdf,.docx,.pptx,.mp4"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  setSelectedFile(f);
                  setSimulatedFileName(f.name);
                  setFileSize(`${(f.size / (1024 * 1024)).toFixed(1)} MB`);
                  const ext = f.name.split('.').pop()?.toUpperCase();
                  if (ext === 'PDF' || ext === 'MP4' || ext === 'PPTX' || ext === 'DOCX') {
                    setFormatFile(ext as MateriFormat);
                  }
                }
              }}
              className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer"
            />
          </div>
          {simulatedFileName && (
            <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Berkas terpilih: {simulatedFileName} ({fileSize})
            </p>
          )}
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
                <Upload className="w-3.5 h-3.5" />
                <span>Terbitkan Materi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};