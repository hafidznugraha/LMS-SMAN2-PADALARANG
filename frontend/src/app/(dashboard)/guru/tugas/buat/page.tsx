'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  X,
  ArrowLeft,
  FileText,
  ChevronDown,
  Users,
  Info,
  Plus,
  Loader2,
  HardDrive,
  Upload,
  Link2,
  PlaySquare,
  Check,
  FileSpreadsheet,
  Image as ImageIcon,
  FileArchive,
  Presentation,
  Trash2,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredUser } from '@/lib/auth';
import {
  getKelasGuru,
  getTugasGuru,
  createTugasGuru,
  updateTugasGuru,
} from '@/services/guruService';
import { Kelas, TugasKuis, JenisPenugasan } from '@/types/lms';

interface FormatOption {
  id: string;
  label: string;
  extensions: string[];
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILE_FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'pdf',
    label: 'Dokumen PDF',
    extensions: ['pdf'],
    badge: '.pdf',
    icon: FileText,
  },
  {
    id: 'word',
    label: 'Microsoft Word',
    extensions: ['docx', 'doc'],
    badge: '.docx',
    icon: FileText,
  },
  {
    id: 'image',
    label: 'Foto / Gambar',
    extensions: ['jpg', 'jpeg', 'png'],
    badge: '.jpg, .png',
    icon: ImageIcon,
  },
  {
    id: 'excel',
    label: 'Microsoft Excel',
    extensions: ['xlsx', 'xls'],
    badge: '.xlsx',
    icon: FileSpreadsheet,
  },
  {
    id: 'ppt',
    label: 'Presentasi PPT',
    extensions: ['pptx', 'ppt'],
    badge: '.pptx',
    icon: Presentation,
  },
  {
    id: 'zip',
    label: 'Arsip ZIP / RAR',
    extensions: ['zip', 'rar'],
    badge: '.zip',
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

function formatDisplayDeadline(deadlineStr?: string): string {
  if (!deadlineStr) return 'Tak ada batas waktu';
  try {
    const d = new Date(deadlineStr);
    if (isNaN(d.getTime())) return deadlineStr;
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const dayName = days[d.getDay()];
    const dateNum = d.getDate();
    const monthName = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${dayName}, ${dateNum} ${monthName}, ${hours}.${mins}`;
  } catch {
    return deadlineStr;
  }
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

function BuatTugasGoogleClassroomForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetKelasId = searchParams.get('kelasId') || '';
  const editId = searchParams.get('editId') || '';

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [currentBidangStudi, setCurrentBidangStudi] = useState('Mata Pelajaran');

  // Form states
  const [judul, setJudul] = useState('');
  const [instruksi, setInstruksi] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState(targetKelasId);
  const [poin, setPoin] = useState('100');
  const [hasDeadline, setHasDeadline] = useState(true);
  const [tenggatWaktu, setTenggatWaktu] = useState(getDefaultDeadline);
  const [topik, setTopik] = useState('Tugas Terstruktur');
  const [selectedFormatIds, setSelectedFormatIds] = useState<string[]>([
    'pdf',
    'word',
  ]);
  const [showRubrikModal, setShowRubrikModal] = useState(false);
  const [rubrik, setRubrik] = useState(
    '1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)'
  );

  // Attachments (Lampirkan)
  const [attachments, setAttachments] = useState<
    { type: 'link' | 'file' | 'drive' | 'youtube'; name: string; url: string }[]
  >([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showYoutubeModal, setShowYoutubeModal] = useState(false);
  const [modalInputUrl, setModalInputUrl] = useState('');
  const [modalInputName, setModalInputName] = useState('');
  const [showDeadlineDropdown, setShowDeadlineDropdown] = useState(false);
  const [touchedJudul, setTouchedJudul] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isBullet, setIsBullet] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const user = getStoredUser();
        const guruId =
          (user?.extra?.guru_id as string) || (user?.id as string) || '';
        const mapelName =
          user?.extra?.mapel?.nama_mapel ||
          (user?.extra?.mapel_nama as string) ||
          (user?.extra?.bidang_studi as string) ||
          'Mata Pelajaran';
        setCurrentBidangStudi(mapelName);

        const [kData, tData] = await Promise.all([
          getKelasGuru(guruId),
          editId ? getTugasGuru({ guru_id: guruId }) : Promise.resolve([]),
        ]);

        setKelasList(kData);

        if (targetKelasId) {
          setSelectedKelasId(targetKelasId);
        } else if (kData.length > 0) {
          setSelectedKelasId(kData[0].id_kelas);
        }

        if (editId && tData.length > 0) {
          const match = tData.find(
            (t) =>
              t.id_tugas_kuis === editId ||
              (t as unknown as { id?: string }).id === editId
          );
          if (match) {
            setJudul(match.judul || '');
            const ins =
              match.instruksi ||
              (match as unknown as { deskripsi?: string }).deskripsi ||
              '';
            setInstruksi(ins);
            if (editorRef.current) {
              editorRef.current.innerHTML = ins;
            }
            if (match.id_kelas) {
              setSelectedKelasId(match.id_kelas);
            }
            if (match.jenis) {
              setTopik(
                match.jenis === 'Proyek' ? 'Proyek Praktikum' : 'Tugas Terstruktur'
              );
            }
            if (match.tenggat_waktu || (match as unknown as { deadline?: string }).deadline) {
              setTenggatWaktu(
                toDateTimeLocalValue(
                  match.tenggat_waktu ||
                    (match as unknown as { deadline?: string }).deadline
                )
              );
              setHasDeadline(true);
            } else {
              setHasDeadline(false);
            }
            if (match.format_file) {
              setSelectedFormatIds(parseFormatStringToIds(match.format_file));
            }
            if (match.rubrik_penilaian) {
              setRubrik(match.rubrik_penilaian);
            }
          }
        }
      } catch (err) {
        console.error('Error loading buat tugas page data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [targetKelasId, editId]);

  // Sync editor innerHTML on initial mount or reset
  useEffect(() => {
    if (editorRef.current && instruksi && editorRef.current.innerHTML !== instruksi) {
      editorRef.current.innerHTML = instruksi;
    }
  }, [instruksi]);

  const updateToolbarStates = () => {
    if (typeof document === 'undefined') return;
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
      setIsBullet(document.queryCommandState('insertUnorderedList'));
    } catch {
      // ignore
    }
  };

  const execFormatting = (command: string) => {
    if (typeof document === 'undefined') return;
    editorRef.current?.focus();
    document.execCommand(command, false);
    if (editorRef.current) {
      setInstruksi(editorRef.current.innerHTML);
    }
    updateToolbarStates();
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    setInstruksi(html === '<br>' ? '' : html);
    updateToolbarStates();
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

  const setPresetDeadline = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setTenggatWaktu(`${year}-${month}-${day}T23:59`);
    setHasDeadline(true);
    setShowDeadlineDropdown(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setAttachments((prev) => [
      ...prev,
      {
        type: 'file',
        name: file.name,
        url: URL.createObjectURL(file),
      },
    ]);
    toast.success(`Berkas "${file.name}" terlampir sebagai referensi tugas`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLinkAttachment = (type: 'link' | 'youtube') => {
    if (!modalInputUrl.trim()) {
      toast.error('URL wajib diisi');
      return;
    }
    const name =
      modalInputName.trim() ||
      (type === 'youtube' ? 'Video Pembelajaran YouTube' : modalInputUrl.trim());
    setAttachments((prev) => [
      ...prev,
      {
        type,
        name,
        url: modalInputUrl.trim(),
      },
    ]);
    toast.success('Lampiran berhasil ditambahkan');
    setModalInputUrl('');
    setModalInputName('');
    setShowLinkModal(false);
    setShowYoutubeModal(false);
  };

  const handleRemoveAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (isDraft = false) => {
    setTouchedJudul(true);
    if (!judul.trim()) {
      toast.error('Judul tugas wajib diisi');
      return;
    }

    if (kelasList.length === 0 || !selectedKelasId) {
      toast.error('Pilih ruang kelas tujuan penugasan');
      return;
    }

    if (hasDeadline && !tenggatWaktu) {
      toast.error('Tentukan tenggat waktu penugasan');
      return;
    }

    const selectedTime = hasDeadline ? new Date(tenggatWaktu).getTime() : 0;
    if (hasDeadline && isNaN(selectedTime)) {
      toast.error('Format tanggal tenggat waktu tidak valid');
      return;
    }

    if (!editId && hasDeadline && selectedTime <= Date.now()) {
      toast.error('Tenggat waktu harus di masa depan');
      return;
    }

    if (selectedFormatIds.length === 0) {
      toast.error('Pilih minimal satu format berkas pengumpulan');
      return;
    }

    setIsSubmitting(true);
    const kelasObj =
      kelasList.find((k) => k.id_kelas === selectedKelasId) || kelasList[0];
    const user = getStoredUser();
    const formattedDeadline = hasDeadline
      ? toBackendDeadline(tenggatWaktu)
      : '';
    const compiledFormatFile = getFormatStringFromIds(selectedFormatIds);
    const jenisValue: JenisPenugasan =
      topik.toLowerCase().includes('proyek') ? 'Proyek' : 'Tugas';

    try {
      if (editId) {
        const res = await updateTugasGuru(editId, {
          judul: judul.trim(),
          deskripsi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          instruksi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          jenis: jenisValue,
          deadline: formattedDeadline,
          tenggat_waktu: formattedDeadline,
          format_file: compiledFormatFile,
          rubrik_penilaian: rubrik,
          kelas_id: kelasObj?.id_kelas,
        });

        if (res?.success) {
          toast.success('Tugas berhasil diperbarui');
          router.push(
            kelasObj?.id_kelas
              ? `/guru/tugas?kelasId=${kelasObj.id_kelas}`
              : '/guru/tugas'
          );
        } else {
          toast.error(res?.message || 'Gagal memperbarui tugas');
        }
      } else {
        const res = await createTugasGuru({
          judul: judul.trim(),
          deskripsi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          instruksi: instruksi.trim() || 'Kerjakan tugas sesuai rubrik penilaian',
          jenis: jenisValue,
          deadline: formattedDeadline,
          tenggat_waktu: formattedDeadline,
          format_file: compiledFormatFile,
          rubrik_penilaian: rubrik,
          kelas_id: kelasObj?.id_kelas,
          guru_id: user?.extra?.guru_id,
          mapel_id:
            user?.extra?.mapel_id ||
            (user?.extra?.mapel as { id?: string })?.id,
        });

        if (res?.success) {
          toast.success(
            isDraft
              ? 'Draf tugas berhasil disimpan'
              : 'Tugas berhasil ditugaskan ke kelas'
          );
          router.push(
            kelasObj?.id_kelas
              ? `/guru/tugas?kelasId=${kelasObj.id_kelas}`
              : '/guru/tugas'
          );
        } else {
          toast.error(res?.message || 'Gagal menerbitkan tugas');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan saat menyimpan tugas ke server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedKelasObj = kelasList.find(
    (k) => k.id_kelas === selectedKelasId
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
        <p className="text-sm font-semibold">Memuat formulir tugas...</p>
      </div>
    );
  }

  return (
    <div className="w-full -mt-2 md:-mt-4 lg:-mt-5 space-y-4 antialiased">
      {/* Hidden file input for file attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ===================================================================
          COMPACT HEADER BAR (GOOGLE CLASSROOM STYLE)
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push(
                selectedKelasId
                  ? `/guru/tugas?kelasId=${selectedKelasId}`
                  : '/guru/tugas'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all cursor-pointer shrink-0"
            title="Kembali ke Ruang Kelas"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            <span>Kembali</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] text-white flex items-center justify-center shadow-xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {editId ? 'Edit Tugas' : 'Tugas Baru'}
              </h1>
              {selectedKelasObj && (
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                  Kelas {selectedKelasObj.nama_kelas}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-normal mt-0.5">
              Mata Pelajaran: {currentBidangStudi}
            </p>
          </div>
        </div>

        {/* Right: Primary Button "Tugaskan" with Split Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <div className="inline-flex rounded-xl shadow-xs overflow-hidden">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs md:text-sm font-semibold px-4 py-2 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>{editId ? 'Simpan Perubahan' : 'Tugaskan'}</span>
              )}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              title="Simpan sebagai draf"
              className="bg-[#1a73e8] hover:bg-[#1557b0] text-white px-2 py-2 border-l border-blue-400/60 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================
          BODY CONTENT (TWO COLUMNS: MAIN ASSIGNMENT & SIDEBAR)
          =================================================================== */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* =================================================================
            LEFT COLUMN: ASSIGNMENT TITLE, INSTRUCTIONS & ATTACHMENTS
            ================================================================= */}
        <div className="flex-1 space-y-5">
          {/* Box 1: Judul & Petunjuk */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            {/* Input Judul */}
            <div>
              <div
                className={`bg-[#f1f3f4] rounded-t-md border-b-2 transition-colors px-4 pt-2.5 pb-2 ${
                  touchedJudul && !judul.trim()
                    ? 'border-red-500'
                    : 'border-transparent focus-within:border-[#1a73e8]'
                }`}
              >
                <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                  Judul *
                </label>
                <input
                  type="text"
                  value={judul}
                  onBlur={() => setTouchedJudul(true)}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Judul"
                  className="w-full text-base font-normal text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-400 mt-0.5"
                />
              </div>
              {touchedJudul && !judul.trim() && (
                <p className="text-xs text-red-600 mt-1 pl-1 font-medium">
                  *Wajib diisi
                </p>
              )}
            </div>

            {/* Textarea Petunjuk dengan WYSIWYG Rich Formatting Toolbar */}
            <div className="bg-[#f1f3f4] rounded-t-md border-b-2 border-transparent focus-within:border-[#1a73e8] transition-colors px-4 pt-2.5 pb-2 flex flex-col justify-between relative">
              <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-wide mb-1 select-none">
                Petunjuk (opsional)
              </label>

              {/* Placeholder overlay */}
              {(!instruksi || instruksi.trim() === '' || instruksi === '<br>') && (
                <span className="absolute left-4 top-8 text-sm font-normal text-gray-400 pointer-events-none select-none">
                  Petunjuk (opsional)
                </span>
              )}

              {/* Real WYSIWYG ContentEditable Surface */}
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyUp={updateToolbarStates}
                onMouseUp={updateToolbarStates}
                className="w-full min-h-[160px] text-sm font-normal text-gray-800 bg-transparent focus:outline-none leading-relaxed outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline"
              />

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 pt-3 border-t border-gray-300/70 mt-2 select-none">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormatting('bold');
                  }}
                  title="Tebal (Ctrl+B)"
                  className={`w-8 h-8 rounded flex items-center justify-center font-bold text-sm transition-colors cursor-pointer ${
                    isBold
                      ? 'bg-blue-100 text-[#1a73e8]'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormatting('italic');
                  }}
                  title="Miring (Ctrl+I)"
                  className={`w-8 h-8 rounded flex items-center justify-center italic font-serif text-sm transition-colors cursor-pointer ${
                    isItalic
                      ? 'bg-blue-100 text-[#1a73e8]'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormatting('underline');
                  }}
                  title="Garis Bawah (Ctrl+U)"
                  className={`w-8 h-8 rounded flex items-center justify-center underline text-sm transition-colors cursor-pointer ${
                    isUnderline
                      ? 'bg-blue-100 text-[#1a73e8]'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  U
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormatting('insertUnorderedList');
                  }}
                  title="Daftar Berbutir"
                  className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                    isBullet
                      ? 'bg-blue-100 text-[#1a73e8]'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-base leading-none font-bold">•—</span>
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    execFormatting('removeFormat');
                  }}
                  title="Hapus Pemformatan"
                  className="w-8 h-8 rounded flex items-center justify-center text-gray-700 hover:bg-gray-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  T<span className="text-[10px] text-gray-500">x</span>
                </button>
              </div>
            </div>
          </div>

          {/* Box 2: Lampirkan (Drive, YouTube, Buat, Upload, Link) */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Lampirkan</h3>

            {/* Circular Attachment Buttons */}
            <div className="flex items-center justify-start gap-6 md:gap-8 overflow-x-auto py-2">
              {/* Drive */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shadow-xs"
                >
                  <HardDrive className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600 mt-1.5 font-normal">
                  Drive
                </span>
              </div>

              {/* YouTube */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowYoutubeModal(true)}
                  className="w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-red-600 transition-colors cursor-pointer shadow-xs"
                >
                  <PlaySquare className="w-5 h-5 text-red-600" />
                </button>
                <span className="text-xs text-gray-600 mt-1.5 font-normal">
                  YouTube
                </span>
              </div>

              {/* Buat (+) */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowRubrikModal(true)}
                  className="w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-blue-600 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-5 h-5 text-[#1a73e8]" />
                </button>
                <span className="text-xs text-gray-600 mt-1.5 font-normal">
                  Buat
                </span>
              </div>

              {/* Upload */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600 mt-1.5 font-normal">
                  Upload
                </span>
              </div>

              {/* Link */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(true)}
                  className="w-12 h-12 rounded-full border border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition-colors cursor-pointer shadow-xs"
                >
                  <Link2 className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600 mt-1.5 font-normal">
                  Link
                </span>
              </div>
            </div>

            {/* List of Attached Links/Files */}
            {attachments.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-500">
                  Lampiran Terpasang ({attachments.length}):
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {att.type === 'youtube' ? (
                          <PlaySquare className="w-4 h-4 text-red-600 shrink-0" />
                        ) : att.type === 'file' ? (
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <Link2 className="w-4 h-4 text-gray-600 shrink-0" />
                        )}
                        <span className="truncate font-medium text-gray-800">
                          {att.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-gray-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Format Berkas Pengumpulan Siswa */}
            <div className="pt-4 border-t border-gray-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">
                  Format Berkas Pengumpulan Siswa
                </span>
                <span className="text-[11px] text-gray-500">
                  {selectedFormatIds.length} format dipilih
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FILE_FORMAT_OPTIONS.map((opt) => {
                  const isSelected = selectedFormatIds.includes(opt.id);
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleFormatId(opt.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1a73e8] bg-blue-50/70 text-blue-900 shadow-2xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'bg-[#1a73e8] border-[#1a73e8] text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* =================================================================
            RIGHT COLUMN: SETTINGS PANEL (GOOGLE CLASSROOM SIDEBAR)
            ================================================================= */}
        <div className="w-full lg:w-80 lg:shrink-0 space-y-6">
          {/* Untuk (Kelas) - Otomatis & Terkunci */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Untuk
            </label>
            <div className="w-full bg-[#f1f3f4] text-gray-800 text-sm font-medium py-2.5 px-3 rounded-t-md border-b-2 border-slate-300 flex items-center justify-between select-none cursor-not-allowed">
              <span className="font-semibold text-slate-800">
                Kelas {selectedKelasObj?.nama_kelas || 'Kelas'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Terkunci</span>
              </div>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 pl-1">
              Mata Pelajaran: {currentBidangStudi} • Terkunci otomatis untuk kelas ini
            </p>
          </div>

          {/* Tugaskan ke */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Tugaskan ke
            </label>
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-[#1a73e8] bg-white hover:bg-blue-50/50 transition-colors select-none">
              <Users className="w-4 h-4" />
              <span>
                Semua pelajar ({selectedKelasObj?.jumlah_siswa || 36} siswa)
              </span>
            </div>
          </div>

          {/* Poin */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Poin
            </label>
            <div className="relative">
              <select
                value={poin}
                onChange={(e) => setPoin(e.target.value)}
                className="w-full appearance-none bg-[#f1f3f4] text-gray-800 text-sm font-medium py-2.5 px-3 rounded-t-md border-b-2 border-transparent focus:border-[#1a73e8] focus:outline-none cursor-pointer"
              >
                <option value="100">100</option>
                <option value="80">80</option>
                <option value="50">50</option>
                <option value="0">Tidak dinilai</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Tenggat */}
          <div className="relative">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Tenggat
            </label>
            <button
              type="button"
              onClick={() => setShowDeadlineDropdown(!showDeadlineDropdown)}
              className="w-full bg-[#f1f3f4] text-gray-800 text-sm font-medium py-2.5 px-3 rounded-t-md border-b-2 border-transparent hover:bg-gray-200/80 focus:border-[#1a73e8] flex items-center justify-between text-left cursor-pointer transition-colors"
            >
              <span className="truncate">
                {hasDeadline
                  ? formatDisplayDeadline(tenggatWaktu)
                  : 'Tak ada batas waktu'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-2" />
            </button>

            {/* Dropdown panel for deadline */}
            {showDeadlineDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700">
                    Batas Pengumpulan
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setHasDeadline(!hasDeadline);
                      setShowDeadlineDropdown(false);
                    }}
                    className="text-xs text-blue-600 hover:underline cursor-pointer"
                  >
                    {hasDeadline ? 'Hapus Tenggat' : 'Pasang Tenggat'}
                  </button>
                </div>

                {hasDeadline && (
                  <>
                    <input
                      type="datetime-local"
                      value={tenggatWaktu}
                      onChange={(e) => setTenggatWaktu(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setPresetDeadline(3)}
                        className="flex-1 py-1 px-2 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        +3 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDeadline(7)}
                        className="flex-1 py-1 px-2 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        +1 Minggu
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetDeadline(14)}
                        className="flex-1 py-1 px-2 text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                      >
                        +2 Minggu
                      </button>
                    </div>
                  </>
                )}

                <div className="text-right pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDeadlineDropdown(false)}
                    className="px-3 py-1 bg-[#1a73e8] text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors cursor-pointer"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Topik / Tipe Asesmen */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Topik
            </label>
            <div className="relative">
              <select
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                className="w-full appearance-none bg-[#f1f3f4] text-gray-800 text-sm font-medium py-2.5 px-3 rounded-t-md border-b-2 border-transparent focus:border-[#1a73e8] focus:outline-none cursor-pointer"
              >
                <option value="Tugas Terstruktur">Tugas Terstruktur</option>
                <option value="Proyek Praktikum">Proyek Praktikum</option>
                <option value="Latihan Mandiri">Latihan Mandiri</option>
                <option value="Tidak ada topik">Tidak ada topik</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Rubrik */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500">Rubrik</span>
              <div title="Rubrik penilaian kompetensi dan bobot penilaian tugas">
                <Info className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRubrikModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-[#1a73e8] hover:bg-blue-50/50 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Rubrik</span>
            </button>
            <p className="text-[11px] text-gray-500 mt-1.5 pl-1">
              Rubrik kriteria penilaian aktif ({rubrik.split('\n').filter(Boolean).length} kriteria).
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================
          MODAL: RUBRIK PENILAIAN
          =================================================================== */}
      {showRubrikModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                Rubrik Penilaian Tugas
              </h3>
              <button
                type="button"
                onClick={() => setShowRubrikModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kriteria & Bobot Penilaian (per baris):
              </label>
              <textarea
                rows={6}
                value={rubrik}
                onChange={(e) => setRubrik(e.target.value)}
                placeholder="Contoh:&#10;1. Ketepatan Konsep (40%)&#10;2. Sistematika (30%)&#10;3. Kesimpulan Akhir (30%)"
                className="w-full p-3 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRubrikModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                Simpan Rubrik
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: LINK ATTACHMENT
          =================================================================== */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-[#1a73e8]" />
                <span>Tambahkan Tautan / Link</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  URL / Tautan *
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... atau https://..."
                  value={modalInputUrl}
                  onChange={(e) => setModalInputUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Judul Tautan (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Modul Belajar Google Drive"
                  value={modalInputName}
                  onChange={(e) => setModalInputName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleAddLinkAttachment('link')}
                className="px-4 py-1.5 text-xs font-semibold bg-[#1a73e8] text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              >
                Tambahkan Tautan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: YOUTUBE ATTACHMENT
          =================================================================== */}
      {showYoutubeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <PlaySquare className="w-5 h-5 text-red-600" />
                <span>Tambahkan Video YouTube</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowYoutubeModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Link YouTube Video *
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={modalInputUrl}
                  onChange={(e) => setModalInputUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Judul Video (opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Video Penjelasan Konsep Aljabar"
                  value={modalInputName}
                  onChange={(e) => setModalInputName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowYoutubeModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleAddLinkAttachment('youtube')}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                Tambahkan Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuatTugasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#1a73e8]" />
          <p className="text-sm font-semibold">Menyiapkan formulir tugas...</p>
        </div>
      }
    >
      <BuatTugasGoogleClassroomForm />
    </Suspense>
  );
}
