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
  FileCode,
  Maximize2,
  Minimize2,
  Loader2,
} from 'lucide-react';
import { Materi, MateriFormat, Kelas } from '../../types/lms';

interface MateriModuleProps {
  materiList?: Materi[];
  kelasList?: Kelas[];
  readOnly?: boolean;
  onUploadMateri?: () => void;
  onEditMateri?: (materi: Materi) => void;
  onDeleteMateri?: (id: string, judul?: string) => void;
  onDownloadMateri?: (materi: Materi) => void;
}

export const MateriModule: React.FC<MateriModuleProps> = ({
  materiList = [],
  kelasList = [],
  readOnly = false,
  onUploadMateri = () => {},
  onEditMateri = () => {},
  onDeleteMateri = () => {},
  onDownloadMateri = () => {},
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [previewMateri, setPreviewMateri] = useState<Materi | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(true);

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

  const getEffectiveFileUrl = (materi: Materi): string => {
    let url = materi.file_url || '';
    if (!url || url.includes('storage.sman2padalarang.sch.id') || (!url.startsWith('http') && materi.id_materi)) {
      return `/api/v1/materi/${encodeURIComponent(materi.id_materi)}/download?inline=true`;
    }
    return url;
  };

  const getYouTubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {readOnly ? 'Materi Pembelajaran' : 'Modul Materi Pembelajaran'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {readOnly
              ? 'Pelajari dan unduh bahan ajar digital (PDF, PPT, DOCX, Video MP4) dari guru mata pelajaran'
              : 'Kelola dan distribusikan bahan ajar digital (PDF, PPT, DOCX, Video MP4) untuk siswa per rombel'}
          </p>
        </div>

        {!readOnly && (
          <button
            type="button"
            onClick={onUploadMateri}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#142d72] hover:bg-[#1a388f] text-white text-sm font-semibold transition-all shadow-sm cursor-pointer self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Materi Baru</span>
          </button>
        )}
      </div>

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
                <option value="LINK">Tautan LINK</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {filteredMateri.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">Tidak ada materi ditemukan</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {readOnly
              ? 'Tidak ada materi yang sesuai dengan pencarian atau filter kelas ini.'
              : 'Tidak ada materi yang sesuai dengan pencarian atau filter kelas ini. Anda dapat mengunggah berkas baru.'}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={onUploadMateri}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Materi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMateri.map((materi) => (
            <div
              key={materi.id_materi}
              className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                    Kelas {materi.nama_kelas}
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    <span className="uppercase">{materi.format_file}</span>
                    <span>•</span>
                    <span>{materi.file_size || '3.5 MB'}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-blue-900 tracking-wide uppercase">
                    {materi.nama_mapel}
                  </p>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-1">
                    {materi.judul_materi}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {materi.deskripsi}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  <span>{materi.unduhan_count || 0} siswa telah mengunduh</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoadingDoc(true);
                      setPreviewMateri(materi);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Pratinjau Materi"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadMateri(materi)}
                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  {!readOnly && (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditMateri(materi)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors cursor-pointer"
                        title="Edit Materi"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteMateri(materi.id_materi, materi.judul_materi)}
                        className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewMateri && (() => {
        const effectiveUrl = getEffectiveFileUrl(previewMateri);
        const format = (previewMateri.format_file || 'PDF').toUpperCase();
        const youtubeEmbed = format === 'LINK' ? getYouTubeEmbedUrl(effectiveUrl) : null;

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50">
            <div
              className={`bg-white flex flex-col shadow-2xl transition-all duration-200 overflow-hidden ${
                isFullscreen
                  ? 'fixed inset-0 w-screen h-screen rounded-none'
                  : 'rounded-2xl max-w-5xl w-full h-[90vh] border border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-white z-10 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    {getFormatIcon(previewMateri.format_file)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                      {previewMateri.judul_materi}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      Kelas {previewMateri.nama_kelas} • {previewMateri.nama_mapel} • {previewMateri.file_size || '3.5 MB'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {effectiveUrl.startsWith('http') && (
                    <a
                      href={effectiveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
                      title="Buka Dokumen di Tab Baru"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Tab Baru</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onDownloadMateri(previewMateri)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold shadow-xs cursor-pointer"
                    title="Unduh Berkas"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Unduh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewMateri(null);
                      setIsFullscreen(false);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Tutup Pratinjau"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 bg-slate-100 relative">
                {format === 'PDF' && (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {isLoadingDoc && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/80 z-10">
                        <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
                        <p className="text-xs text-slate-500 font-medium">Memuat pratinjau dokumen PDF...</p>
                      </div>
                    )}
                    <iframe
                      src={`${effectiveUrl}#toolbar=1&navpanes=0`}
                      title={previewMateri.judul_materi}
                      className="w-full h-full border-0"
                      onLoad={() => setIsLoadingDoc(false)}
                    />
                  </div>
                )}

                {format === 'MP4' && (
                  <div className="w-full h-full flex items-center justify-center bg-black p-4">
                    <video
                      src={effectiveUrl}
                      controls
                      autoPlay
                      className="max-h-full max-w-full rounded-xl shadow-lg"
                      onLoadedData={() => setIsLoadingDoc(false)}
                    >
                      Browser Anda tidak mendukung pemutaran video langsung.
                    </video>
                  </div>
                )}

                {(format === 'DOCX' || format === 'PPTX') && (
                  <div className="relative w-full h-full flex flex-col bg-slate-100">
                    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between shrink-0">
                      <span>Pratinjau berkas {format} menggunakan Google Docs Viewer.</span>
                      <button
                        type="button"
                        onClick={() => onDownloadMateri(previewMateri)}
                        className="font-bold underline hover:text-amber-900 cursor-pointer"
                      >
                        Unduh Berkas Asli
                      </button>
                    </div>
                    <div className="relative flex-1 min-h-0">
                      {isLoadingDoc && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-50/80 z-10">
                          <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
                          <p className="text-xs text-slate-500 font-medium">Memuat pratinjau berkas {format}...</p>
                        </div>
                      )}
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(effectiveUrl)}&embedded=true`}
                        title={previewMateri.judul_materi}
                        className="w-full h-full border-0"
                        onLoad={() => setIsLoadingDoc(false)}
                      />
                    </div>
                  </div>
                )}

                {format === 'LINK' && (
                  youtubeEmbed ? (
                    <div className="w-full h-full bg-black flex items-center justify-center">
                      <iframe
                        src={youtubeEmbed}
                        title={previewMateri.judul_materi}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                        <ExternalLink className="w-8 h-8" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{previewMateri.judul_materi}</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-md break-all">{effectiveUrl}</p>
                      <a
                        href={effectiveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <span>Buka Tautan Pembelajaran</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )
                )}
              </div>

              {previewMateri.deskripsi && (
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between shrink-0">
                  <div className="truncate mr-4">
                    <span className="font-semibold text-slate-800">Arahan Belajar: </span>
                    <span>{previewMateri.deskripsi}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {previewMateri.unduhan_count || 0} siswa telah mengunduh
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
