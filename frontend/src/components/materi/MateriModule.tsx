'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Upload, 
  Search, 
  Filter, 
  FileText, 
  Video, 
  FileSpreadsheet, 
  ExternalLink, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  X,
  FileCode
} from 'lucide-react';
import { Materi, MateriFormat, Kelas } from '../../types/lms';

interface MateriModuleProps {
  materiList?: Materi[];
  kelasList?: Kelas[];
  onUploadMateri: () => void;
  onEditMateri?: (materi: Materi) => void;
  onDeleteMateri?: (id: string) => void;
  onDownloadMateri?: (materi: Materi) => void;
}

export const MateriModule: React.FC<MateriModuleProps> = ({
  materiList = [],
  kelasList = [],
  onUploadMateri,
  onEditMateri = () => {},
  onDeleteMateri = () => {},
  onDownloadMateri = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [previewMateri, setPreviewMateri] = useState<Materi | null>(null);

  // Filter materi berdasarkan pencarian, kelas, dan format
  const filteredMateri = (materiList || []).filter((m) => {
    const matchesSearch =
      (m?.judul_materi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m?.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKelas = selectedKelas === 'ALL' || m?.id_kelas === selectedKelas;
    const matchesFormat = selectedFormat === 'ALL' || m?.format_file === selectedFormat;
    const isNotDeleted = !m?.deleted_at;
    return matchesSearch && matchesKelas && matchesFormat && isNotDeleted;
  });

  const getFormatIcon = (format: MateriFormat) => {
    switch (format) {
      case 'PDF':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'MP4':
        return <Video className="w-5 h-5 text-sky-500" />;
      case 'PPTX':
        return <FileSpreadsheet className="w-5 h-5 text-amber-500" />;
      case 'DOCX':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'LINK':
        return <ExternalLink className="w-5 h-5 text-emerald-500" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Modul Materi Pembelajaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola dan distribusikan bahan ajar digital (PDF, PPT, DOCX, Video MP4) untuk siswa per rombel
          </p>
        </div>

        <button
          onClick={onUploadMateri}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Materi Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari materi berdasarkan judul atau topik pembahasan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {(kelasList || []).map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="text-xs font-semibold bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Format</option>
                <option value="PDF">PDF Dokumen</option>
                <option value="MP4">Video MP4</option>
                <option value="PPTX">Slide PPTX</option>
                <option value="DOCX">Word DOCX</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Materi List Grid */}
      {filteredMateri.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">Tidak ada materi ditemukan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Tidak ada materi yang sesuai dengan pencarian atau filter kelas ini. Anda dapat mengunggah berkas baru.
          </p>
          <button
            onClick={onUploadMateri}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Upload Bahan Ajar Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredMateri.map((materi) => (
            <div
              key={materi.id_materi}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {getFormatIcon(materi.format_file)}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-bold">
                        {materi.nama_kelas}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2 font-mono">
                        {materi.format_file} • {materi.file_size || '3.5 MB'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono">
                    {materi.tanggal_unggah ? materi.tanggal_unggah.split(' ')[0] : '2026-11-05'}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {materi.judul_materi}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {materi.deskripsi}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span>{materi.unduhan_count || 0} siswa telah mengunduh</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewMateri(materi)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Pratinjau Materi"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDownloadMateri(materi)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditMateri(materi)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteMateri(materi.id_materi)}
                    className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Hapus (Soft Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Online Viewer / Pratinjau Interaktif Dokumen */}
      {previewMateri && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  {getFormatIcon(previewMateri.format_file)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {previewMateri.judul_materi}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kelas {previewMateri.nama_kelas} • {previewMateri.nama_mapel} • Guru: Bu Irma Satikarama
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewMateri(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewer Layar Dokumen / Slide Presentasi */}
            <div className="bg-slate-900 rounded-2xl p-6 text-white min-h-[220px] flex flex-col justify-between border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs text-slate-400">
                <span className="font-mono bg-blue-900/40 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-700/50">
                  Pratinjau Dokumen {previewMateri.format_file}
                </span>
                <span>Ukuran: {previewMateri.file_size || '3.5 MB'}</span>
              </div>

              <div className="my-6 text-center space-y-2">
                <div className="w-12 h-12 bg-blue-600/20 text-blue-400 rounded-2xl mx-auto flex items-center justify-center mb-3">
                  {getFormatIcon(previewMateri.format_file)}
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">
                  {previewMateri.judul_materi}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Bahan ajar digital terverifikasi SMAN 2 Padalarang. Siswa dapat membaca petunjuk atau mengunduh dokumen secara lengkap.
                </p>
              </div>

              <div className="bg-slate-800/80 rounded-xl p-3 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Status: Siap diunduh dan dipelajari</span>
                <span className="text-emerald-400 font-semibold">● Terhubung Supabase</span>
              </div>
            </div>

            {/* Deskripsi Materi */}
            <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-700 space-y-1">
              <p className="font-bold text-slate-900">Deskripsi & Arahan Belajar Siswa:</p>
              <p className="leading-relaxed">
                {previewMateri.deskripsi || 'Tidak ada catatan tambahan untuk materi ini.'}
              </p>
            </div>

            {/* Tombol Aksi Unduh dan Tutup */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  onDownloadMateri(previewMateri);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Berkas Sekarang ({previewMateri.file_size || '3.5 MB'})</span>
              </button>
              <button
                onClick={() => setPreviewMateri(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 