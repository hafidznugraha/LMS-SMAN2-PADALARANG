'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Clock,
  MoreVertical,
  Edit3,
  Trash2,
  Copy,
  ExternalLink,
  HardDrive,
  PlaySquare,
  Link2,
  Eye,
  Users,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredUser } from '@/lib/auth';
import {
  getTugasDetailGuru,
  getTugasSubmissions,
  gradeSubmissionGuru,
  deleteTugasGuru,
  getKomentarTugas,
  createKomentarTugas,
  deleteKomentarTugas,
} from '@/services/guruService';
import { TugasKuis, PengumpulanTugas, KomentarTugas } from '@/types/lms';
import { ConfirmModal } from '@/components/ui/confirm-modal';

interface ParsedLampiran {
  type: 'link' | 'file' | 'drive' | 'youtube' | 'doc';
  name: string;
  url: string;
}

function parseLampiran(raw?: string): ParsedLampiran[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string' && parsed.trim()) {
      return [{ type: 'file', name: 'Berkas Lampiran', url: parsed.trim() }];
    }
    return [];
  } catch {
    if (typeof raw === 'string' && raw.trim()) {
      return [{ type: 'file', name: 'Berkas Lampiran', url: raw.trim() }];
    }
    return [];
  }
}

function formatClassroomDeadline(dateStr?: string | null): string {
  if (!dateStr) return 'Tak ada batas waktu';
  try {
    const d = new Date(dateStr);
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
    if (isNaN(d.getTime())) {
      const parts = dateStr.split(/[- :T]/);
      if (parts.length >= 5) {
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const hour = parts[3];
        const min = parts[4];
        return `${day} ${months[monthIndex] || ''}, ${hour}.${min}`;
      }
      return dateStr;
    }
    const day = d.getDate();
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}.${minutes}`;
  } catch {
    return dateStr;
  }
}

function formatClassroomPosted(dateStr?: string | null): string {
  if (!dateStr) return 'Diposting hari ini';
  try {
    const d = new Date(dateStr);
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
    if (isNaN(d.getTime())) return 'Diposting baru saja';
    const day = d.getDate();
    const month = months[d.getMonth()];
    return `Diposting ${day} ${month}`;
  } catch {
    return 'Diposting baru saja';
  }
}

function formatInstructionHtml(content?: string): string {
  if (!content) return '';
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return content;
  }
  return content.replace(/\n/g, '<br />');
}

function getAttachmentDomain(url: string, type: string): string {
  if (!url || url === '#' || url.startsWith('#')) {
    return type === 'doc' ? 'Catatan Tambahan' : 'Lampiran Referensi';
  }
  try {
    const parsed = new URL(url, 'http://localhost');
    if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
      return 'YouTube Video';
    }
    if (parsed.hostname.includes('drive.google.com')) return 'Google Drive';
    if (parsed.hostname.includes('docs.google.com')) return 'Google Docs';
    if (url.includes('/uploads/')) return 'Berkas Lampiran';
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return type === 'file' ? 'Berkas Lampiran' : 'Tautan Web';
  }
}

function TugasDetailPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const tugasId = (params?.id as string) || '';

  const initialTab = searchParams.get('tab') === 'siswa' ? 'siswa' : 'petunjuk';
  const [activeTab, setActiveTab] = useState<'petunjuk' | 'siswa'>(initialTab);

  const [tugas, setTugas] = useState<TugasKuis | null>(null);
  const [submissions, setSubmissions] = useState<PengumpulanTugas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showKebabMenu, setShowKebabMenu] = useState(false);
  const [showRubrikModal, setShowRubrikModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Komentar kelas (Google Classroom Style & Terhubung Database)
  const [comments, setComments] = useState<KomentarTugas[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // Current logged in user
  const currentUser = useMemo(() => getStoredUser(), []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Grading states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DISERAHKAN' | 'DINILAI' | 'BELUM'>('ALL');
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!tugasId) return;
      try {
        setIsLoading(true);
        const [resDetail, resSubmissions, resComments] = await Promise.all([
          getTugasDetailGuru(tugasId),
          getTugasSubmissions(tugasId),
          getKomentarTugas(tugasId),
        ]);

        if (resDetail?.success && resDetail.data) {
          setTugas(resDetail.data);
        } else {
          toast.error(resDetail?.message || 'Tugas tidak ditemukan');
        }
        setSubmissions(resSubmissions || []);
        setComments(resComments || []);
      } catch (err) {
        console.error('Error loading tugas detail:', err);
        toast.error('Gagal memuat detail tugas');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [tugasId]);

  // Synchronize URL tab parameter
  const handleTabChange = (tab: 'petunjuk' | 'siswa') => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Tautan tugas berhasil disalin ke clipboard');
      setShowKebabMenu(false);
    }
  };

  const handleDeleteTugas = async () => {
    if (!tugas) return;
    setIsDeleting(true);
    try {
      const res = await deleteTugasGuru(tugas.id_tugas_kuis);
      if (res?.success) {
        toast.success('Tugas berhasil dihapus');
        router.push(
          tugas.id_kelas
            ? `/guru/tugas?kelasId=${tugas.id_kelas}`
            : '/guru/tugas'
        );
      } else {
        toast.error(res?.message || 'Gagal menghapus tugas');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus tugas');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInput.trim();
    if (!text || !tugasId || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const res = await createKomentarTugas(tugasId, text);
      if (res.success && res.data) {
        setComments((prev) => [...prev, res.data!]);
        setCommentInput('');
        toast.success('Komentar berhasil ditambahkan');
      } else {
        toast.error(res.message || 'Gagal menambahkan komentar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan komentar');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (komentarId: string) => {
    if (!tugasId || !komentarId) return;
    try {
      const res = await deleteKomentarTugas(tugasId, komentarId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c.id !== komentarId));
        toast.success('Komentar berhasil dihapus');
      } else {
        toast.error(res.message || 'Gagal menghapus komentar');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus komentar');
    }
  };

  const handleRefreshComments = async () => {
    if (!tugasId || isLoadingComments) return;
    setIsLoadingComments(true);
    try {
      const data = await getKomentarTugas(tugasId);
      setComments(data || []);
      toast.success('Komentar diperbarui');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui komentar');
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleStartGrade = (sub: PengumpulanTugas) => {
    setGradingSubId(sub.id_pengumpulan);
    setScoreInput(sub.nilai !== null && sub.nilai !== undefined ? String(sub.nilai) : '');
    setFeedbackInput(sub.feedback || (sub as unknown as { feedback_guru?: string }).feedback_guru || '');
  };

  const handleSaveGrade = async (sub: PengumpulanTugas) => {
    const num = Number(scoreInput);
    if (isNaN(num) || num < 0 || num > 100) {
      toast.error('Nilai harus berupa angka antara 0 dan 100');
      return;
    }
    setIsSavingGrade(true);
    try {
      const res = await gradeSubmissionGuru(sub.id_pengumpulan, {
        nilai: num,
        feedback_guru: feedbackInput.trim(),
        tugas_id: tugasId,
        siswa_id: sub.id_siswa,
      });

      if (res?.success) {
        toast.success(`Nilai untuk ${sub.nama_siswa} berhasil disimpan`);
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id_pengumpulan === sub.id_pengumpulan
              ? {
                  ...s,
                  nilai: num,
                  feedback: feedbackInput.trim(),
                  status_kumpul: s.status_kumpul === 'Belum Mengumpulkan' ? 'Tepat Waktu' : s.status_kumpul,
                }
              : s
          )
        );
        setGradingSubId(null);
      } else {
        toast.error(res?.message || 'Gagal menyimpan nilai');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan nilai siswa');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const parsedLampiran = useMemo(() => {
    return parseLampiran(tugas?.file_lampiran);
  }, [tugas?.file_lampiran]);

  // Statistics
  const totalSiswa = tugas?.total_siswa || submissions.length || 0;
  const jumlahDiserahkan = submissions.filter(
    (s) => s.status_kumpul !== 'Belum Mengumpulkan'
  ).length;
  const jumlahDinilai = submissions.filter(
    (s) => s.nilai !== null && s.nilai !== undefined
  ).length;
  const jumlahDitugaskan = Math.max(0, totalSiswa - jumlahDiserahkan);

  const filteredSubmissions = useMemo(() => {
    if (statusFilter === 'DISERAHKAN') {
      return submissions.filter((s) => s.status_kumpul !== 'Belum Mengumpulkan' && (s.nilai === null || s.nilai === undefined));
    }
    if (statusFilter === 'DINILAI') {
      return submissions.filter((s) => s.nilai !== null && s.nilai !== undefined);
    }
    if (statusFilter === 'BELUM') {
      return submissions.filter((s) => s.status_kumpul === 'Belum Mengumpulkan');
    }
    return submissions;
  }, [submissions, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#142d72]" />
        <p className="text-sm font-semibold">Memuat detail penugasan...</p>
      </div>
    );
  }

  if (!tugas) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Tugas Tidak Ditemukan</h3>
        <p className="text-xs text-slate-500">
          Penugasan ini mungkin telah dihapus atau Anda tidak memiliki akses ke kelas ini.
        </p>
        <Link
          href="/guru/tugas"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tugas</span>
        </Link>
      </div>
    );
  }

  const guruTitle = tugas.nama_guru
    ? `${tugas.nama_guru}${tugas.gelar_guru ? ', ' + tugas.gelar_guru : ''}`
    : 'Guru Pengampu';

  return (
    <div className="w-full space-y-6 antialiased">
      {/* ============================================================
          HEADER BANNER & BREADCRUMB (KONSISTEN DENGAN TUGAS MODULE)
          ============================================================ */}
      <div className="flex flex-col gap-3">
        <Link
          href={
            tugas.id_kelas
              ? `/guru/tugas?kelasId=${tugas.id_kelas}`
              : '/guru/tugas'
          }
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-900 transition-colors w-fit group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Ruang Penugasan: Kelas {tugas.nama_kelas || 'Kelas'}</span>
        </Link>

        {/* Banner Kartu Header Sesuai LMS Theme */}
        <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full border border-white/30">
                Kelas {tugas.nama_kelas || 'X'}
              </span>
              <span className="text-xs font-medium text-blue-100">
                {tugas.nama_mapel || 'Mata Pelajaran'} • Topik:{' '}
                <strong className="text-white">{tugas.topik || 'Tidak ada topik'}</strong>
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {tugas.judul}
            </h1>
            <p className="text-xs text-blue-100 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              <span>
                {guruTitle} • {totalSiswa} Siswa Terdaftar • {jumlahDiserahkan} Mengumpulkan
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => router.push(`/guru/tugas/buat?editId=${tugas.id_tugas_kuis}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-blue-900" />
              <span>Edit Tugas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          NAVIGATION TABS (KONSISTEN DENGAN TUGAS MODULE LMS)
          ============================================================ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs px-6 pt-2">
        <div className="flex items-center gap-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => handleTabChange('petunjuk')}
            className={`flex items-center gap-2 py-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'petunjuk'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Petunjuk</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('siswa')}
            className={`flex items-center gap-2 py-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
              activeTab === 'siswa'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tugas Siswa</span>
            <span
              className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'siswa'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {submissions.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          TAB CONTENT
          ============================================================ */}
      {activeTab === 'petunjuk' ? (
        /* ======================================================== */
        /* TAB 1: PETUNJUK LENGKAP PENUGASAN (DALAM CARD KONSISTEN) */
        /* ======================================================== */
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
          {/* Header Card: Icon, Judul, Meta & Menu */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    {tugas.judul}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    <span>{guruTitle}</span>
                    <span className="mx-2">•</span>
                    <span>{formatClassroomPosted(tugas.created_at)}</span>
                  </p>
                </div>
              </div>

              {/* Menu Kebab Aksi Tiga Titik */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowKebabMenu(!showKebabMenu)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  title="Opsi Tugas"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showKebabMenu && (
                  <div
                    className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowKebabMenu(false);
                        router.push(`/guru/tugas/buat?editId=${tugas.id_tugas_kuis}`);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Edit tugas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin link tugas</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setShowKebabMenu(false);
                        setShowDeleteModal(true);
                      }}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Hapus tugas</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Poin dan Tenggat Waktu */}
            <div className="flex flex-wrap items-center justify-between text-xs font-medium text-slate-600 pt-2 pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-full">
                100 poin
              </span>
              <span className="font-medium text-slate-600">
                Tenggat: {formatClassroomDeadline(tugas.tenggat_waktu || (tugas as unknown as { deadline?: string }).deadline)}
              </span>
            </div>
          </div>

          {/* Isi Instruksi Tugas */}
          <div className="text-sm text-slate-800 leading-relaxed font-sans space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline">
            {tugas.instruksi || (tugas as unknown as { deskripsi?: string }).deskripsi ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: formatInstructionHtml(
                    tugas.instruksi || (tugas as unknown as { deskripsi?: string }).deskripsi
                  ),
                }}
              />
            ) : (
              <p className="text-slate-400 italic">
                Tidak ada petunjuk khusus untuk tugas ini.
              </p>
            )}
          </div>

          {/* Berkas Lampiran */}
          {parsedLampiran.length > 0 && (
            <div className="pt-2 space-y-3">
              <p className="text-xs font-bold text-slate-700">
                Lampiran Berkas ({parsedLampiran.length}):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {parsedLampiran.map((att, attIdx) => {
                  const isYoutube = att.type === 'youtube';
                  const isDrive = att.type === 'drive';
                  const isFile = att.type === 'file';
                  const isDoc = att.type === 'doc';
                  const isExternal = Boolean(att.url && att.url !== '#' && !att.url.startsWith('#'));
                  const domain = getAttachmentDomain(att.url, att.type);

                  return (
                    <a
                      key={attIdx}
                      href={isExternal ? att.url : undefined}
                      target={isExternal ? '_blank' : undefined}
                      rel={isExternal ? 'noopener noreferrer' : undefined}
                      className={`group flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xs transition-all ${
                        isExternal ? 'cursor-pointer' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isYoutube
                            ? 'bg-red-50 text-red-600'
                            : isDrive
                            ? 'bg-emerald-50 text-emerald-600'
                            : isFile
                            ? 'bg-blue-50 text-blue-600'
                            : isDoc
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-purple-50 text-purple-600'
                        }`}
                      >
                        {isYoutube ? (
                          <PlaySquare className="w-5 h-5 text-red-600" />
                        ) : isDrive ? (
                          <HardDrive className="w-5 h-5 text-emerald-600" />
                        ) : isFile ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : isDoc ? (
                          <FileText className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Link2 className="w-5 h-5 text-purple-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                          {att.name || 'Lampiran Berkas'}
                        </h5>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <span>{domain}</span>
                          {isExternal && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
                        </p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badges Format Berkas & Rubrik */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {tugas.format_file && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Format berkas pengumpulan:{' '}
                  <span className="font-semibold uppercase">{tugas.format_file}</span>
                </span>
              </div>
            )}
            {tugas.rubrik_penilaian && (
              <button
                type="button"
                onClick={() => setShowRubrikModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Kriteria Rubrik Penilaian</span>
              </button>
            )}
          </div>

          {/* Komentar Kelas (Google Classroom Style & Terhubung Database) */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Komentar kelas ({comments.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRefreshComments}
                disabled={isLoadingComments}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors cursor-pointer"
                title="Muat ulang komentar"
              >
                {isLoadingComments ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span className="text-[11px] font-medium">Segarkan</span>
                )}
              </button>
            </div>

            {/* Daftar Komentar */}
            {comments.length > 0 ? (
              <div className="space-y-3 divide-y divide-slate-100">
                {comments.map((c) => {
                  const isAuthorOrTeacher =
                    currentUser?.id === c.user_id ||
                    currentUser?.role?.toLowerCase() === 'guru' ||
                    currentUser?.role?.toLowerCase() === 'kurikulum';

                  return (
                    <div
                      key={c.id}
                      className="group flex items-start gap-3 pt-3 first:pt-0 transition-colors"
                    >
                      {/* Avatar Inisial */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs ${
                          c.peran_user === 'Guru'
                            ? 'bg-blue-600 text-white'
                            : c.peran_user === 'Kurikulum'
                            ? 'bg-purple-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {getInitials(c.nama_user)}
                      </div>

                      {/* Konten Komentar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              {c.nama_user}
                              {c.gelar_user ? `, ${c.gelar_user}` : ''}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                c.peran_user === 'Guru'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                                  : c.peran_user === 'Kurikulum'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200/80'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                              }`}
                            >
                              {c.peran_user}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {c.waktu_format ||
                                new Date(c.created_at).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                            </span>
                          </div>

                          {/* Tombol Hapus Komentar */}
                          {isAuthorOrTeacher && (
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(c.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                              title="Hapus komentar ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed break-words">
                          {c.pesan}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-4 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Belum ada komentar kelas. Ajukan pertanyaan atau mulai diskusi di bawah ini.
                </p>
              </div>
            )}

            {/* Input Tambah Komentar */}
            <form onSubmit={handleAddComment} className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                {getInitials(currentUser?.nama_lengkap || currentUser?.username || 'G')}
              </div>
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl px-4 py-1.5 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Tambahkan komentar kelas..."
                  disabled={isSubmittingComment}
                  className="flex-1 bg-transparent py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim() || isSubmittingComment}
                  className="p-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer"
                  title="Kirim komentar"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* TAB 2: TUGAS SISWA (SUBMISSIONS KONSISTEN DENGAN LMS)    */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Kartu Metrik Statistik */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-slate-800">{jumlahDiserahkan}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Diserahkan</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-slate-800">{jumlahDitugaskan}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Ditugaskan</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
              <p className="text-3xl font-extrabold text-emerald-700">{jumlahDinilai}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">Dinilai</p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-1.5">
              {(['ALL', 'DISERAHKAN', 'DINILAI', 'BELUM'] as const).map((filterKey) => {
                const labels = {
                  ALL: 'Semua Siswa',
                  DISERAHKAN: 'Diserahkan',
                  DINILAI: 'Sudah Dinilai',
                  BELUM: 'Belum Mengumpulkan',
                };
                const isCurrent = statusFilter === filterKey;
                return (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setStatusFilter(filterKey)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {labels[filterKey]}
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-medium text-slate-500 px-2">
              Menampilkan {filteredSubmissions.length} dari {submissions.length} siswa
            </span>
          </div>

          {/* Submissions Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Nama Siswa / NIS</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Waktu Kumpul</th>
                    <th className="py-3.5 px-4">Berkas Tugas</th>
                    <th className="py-3.5 px-4">Nilai</th>
                    <th className="py-3.5 px-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Tidak ada data siswa yang cocok dengan filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredSubmissions.map((sub) => {
                      const isEditingThis = gradingSubId === sub.id_pengumpulan;
                      const hasScore = sub.nilai !== null && sub.nilai !== undefined;
                      const isLate = sub.status_kumpul === 'Terlambat';
                      const notSubmitted = sub.status_kumpul === 'Belum Mengumpulkan';

                      return (
                        <tr key={sub.id_pengumpulan} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-5 font-semibold text-slate-900">
                            <div>{sub.nama_siswa}</div>
                            <div className="text-[11px] text-slate-400 font-normal">NIS: {sub.nis || '-'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                notSubmitted
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : isLate
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {sub.status_kumpul}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                            {sub.tanggal_kumpul || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            {sub.file_tugas ? (
                              <a
                                href={sub.file_tugas}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold underline"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{sub.file_name || 'Buka Berkas'}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Tidak ada berkas</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isEditingThis ? (
                              <div className="space-y-1.5">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={scoreInput}
                                  onChange={(e) => setScoreInput(e.target.value)}
                                  placeholder="0-100"
                                  className="w-20 px-2 py-1 text-xs border border-blue-500 rounded-lg font-bold text-center focus:outline-none"
                                  autoFocus
                                />
                                <input
                                  type="text"
                                  value={feedbackInput}
                                  onChange={(e) => setFeedbackInput(e.target.value)}
                                  placeholder="Catatan guru..."
                                  className="w-44 px-2 py-1 text-[11px] border border-slate-200 rounded-lg focus:outline-none"
                                />
                              </div>
                            ) : hasScore ? (
                              <div>
                                <span className="font-extrabold text-sm text-emerald-700">{sub.nilai}</span>
                                <span className="text-[11px] text-slate-400 font-semibold"> / 100</span>
                                {sub.feedback && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                                    {sub.feedback}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-medium">-</span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            {isEditingThis ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isSavingGrade}
                                  onClick={() => handleSaveGrade(sub)}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                                >
                                  {isSavingGrade ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Simpan'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGradingSubId(null)}
                                  className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStartGrade(sub)}
                                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                              >
                                {hasScore ? 'Ubah Nilai' : 'Beri Nilai'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kriteria Rubrik Penilaian */}
      {showRubrikModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Kriteria Rubrik Penilaian</h3>
              <button
                type="button"
                onClick={() => setShowRubrikModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              {tugas.rubrik_penilaian || 'Tidak ada kriteria rubrik penilaian khusus.'}
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowRubrikModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Tugas */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteTugas}
        title="Hapus Tugas Ini?"
        message={`Apakah Anda yakin ingin menghapus "${tugas.judul}"? Semua riwayat pengumpulan siswa terkait tugas ini akan ikut terhapus permanen.`}
        confirmText="Ya, Hapus Tugas"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function TugasDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#142d72]" />
          <p className="text-xs font-semibold">Memuat halaman detail tugas...</p>
        </div>
      }
    >
      <TugasDetailPageContent />
    </Suspense>
  );
}
