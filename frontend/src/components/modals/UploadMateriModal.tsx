'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2, Loader2, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Materi, MateriFormat, Kelas } from '../../types/lms';
import { uploadMateriGuru, updateMateriGuru } from '../../services/guruService';

interface UploadMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  kelasList: Kelas[];
  currentBidangStudi: string;
  initialData?: Materi | null;
  onSaveMateri: (newMateri: Materi) => void;
}

export const UploadMateriModal: React.FC<UploadMateriModalProps> = ({
  isOpen,
  onClose,
  kelasList,
  currentBidangStudi,
  initialData = null,
  onSaveMateri,
}) => {
  const isEditMode = Boolean(initialData && initialData.id_materi);

  const [judul, setJudul] = useState('');
  const [idKelas, setIdKelas] = useState(kelasList[0]?.id_kelas || '');
  const [deskripsi, setDeskripsi] = useState('');
  const [formatFile, setFormatFile] = useState<MateriFormat>('PDF');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedFileName, setSimulatedFileName] = useState('');
  const [fileSize, setFileSize] = useState('3.8 MB');
  const [externalUrl, setExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setJudul(initialData.judul_materi || '');
        setIdKelas(initialData.id_kelas || kelasList[0]?.id_kelas || '');
        setDeskripsi(initialData.deskripsi || '');
        setFormatFile(initialData.format_file || 'PDF');
        setSelectedFile(null);
        setSimulatedFileName('');
        setFileSize(initialData.file_size || '3.5 MB');
        setExternalUrl(initialData.format_file === 'LINK' ? initialData.file_url || '' : '');
      } else {
        setJudul('');
        setIdKelas(kelasList[0]?.id_kelas || '');
        setDeskripsi('');
        setFormatFile('PDF');
        setSelectedFile(null);
        setSimulatedFileName('');
        setFileSize('3.8 MB');
        setExternalUrl('');
      }
    }
  }, [isOpen, initialData, kelasList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judul.trim()) {
      toast.error('Judul materi pembelajaran wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const kelasObj = kelasList.find((k) => k.id_kelas === idKelas) || kelasList[0];
    const parsedSize = parseFloat(fileSize) || 3.5;
    const computedFileUrl =
      formatFile === 'LINK' && externalUrl.trim()
        ? externalUrl.trim()
        : simulatedFileName
          ? `/uploads/materi/${simulatedFileName}`
          : initialData?.file_url ||
            `https://storage.sman2padalarang.sch.id/materi/berkas_materi_ajar.${formatFile.toLowerCase()}`;

    try {
      let savedMateri: Materi;

      if (isEditMode && initialData) {
        const res = await updateMateriGuru(initialData.id_materi, {
          judul: judul.trim(),
          deskripsi: deskripsi,
          tipe: formatFile.toLowerCase(),
          tipe_file: formatFile,
          ukuran_mb: parsedSize,
          file_url: computedFileUrl,
          kelas_id: kelasObj?.id_kelas || idKelas,
          mapel_id: initialData.id_mapel,
          file: selectedFile,
        });

        const serverData = (res as any)?.data;
        savedMateri = {
          id_materi: serverData?.id || initialData.id_materi,
          id_guru: serverData?.guru_id || initialData.id_guru,
          id_mapel: serverData?.mapel_id || initialData.id_mapel,
          nama_mapel: initialData.nama_mapel || currentBidangStudi,
          id_kelas: serverData?.kelas_id || kelasObj?.id_kelas || idKelas,
          nama_kelas: kelasObj?.nama_kelas || initialData.nama_kelas || 'XII IPA 1',
          judul_materi: serverData?.judul || judul.trim(),
          deskripsi: serverData?.deskripsi !== undefined ? serverData.deskripsi : deskripsi,
          format_file: (serverData?.tipe_file || formatFile) as MateriFormat,
          file_url: serverData?.file_url || computedFileUrl,
          file_size: serverData?.ukuran_mb ? `${serverData.ukuran_mb} MB` : fileSize,
          unduhan_count: serverData?.jumlah_melihat ?? initialData.unduhan_count ?? 0,
          tanggal_unggah: serverData?.created_at ? serverData.created_at.split('T')[0] : (initialData.tanggal_unggah || new Date().toISOString().split('T')[0]),
        };
        toast.success('Materi pembelajaran berhasil diperbarui');
      } else {
        const res = await uploadMateriGuru({
          judul: judul.trim(),
          deskripsi: deskripsi,
          tipe: formatFile.toLowerCase(),
          tipe_file: formatFile,
          ukuran_mb: parsedSize,
          file_url: computedFileUrl,
          kelas_id: kelasObj?.id_kelas || idKelas,
          file: selectedFile,
        });

        const serverData = (res as any)?.data;
        savedMateri = {
          id_materi: serverData?.id || `mat-${Date.now()}`,
          id_guru: serverData?.guru_id || '298257fb-b4aa-4710-afaa-bbfd63abd5c5',
          id_mapel: serverData?.mapel_id || '1ca770d9-0e57-471b-95c2-aedc472da0b9',
          nama_mapel: currentBidangStudi,
          id_kelas: serverData?.kelas_id || kelasObj?.id_kelas || idKelas,
          nama_kelas: kelasObj?.nama_kelas || 'XII IPA 1',
          judul_materi: serverData?.judul || judul.trim(),
          deskripsi: serverData?.deskripsi !== undefined ? serverData.deskripsi : deskripsi,
          format_file: (serverData?.tipe_file || formatFile) as MateriFormat,
          file_url: serverData?.file_url || computedFileUrl,
          file_size: serverData?.ukuran_mb ? `${serverData.ukuran_mb} MB` : fileSize,
          unduhan_count: serverData?.jumlah_melihat ?? 0,
          tanggal_unggah: serverData?.created_at ? serverData.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
        };
        toast.success('Materi pembelajaran berhasil diunggah ke Supabase');
      }

      onSaveMateri(savedMateri);
      onClose();
    } catch (err) {
      console.error('Error saat menyimpan materi ke Supabase:', err);
      const fallbackMateri: Materi = {
        id_materi: initialData?.id_materi || `mat-${Date.now()}`,
        id_guru: initialData?.id_guru || '298257fb-b4aa-4710-afaa-bbfd63abd5c5',
        id_mapel: initialData?.id_mapel || '1ca770d9-0e57-471b-95c2-aedc472da0b9',
        nama_mapel: initialData?.nama_mapel || currentBidangStudi,
        id_kelas: kelasObj?.id_kelas || idKelas || '',
        nama_kelas: kelasObj?.nama_kelas || initialData?.nama_kelas || 'XII IPA 1',
        judul_materi: judul.trim(),
        deskripsi: deskripsi,
        format_file: formatFile,
        file_url: computedFileUrl,
        file_size: fileSize,
        unduhan_count: initialData?.unduhan_count || 0,
        tanggal_unggah: initialData?.tanggal_unggah || new Date().toISOString().split('T')[0],
      };
      onSaveMateri(fallbackMateri);
      toast.error('Terjadi kesalahan koneksi, menyimpan ke memori lokal');
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
              {isEditMode ? 'Edit Materi Pembelajaran' : 'Upload Materi Pembelajaran Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              {isEditMode
                ? 'Perbarui judul, target kelas, deskripsi, atau ganti berkas lampiran materi'
                : `Mata Pelajaran: ${currentBidangStudi} • Tersambung ke Supabase Storage`}
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

        {formatFile === 'LINK' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tautan / URL Materi Eksternal *
            </label>
            <input
              type="url"
              required
              placeholder="https://youtube.com/... atau https://drive.google.com/..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isEditMode ? 'Ganti Lampiran Berkas (Opsional)' : 'Lampiran Berkas Materi'}
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center bg-slate-50 hover:bg-blue-50/30 transition-colors cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <p className="text-xs font-semibold text-slate-700">
                {isEditMode
                  ? 'Pilih berkas baru jika ingin mengganti dokumen sebelumnya'
                  : 'Pilih berkas dari komputer atau seret ke sini'}
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.pptx,.mp4"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const f = e.target.files[0];
                    setSelectedFile(f);
                    setSimulatedFileName(f.name);
                    const mb = Math.max(0.1, Number((f.size / (1024 * 1024)).toFixed(1)));
                    setFileSize(`${mb} MB`);
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
        )}

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
                <span>Menyimpan...</span>
              </>
            ) : isEditMode ? (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
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
