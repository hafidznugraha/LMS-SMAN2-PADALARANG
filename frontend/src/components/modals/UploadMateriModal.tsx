'use client';

import React, { useState } from 'react';
import { X, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { Materi, MateriFormat, Kelas } from '../../types/lms';

interface UploadMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  currentBidangStudi: string;
  onSaveMateri: (newMateri: any) => void;
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
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [fileSize, setFileSize] = useState('3.5 MB');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) return;

    setIsSubmitting(true);
    const kelasObj = kelasList.find((k) => k.id_kelas === idKelas) || kelasList[0];

    try {
      // 1. TEMBAK LANGSUNG KE BACKEND GOLANG DENGAN KOLOM SESUAI ENTITY.GO
      const res = await fetch('http://localhost:8080/api/v1/guru/materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guru_id: '298257fb-b4aa-4710-afaa-bbfd63abd5c5', // Bu Irma
          mapel_id: '20000000-0000-0000-0000-000000000001', // Matematika Peminatan
          kelas_id: kelasObj?.id_kelas || 'f0000000-0000-0000-0000-000000000001',
          judul: judul,
          deskripsi: deskripsi || 'Bahan ajar Matematika Peminatan',
          tipe_file: formatFile,
          ukuran_mb: parseFloat(fileSize) || 3.5,
          file_url: `https://storage.sman2padalarang.sch.id/materi/${simulatedFileName || 'berkas_materi'}.${formatFile.toLowerCase()}`,
        }),
      });

      const json = await res.json();
      console.log('Respon Backend Supabase:', json);

      if (json.success) {
        alert('BERHASIL! Materi baru telah disimpan ke Supabase.');
        onSaveMateri(json.data); // Panggil refresh di halaman
        onClose();
      } else {
        alert('Gagal dari backend: ' + json.message);
      }
    } catch (err: any) {
      console.error('Koneksi backend gagal:', err);
      alert('Gagal menghubungi backend di port 8080. Pastikan go run cmd/api/main.go sedang menyala di terminal!');
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
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSimulatedFileName(e.target.files[0].name);
                  setFileSize(`${(e.target.files[0].size / (1024 * 1024)).toFixed(1)} MB`);
                }
              }}
              className="mt-2 text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
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
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
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