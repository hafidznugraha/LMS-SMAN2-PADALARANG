import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Lock, 
  ArrowLeft, 
  Users, 
  GraduationCap, 
  LayoutGrid, 
  Mail, 
  Copy, 
  ArrowUpDown, 
  Loader2, 
  ShieldCheck,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  HardDrive,
  PlaySquare,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TugasKuis, PengumpulanTugas, Kelas, JenisPenugasan } from '../../types/lms';
import { getAnggotaKelas, AnggotaKelasData, PengajarItem, SiswaItem } from '@/services/guruService';
import { getStoredUser } from '@/lib/auth';

interface TugasModuleProps {
  tugasList: TugasKuis[];
  submissionsList: PengumpulanTugas[];
  kelasList: Kelas[];
  onOpenCreateTugas: (kelasId?: string) => void;
  onSaveNilaiSubmission: (idPengumpulan: string, nilai: number, feedback: string, submission?: PengumpulanTugas) => void;
  activeTugasId?: string | null;
  onClearActiveTugas?: () => void;
  onOpenGrading?: (tugas: TugasKuis) => void;
  onEditTugas?: (tugas: TugasKuis) => void;
  onDeleteTugas?: (tugasId: string, judul?: string) => void;
  namaMapel?: string;
  activeKelasId?: string | null;
  onSelectKelas?: (kelas: Kelas | null) => void;
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
  namaMapel,
  activeKelasId,
  onSelectKelas,
}) => {
  const [selectedJenis, setSelectedJenis] = useState<'ALL' | JenisPenugasan>('ALL');
  const [selectedKelas, setSelectedKelas] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedWorkspaceKelas, setSelectedWorkspaceKelas] = useState<Kelas | null>(() => {
    if (activeKelasId) {
      return kelasList.find((k) => k.id_kelas === activeKelasId) || null;
    }
    return null;
  });

  const [activeClassTab, setActiveClassTab] = useState<'tugas' | 'orang'>('tugas');
  const [anggotaData, setAnggotaData] = useState<AnggotaKelasData | null>(null);
  const [isLoadingAnggota, setIsLoadingAnggota] = useState(false);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
  const [siswaSearchQuery, setSiswaSearchQuery] = useState('');
  const [siswaSortAsc, setSiswaSortAsc] = useState(true);

  const currentUser = getStoredUser();
  const effectiveGuruId =
    (currentUser?.extra?.guru_id as string) || (currentUser?.id as string) || '';

  const handleSelectWorkspace = (kelas: Kelas | null) => {
    setSelectedWorkspaceKelas(kelas);
    setSearchQuery('');
    setSelectedJenis('ALL');
    setActiveClassTab('tugas');
    setSelectedSiswaIds([]);
    setSiswaSearchQuery('');
    if (onSelectKelas) {
      onSelectKelas(kelas);
    }
  };

  useEffect(() => {
    if (!selectedWorkspaceKelas) {
      setAnggotaData(null);
      return;
    }
    let isMounted = true;
    setIsLoadingAnggota(true);
    getAnggotaKelas(selectedWorkspaceKelas.id_kelas, {
      guru_id: effectiveGuruId,
      mapel: namaMapel,
    })
      .then((data) => {
        if (isMounted && data) {
          setAnggotaData(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching anggota kelas:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingAnggota(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [selectedWorkspaceKelas, effectiveGuruId, namaMapel]);

  useEffect(() => {
    if (activeKelasId) {
      const match = kelasList.find((k) => k.id_kelas === activeKelasId);
      if (match && match.id_kelas !== selectedWorkspaceKelas?.id_kelas) {
        setSelectedWorkspaceKelas(match);
      }
    } else if (activeKelasId === null && selectedWorkspaceKelas !== null) {
      setSelectedWorkspaceKelas(null);
    }
  }, [activeKelasId, kelasList]);

  useEffect(() => {
    if (activeTugasId && !selectedWorkspaceKelas) {
      const targetTugas = tugasList.find(
        (t) =>
          t.id_tugas_kuis === activeTugasId ||
          (t as unknown as { id?: string }).id === activeTugasId
      );
      if (targetTugas) {
        const targetKelasId =
          targetTugas.id_kelas ||
          (targetTugas as unknown as { kelas_id?: string }).kelas_id;
        const found = kelasList.find((k) => k.id_kelas === targetKelasId);
        if (found) {
          setSelectedWorkspaceKelas(found);
        }
      }
    }
  }, [activeTugasId, tugasList, kelasList, selectedWorkspaceKelas]);

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
  const [expandedTugasId, setExpandedTugasId] = useState<string | null>(activeTugasId || null);
  const [openMenuTugasId, setOpenMenuTugasId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTugasId) {
      setExpandedTugasId(activeTugasId);
    }
  }, [activeTugasId]);

  const formatClassroomDeadline = (dateStr?: string | null): string => {
    if (!dateStr) return 'Tidak ada tenggat';
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (isNaN(d.getTime())) {
        const parts = dateStr.split(/[- :T]/);
        if (parts.length >= 5) {
          const monthIndex = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const hour = parts[3];
          const min = parts[4];
          return `Tenggat: ${day} ${months[monthIndex] || ''}, ${hour}.${min}`;
        }
        return `Tenggat: ${dateStr}`;
      }
      const day = d.getDate();
      const month = months[d.getMonth()];
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `Tenggat: ${day} ${month}, ${hours}.${minutes}`;
    } catch {
      return `Tenggat: ${dateStr}`;
    }
  };

  const formatClassroomPosted = (dateStr?: string | null): string => {
    if (!dateStr) return 'Diposting hari ini';
    try {
      const d = new Date(dateStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (isNaN(d.getTime())) return 'Diposting baru saja';
      const day = d.getDate();
      const month = months[d.getMonth()];
      return `Diposting ${day} ${month}`;
    } catch {
      return 'Diposting baru saja';
    }
  };

  const formatInstructionHtml = (content?: string): string => {
    if (!content) return '';
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return content;
    }
    return content.replace(/\n/g, '<br />');
  };

  const getAttachmentDomain = (url: string, type: string): string => {
    if (!url || url === '#' || url.startsWith('#')) {
      return type === 'doc' ? 'Catatan Tambahan' : 'Lampiran Referensi';
    }
    try {
      const parsed = new URL(url, 'http://localhost');
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) return 'YouTube Video';
      if (parsed.hostname.includes('drive.google.com')) return 'Google Drive';
      if (parsed.hostname.includes('docs.google.com')) return 'Google Docs';
      if (url.includes('/uploads/')) return 'Berkas Lampiran';
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return type === 'file' ? 'Berkas Lampiran' : 'Tautan Web';
    }
  };

  const filteredTugas = tugasList.filter((t) => {
    const matchesWorkspace =
      !selectedWorkspaceKelas ||
      t.id_kelas === selectedWorkspaceKelas.id_kelas ||
      (t as unknown as { kelas_id?: string }).kelas_id === selectedWorkspaceKelas.id_kelas;
    const matchesJenis = selectedJenis === 'ALL' || t.jenis === selectedJenis;
    const matchesSearch =
      (t.judul || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.instruksi || (t as unknown as { deskripsi?: string }).deskripsi || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesWorkspace && matchesJenis && matchesSearch && !t.deleted_at;
  });

  const groupedTugas = useMemo(() => {
    const groups: { [key: string]: TugasKuis[] } = {};
    filteredTugas.forEach((t) => {
      const topicName =
        (t.topik || (t as unknown as { topik?: string }).topik || '').trim() ||
        'Tidak ada topik';
      if (!groups[topicName]) {
        groups[topicName] = [];
      }
      groups[topicName].push(t);
    });

    // Sort so "Tidak ada topik" appears at top, then alphabetical by topic name
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Tidak ada topik') return -1;
      if (b === 'Tidak ada topik') return 1;
      return a.localeCompare(b);
    });

    const sortedGroups: { [key: string]: TugasKuis[] } = {};
    sortedEntries.forEach(([k, v]) => {
      sortedGroups[k] = v;
    });

    return sortedGroups;
  }, [filteredTugas]);

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

  const totalKelas = kelasList.length;
  const totalTugasAktif = tugasList.filter((t) => !t.deleted_at).length;
  const totalPerluDinilai = tugasList.filter((t) => !t.deleted_at).reduce((acc, t) => {
    return acc + Math.max(0, (t.jumlah_mengumpulkan || 0) - (t.jumlah_dinilai || 0));
  }, 0);

  const formatGuruNameWithGelar = (name: string, gelar?: string) => {
    const cleanName = (name || '').trim();
    const cleanGelar = (gelar || '').replace(/^,+/, '').trim();
    if (cleanGelar && !cleanName.toLowerCase().includes(cleanGelar.toLowerCase())) {
      return `${cleanName}, ${cleanGelar}`;
    }
    return cleanName;
  };

  const userGelar =
    (currentUser?.extra?.gelar as string) ||
    (currentUser?.extra?.guru as { gelar?: string })?.gelar ||
    '';

  const rawPengajarList = anggotaData?.pengajar || [];
  // Tepat 1 guru pengampu dari mata pelajaran ruang kelas ini beserta gelarnya
  const pengajarList: PengajarItem[] = (() => {
    let matchedGuru: PengajarItem | null = null;

    if (rawPengajarList.length > 0) {
      // 1. Cocokkan dengan guru yang sedang aktif
      matchedGuru =
        rawPengajarList.find(
          (p) =>
            (effectiveGuruId && p.id === effectiveGuruId) ||
            (currentUser?.email && p.email === currentUser.email) ||
            (currentUser?.nama_lengkap &&
              p.nama_lengkap.toLowerCase().includes(currentUser.nama_lengkap.toLowerCase()))
        ) || null;

      // 2. Cocokkan berdasarkan nama mapel yang sedang dibuka
      if (!matchedGuru && namaMapel) {
        matchedGuru =
          rawPengajarList.find(
            (p) =>
              p.mapel.toLowerCase().includes(namaMapel.toLowerCase()) ||
              namaMapel.toLowerCase().includes(p.mapel.toLowerCase())
          ) || null;
      }

      if (!matchedGuru) {
        matchedGuru = rawPengajarList[0];
      }
    }

    if (!matchedGuru) {
      matchedGuru = {
        id: effectiveGuruId || 'current-guru',
        nama_lengkap: currentUser?.nama_lengkap || 'Pendidik',
        gelar: userGelar,
        nip: (currentUser?.extra?.nip as string) || '-',
        email: currentUser?.email || '',
        peran: 'Guru Pengampu',
        mapel: namaMapel || 'Mata Pelajaran',
      };
    }

    const effectiveGelar = matchedGuru.gelar || userGelar;
    return [
      {
        ...matchedGuru,
        nama_lengkap: formatGuruNameWithGelar(matchedGuru.nama_lengkap, effectiveGelar),
      },
    ];
  })();

  const rawSiswaList: SiswaItem[] = anggotaData?.siswa || [];
  const filteredSiswaList = rawSiswaList
    .filter((s) => {
      if (!siswaSearchQuery.trim()) return true;
      const q = siswaSearchQuery.toLowerCase();
      return (
        s.nama_lengkap.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const cmp = a.nama_lengkap.localeCompare(b.nama_lengkap);
      return siswaSortAsc ? cmp : -cmp;
    });

  const isAllSiswaSelected =
    filteredSiswaList.length > 0 &&
    filteredSiswaList.every((s) => selectedSiswaIds.includes(s.id));

  const toggleSelectAllSiswa = () => {
    if (isAllSiswaSelected) {
      setSelectedSiswaIds([]);
    } else {
      setSelectedSiswaIds(filteredSiswaList.map((s) => s.id));
    }
  };

  const toggleSelectSiswa = (id: string) => {
    setSelectedSiswaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCopySelectedNis = () => {
    const selectedSiswa = rawSiswaList.filter((s) => selectedSiswaIds.includes(s.id));
    if (selectedSiswa.length === 0) {
      toast.error('Pilih setidaknya satu siswa');
      return;
    }
    const text = selectedSiswa.map((s) => `${s.nama_lengkap}: ${s.nis || '-'}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success(`${selectedSiswa.length} data NIS siswa berhasil disalin ke clipboard`);
  };

  const handleCopySingleNis = (nis: string, nama: string) => {
    if (!nis) {
      toast.error('Siswa belum memiliki NIS');
      return;
    }
    navigator.clipboard.writeText(nis);
    toast.success(`NIS ${nama} (${nis}) berhasil disalin ke clipboard`);
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarColorPalettes = [
    'bg-blue-600',
    'bg-purple-600',
    'bg-emerald-600',
    'bg-rose-600',
    'bg-amber-600',
    'bg-cyan-600',
    'bg-indigo-600',
    'bg-teal-600',
    'bg-pink-600',
  ];

  return (
    <div className="space-y-6">
      {/* ============================================================
          LEVEL 1: HUB RUANG KELAS (GOOGLE CLASSROOM STYLE)
          ============================================================ */}
      {!selectedWorkspaceKelas ? (
        <div className="space-y-6">
          {/* Hub Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 uppercase tracking-wider">
                <span>Beranda Guru</span>
                <span>/</span>
                <span className="text-slate-600">Ruang Penugasan</span>
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                  <GraduationCap className="w-7 h-7 text-[#1E3A8A]" />
                  Ruang Kelas & Penugasan Akademik
                </h1>
              </div>
              <p className="text-sm text-slate-600">
                Pilih ruang kelas di bawah untuk mengelola materi, menerbitkan tugas terstruktur, dan memeriksa lembar pengumpulan siswa secara terisolasi.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Kelas</p>
                <p className="text-base font-extrabold text-slate-900 font-mono">{totalKelas}</p>
              </div>
              <div className="px-3.5 py-2 bg-blue-50/70 border border-blue-200 rounded-xl text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-blue-700">Tugas Aktif</p>
                <p className="text-base font-extrabold text-blue-900 font-mono">{totalTugasAktif}</p>
              </div>
              <div className="px-3.5 py-2 bg-amber-50/70 border border-amber-200 rounded-xl text-center min-w-[90px]">
                <p className="text-[10px] uppercase font-bold text-amber-700">Perlu Dinilai</p>
                <p className="text-base font-extrabold text-amber-900 font-mono">{totalPerluDinilai}</p>
              </div>
            </div>
          </div>

          {/* Grid Kartu Kelas (Google Classroom Style) */}
          {kelasList.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                <LayoutGrid className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Belum Ada Rombel Ditugaskan</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Jadwal mengajar dan penugasan rombel belum ditetapkan oleh Waka Kurikulum.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {kelasList.map((k, idx) => {
                const classTasks = tugasList.filter(
                  (t) =>
                    (t.id_kelas === k.id_kelas || (t as unknown as { kelas_id?: string }).kelas_id === k.id_kelas) &&
                    !t.deleted_at
                );
                const pendingGradingCount = classTasks.reduce((acc, t) => {
                  const unread = Math.max(0, (t.jumlah_mengumpulkan || 0) - (t.jumlah_dinilai || 0));
                  return acc + unread;
                }, 0);
                const totalMengumpulkan = classTasks.reduce((acc, t) => acc + (t.jumlah_mengumpulkan || 0), 0);

                const colorSchemes = [
                  { header: 'from-blue-700 via-indigo-700 to-blue-900' },
                  { header: 'from-emerald-700 via-teal-700 to-emerald-900' },
                  { header: 'from-purple-700 via-indigo-800 to-purple-900' },
                  { header: 'from-amber-600 via-orange-600 to-amber-800' },
                  { header: 'from-rose-700 via-pink-700 to-rose-900' },
                  { header: 'from-cyan-700 via-blue-700 to-cyan-900' },
                ];
                const scheme = colorSchemes[idx % colorSchemes.length];

                return (
                  <div
                    key={k.id_kelas}
                    onClick={() => handleSelectWorkspace(k)}
                    className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden cursor-pointer hover:border-blue-500/80"
                  >
                    {/* Header Banner (Google Classroom Card) */}
                    <div className={`p-5 bg-gradient-to-r ${scheme.header} text-white relative flex flex-col justify-between min-h-[120px]`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
                            {namaMapel || 'Mata Pelajaran'}
                          </span>
                          <h3 className="text-2xl font-extrabold tracking-tight group-hover:underline decoration-white/50">
                            Kelas {k.nama_kelas}
                          </h3>
                        </div>
                        <span className="px-2.5 py-0.5 text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white rounded-full border border-white/30">
                          Tingkat {k.tingkat || 'X'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-white/85 pt-2 border-t border-white/15">
                        <span>Tahun Ajaran {k.tahun_ajaran || '2026/2027'}</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-3.5 h-3.5" />
                          {k.jumlah_siswa || 36} Siswa
                        </span>
                      </div>
                    </div>

                    {/* Body Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <ClipboardList className="w-4 h-4 text-slate-400" />
                            Tugas Diterbitkan
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {classTasks.length} Tugas
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <FileCheck2 className="w-4 h-4 text-slate-400" />
                            Jawaban Terkumpul
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {totalMengumpulkan} Jawaban
                          </span>
                        </div>

                        {pendingGradingCount > 0 ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{pendingGradingCount} Tugas Menunggu Penilaian</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Seluruh Pengumpulan Dinilai</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Action */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-700 transition-colors">
                          Kelola Tugas Kelas Ini
                        </span>
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs font-bold text-blue-700 group-hover:translate-x-0.5 transition-transform cursor-pointer"
                        >
                          <span>Buka Ruang Tugas</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ============================================================
           LEVEL 2: RUANG PENUGASAN KELAS TERPILIH
           ============================================================ */
        <div className="space-y-6">
          {/* Breadcrumb & Ruang Kelas Banner */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleSelectWorkspace(null)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-900 transition-colors w-fit cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Kembali ke Semua Ruang Kelas</span>
            </button>

            <div className="bg-gradient-to-r from-blue-800 via-indigo-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-white/20 text-white rounded-full border border-white/30">
                    Tingkat {selectedWorkspaceKelas.tingkat || 'X'}
                  </span>
                  <span className="text-xs font-medium text-blue-100">
                    {namaMapel || 'Mata Pelajaran'} • Tahun Ajaran {selectedWorkspaceKelas.tahun_ajaran || '2026/2027'}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Ruang Penugasan: Kelas {selectedWorkspaceKelas.nama_kelas}
                </h2>
                <p className="text-xs text-blue-100 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>{selectedWorkspaceKelas.jumlah_siswa || 36} Peserta Didik Terdaftar</span>
                </p>
              </div>

              {/* Buat Tugas Baru ONLY HERE, locked to this class! */}
              <button
                onClick={() => onOpenCreateTugas(selectedWorkspaceKelas.id_kelas)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-sm font-bold transition-all shadow-sm cursor-pointer self-start md:self-auto shrink-0"
              >
                <Plus className="w-4 h-4 text-blue-900" />
                <span>Buat Tugas di Kelas Ini</span>
              </button>
            </div>
          </div>

          {/* ============================================================
              NAVIGATION TABS (GOOGLE CLASSROOM STYLE)
              ============================================================ */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs px-6 pt-2">
            <div className="flex items-center gap-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setActiveClassTab('tugas')}
                className={`flex items-center gap-2 py-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  activeClassTab === 'tugas'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Tugas Kelas</span>
                <span
                  className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeClassTab === 'tugas'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {filteredTugas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveClassTab('orang')}
                className={`flex items-center gap-2 py-3 px-3 font-bold text-sm border-b-2 transition-all cursor-pointer ${
                  activeClassTab === 'orang'
                    ? 'border-blue-600 text-blue-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 font-medium'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Orang</span>
                <span
                  className={`ml-1 text-xs px-2 py-0.5 rounded-full font-bold ${
                    activeClassTab === 'orang'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {anggotaData?.total_siswa ?? selectedWorkspaceKelas.jumlah_siswa ?? 0}
                </span>
              </button>
            </div>
          </div>

          {/* ============================================================
              TAB 1: TUGAS KELAS
              ============================================================ */}
          {activeClassTab === 'tugas' && (
            <div className="space-y-6">
              {/* Search & Filter inside this Class */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder={`Cari tugas di Kelas ${selectedWorkspaceKelas.nama_kelas}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                      {(['ALL', 'Tugas', 'Proyek'] as const).map((jenis) => (
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
                  </div>
                </div>
              </div>

              {/* List of Tasks in this Class */}
              {filteredTugas.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <ClipboardList className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900">
                      Belum Ada Tugas di Kelas {selectedWorkspaceKelas.nama_kelas}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {searchQuery || selectedJenis !== 'ALL'
                        ? 'Tidak ada penugasan yang sesuai dengan filter pencarian.'
                        : 'Terbitkan tugas terstruktur atau proyek praktikum pertama untuk kelas ini.'}
                    </p>
                  </div>
                  {!searchQuery && selectedJenis === 'ALL' && (
                    <button
                      onClick={() => onOpenCreateTugas(selectedWorkspaceKelas.id_kelas)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Terbitkan Tugas Pertama</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Backdrop untuk menutup menu dropdown opsi tugas */}
                  {openMenuTugasId && (
                    <div
                      className="fixed inset-0 z-20 bg-transparent"
                      onClick={() => setOpenMenuTugasId(null)}
                    />
                  )}

                  {Object.entries(groupedTugas).map(([topicTitle, tasks]) => (
                    <div key={topicTitle} className="space-y-3">
                      {/* Header Topik Google Classroom */}
                      <div className="flex items-center justify-between border-b-2 border-blue-600 pb-2 pt-1">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                            {topicTitle}
                          </h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          {tasks.length} tugas
                        </span>
                      </div>

                      {/* Daftar Baris Tugas (Google Classroom Style Accordion) */}
                      <div className="space-y-2">
                        {tasks.map((tugas) => {
                          const tId = tugas.id_tugas_kuis || (tugas as unknown as { id?: string }).id || '';
                          const isExpanded = expandedTugasId === tId;
                          const isMenuOpen = openMenuTugasId === tId;
                          const deadlineText = formatClassroomDeadline(
                            tugas.tenggat_waktu || (tugas as unknown as { deadline?: string }).deadline
                          );
                          const postedText = formatClassroomPosted(
                            (tugas as unknown as { created_at?: string; tanggal_unggah?: string }).created_at ||
                              (tugas as unknown as { created_at?: string; tanggal_unggah?: string }).tanggal_unggah
                          );
                          const totalSiswa = tugas.total_siswa || selectedWorkspaceKelas.jumlah_siswa || 0;
                          const diserahkan = tugas.jumlah_mengumpulkan || 0;
                          const ditugaskan = Math.max(0, totalSiswa - diserahkan);
                          const instruksiHtml = formatInstructionHtml(
                            tugas.instruksi || (tugas as unknown as { deskripsi?: string }).deskripsi
                          );
                          const parsedLampiran: { type: string; name: string; url: string }[] = (() => {
                            const raw = tugas.file_lampiran || (tugas as unknown as { file_lampiran?: string }).file_lampiran;
                            if (!raw) return [];
                            try {
                              const parsed = JSON.parse(raw);
                              if (Array.isArray(parsed)) return parsed;
                              if (typeof parsed === 'string' && parsed.trim()) {
                                return [{ type: 'file', name: 'Berkas Lampiran', url: parsed.trim() }];
                              }
                            } catch {
                              if (typeof raw === 'string' && raw.trim() && raw !== '[]' && raw !== '{}') {
                                return [{ type: 'file', name: 'Berkas Lampiran', url: raw.trim() }];
                              }
                            }
                            return [];
                          })();

                          return (
                            <div
                              key={tId}
                              className={`bg-white rounded-2xl transition-all duration-300 ease-in-out overflow-hidden ${
                                isExpanded
                                  ? 'border-2 border-blue-600 shadow-sm my-3'
                                  : 'border border-slate-200/90 hover:border-blue-400 hover:bg-slate-50/70 shadow-2xs my-1.5'
                              }`}
                            >
                              {/* Header Accordion: selalu tampil, klik untuk toggle buka/tutup */}
                              <div
                                onClick={() => setExpandedTugasId(isExpanded ? null : tId)}
                                className={`px-4 sm:px-5 py-3.5 flex items-center justify-between gap-3 sm:gap-4 cursor-pointer select-none transition-colors ${
                                  isExpanded ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50/70'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <ClipboardList className="w-5 h-5" />
                                  </div>
                                  <h4
                                    className={`truncate transition-colors ${
                                      isExpanded
                                        ? 'text-base font-bold text-slate-900'
                                        : 'text-sm font-semibold text-slate-800 hover:text-blue-600'
                                    }`}
                                  >
                                    {tugas.judul}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                                  <span className="text-xs text-slate-500 font-normal">
                                    {deadlineText}
                                  </span>

                                  {/* Indikator Panah Accordion yang berputar halus */}
                                  <ChevronDown
                                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ease-in-out ${
                                      isExpanded ? 'rotate-180 text-blue-600' : ''
                                    }`}
                                  />

                                  {/* Menu Opsi Tiga Titik */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setOpenMenuTugasId(isMenuOpen ? null : tId);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                                      title="Opsi Tugas"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </button>

                                    {isMenuOpen && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-8 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 animate-dropdown-enter"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuTugasId(null);
                                            handleOpenGrading(tugas);
                                          }}
                                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Award className="w-3.5 h-3.5 text-blue-600" />
                                          <span>Tinjau Nilai Siswa</span>
                                        </button>
                                        {onEditTugas && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMenuTugasId(null);
                                              onEditTugas(tugas);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                                            <span>Edit Tugas</span>
                                          </button>
                                        )}
                                        {onDeleteTugas && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenMenuTugasId(null);
                                              onDeleteTugas(tId, tugas.judul);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Hapus Tugas</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenMenuTugasId(null);
                                            navigator.clipboard.writeText(tugas.judul);
                                            toast.success('Judul tugas disalin');
                                          }}
                                          className="w-full px-3.5 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                                          <span>Salin Judul</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Badan Accordion (Animasi Buka-Tutup Halus dengan CSS Grid) */}
                              <div
                                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                                  isExpanded
                                    ? 'grid-rows-[1fr] opacity-100 border-t border-slate-100'
                                    : 'grid-rows-[0fr] opacity-0 border-t-0'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-5 sm:px-6 pb-6 pt-3 space-y-4">
                                    {/* Meta Bar: Tanggal Unggah & Metrik Google Classroom */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-1">
                                      <span className="text-xs text-slate-500 font-medium">
                                        {postedText}
                                      </span>

                                      {/* Metrik Angka Google Classroom: Diserahkan | Ditugaskan */}
                                      <div className="flex items-center gap-6 self-end sm:self-auto">
                                        <div className="text-center min-w-[70px]">
                                          <p className="text-3xl font-light text-slate-800 leading-tight">
                                            {diserahkan}
                                          </p>
                                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                            Diserahkan
                                          </p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200" />
                                        <div className="text-center min-w-[70px]">
                                          <p className="text-3xl font-light text-slate-800 leading-tight">
                                            {ditugaskan}
                                          </p>
                                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                            Ditugaskan
                                          </p>
                                        </div>
                                        {tugas.jumlah_dinilai > 0 && (
                                          <>
                                            <div className="h-8 w-px bg-slate-200" />
                                            <div className="text-center min-w-[70px]">
                                              <p className="text-3xl font-light text-emerald-700 leading-tight">
                                                {tugas.jumlah_dinilai}
                                              </p>
                                              <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                                Dinilai
                                              </p>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {/* Garis Pembatas Halus */}
                                    <div className="border-t border-slate-200" />

                                    {/* Deskripsi & Petunjuk Lengkap (Render HTML WYSIWYG) */}
                                    <div className="text-sm text-slate-800 leading-relaxed font-sans space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_li]:my-1 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline">
                                      {instruksiHtml ? (
                                        <div dangerouslySetInnerHTML={{ __html: instruksiHtml }} />
                                      ) : (
                                        <p className="text-slate-400 italic">
                                          Tidak ada petunjuk khusus untuk tugas ini.
                                        </p>
                                      )}
                                    </div>

                                    {/* Lampiran Tugas (Google Classroom Style: Drive, YouTube, File, Link) */}
                                    {parsedLampiran.length > 0 && (
                                      <div className="pt-2 space-y-2">
                                        <p className="text-xs font-semibold text-slate-700">
                                          Lampiran Tugas ({parsedLampiran.length}):
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
                                                className={`group flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all ${
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
                                                    {att.name || 'Lampiran'}
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

                                    {/* Format Berkas & Rubrik Badges */}
                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                      {tugas.format_file && (
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
                                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                                          <span>
                                            Format pengumpulan:{' '}
                                            <span className="font-semibold uppercase">
                                              {tugas.format_file}
                                            </span>
                                          </span>
                                        </div>
                                      )}
                                      {tugas.rubrik_penilaian && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewRubrikTugas(tugas);
                                          }}
                                          className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>Kriteria Rubrik Penilaian</span>
                                        </button>
                                      )}
                                    </div>

                                    {/* Baris Tindakan Bawah Google Classroom */}
                                    <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                      <div>
                                        <Link
                                          href={`/guru/tugas/${tId}?tab=petunjuk`}
                                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline py-1 px-1 transition-colors cursor-pointer"
                                        >
                                          <span>Lihat petunjuk</span>
                                        </Link>
                                      </div>

                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        {onEditTugas && (
                                          <button
                                            type="button"
                                            onClick={() => onEditTugas(tugas)}
                                            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                          >
                                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Edit</span>
                                          </button>
                                        )}
                                        {onDeleteTugas && (
                                          <button
                                            type="button"
                                            onClick={() => onDeleteTugas(tId, tugas.judul)}
                                            className="px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                          >
                                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                            <span>Hapus</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenGrading(tugas)}
                                          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:shadow transition-all cursor-pointer"
                                        >
                                          <Award className="w-4 h-4" />
                                          <span>Lembar Penilaian Siswa</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 2: ORANG (GOOGLE CLASSROOM STYLE)
              ============================================================ */}
          {activeClassTab === 'orang' && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 md:p-8 shadow-xs space-y-10">
              {isLoadingAnggota ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <p className="text-xs font-semibold">Memuat daftar anggota kelas {selectedWorkspaceKelas.nama_kelas}...</p>
                </div>
              ) : (
                <>
                  {/* Bagian Pengajar */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-blue-600 pb-3">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Pengajar
                      </h2>
                      <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                        {pengajarList.length} Pengajar
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {pengajarList.map((guru, gIdx) => (
                        <div
                          key={guru.id || gIdx}
                          className="py-4 px-2 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-700 via-indigo-700 to-blue-900 text-white font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-blue-100">
                              {getInitials(guru.nama_lengkap)}
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-sm font-bold text-slate-900">
                                {guru.nama_lengkap}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                                  {guru.peran || 'Guru Pengampu'}
                                </span>
                                {guru.mapel && (
                                  <span className="font-medium text-slate-600">
                                    • {guru.mapel}
                                  </span>
                                )}
                                {guru.nip && guru.nip !== '-' && (
                                  <span className="text-slate-400">
                                    • NIP: {guru.nip}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bagian Siswa */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-blue-600 pb-3">
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Siswa
                      </h2>
                      <span className="text-sm font-bold text-slate-600">
                        {rawSiswaList.length} siswa
                      </span>
                    </div>

                    {/* Toolbar Siswa */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 select-none hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={isAllSiswaSelected}
                            onChange={toggleSelectAllSiswa}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Pilih Semua</span>
                        </label>

                        {selectedSiswaIds.length > 0 && (
                          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                              {selectedSiswaIds.length} dipilih
                            </span>
                            <button
                              type="button"
                              onClick={handleCopySelectedNis}
                              className="text-xs font-semibold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Salin NIS siswa terpilih"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Salin NIS</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Pencarian dan Sortir */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-56">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Cari siswa atau NIS..."
                            value={siswaSearchQuery}
                            onChange={(e) => setSiswaSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => setSiswaSortAsc((prev) => !prev)}
                          className="px-2.5 py-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title={`Urutkan: ${siswaSortAsc ? 'A ke Z (Klik untuk Z-A)' : 'Z ke A (Klik untuk A-Z)'}`}
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          <span>{siswaSortAsc ? 'A-Z' : 'Z-A'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Daftar Siswa */}
                    {filteredSiswaList.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl space-y-2">
                        <Users className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-500">
                          {siswaSearchQuery
                            ? `Tidak ada siswa yang cocok dengan "${siswaSearchQuery}"`
                            : 'Belum ada data siswa terdaftar di kelas ini.'}
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {filteredSiswaList.map((siswa, idx) => {
                          const isChecked = selectedSiswaIds.includes(siswa.id);
                          const avatarBg = avatarColorPalettes[idx % avatarColorPalettes.length];
                          return (
                            <div
                              key={siswa.id}
                              className={`py-3.5 px-3 flex items-center justify-between hover:bg-slate-50/80 rounded-xl transition-colors ${
                                isChecked ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectSiswa(siswa.id)}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                                />
                                <div
                                  className={`w-9 h-9 rounded-full ${avatarBg} text-white font-bold flex items-center justify-center text-xs shadow-2xs shrink-0`}
                                >
                                  {getInitials(siswa.nama_lengkap)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 truncate">
                                    {siswa.nama_lengkap}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                                    {siswa.nis && (
                                      <span className="font-mono text-slate-600">
                                        NIS: {siswa.nis}
                                      </span>
                                    )}
                                    {siswa.nisn && (
                                      <span className="text-slate-400 font-mono">
                                        • NISN: {siswa.nisn}
                                      </span>
                                    )}
                                    {siswa.jenis_kelamin && siswa.jenis_kelamin !== '-' && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                        {siswa.jenis_kelamin === 'L' || siswa.jenis_kelamin === 'Laki-laki' ? 'L' : 'P'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 ml-3">
                                {siswa.email && (
                                  <a
                                    href={`mailto:${siswa.email}`}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title={`Kirim email ke ${siswa.nama_lengkap} (${siswa.email})`}
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleCopySingleNis(siswa.nis, siswa.nama_lengkap)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Salin NIS"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
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
