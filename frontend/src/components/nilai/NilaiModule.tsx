import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  Edit3, 
  Download, 
  Printer, 
  CheckCircle2, 
  Info, 
  Lock, 
  Unlock,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { getStoredUser } from '@/lib/auth';
import { fetchAPI } from '@/lib/api';
import { formatNamaWithGelar } from '@/lib/utils';
import { NilaiSiswa, Kelas } from '../../types/lms';

interface KonfigurasiPenilaianData {
  kkm_default: number;
  bobot_tugas: number;
  bobot_uh: number;
  bobot_uts: number;
  bobot_uas: number;
  batas_predikat_a: number;
  batas_predikat_b: number;
  batas_predikat_c: number;
}

const DEFAULT_CONFIG: KonfigurasiPenilaianData = {
  kkm_default: 75,
  bobot_tugas: 30,
  bobot_uh: 20,
  bobot_uts: 25,
  bobot_uas: 25,
  batas_predikat_a: 85,
  batas_predikat_b: 75,
  batas_predikat_c: 65,
};

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

interface NilaiModuleProps {
  nilaiList: NilaiSiswa[];
  kelasList: Kelas[];
  onUpdateNilai: (updated: NilaiSiswa) => void;
  onKelasChange?: (kelasId: string) => void;
  namaMapel?: string;
  konfigurasi?: KonfigurasiPenilaianData;
}

export const NilaiModule: React.FC<NilaiModuleProps> = ({
  nilaiList,
  kelasList,
  onUpdateNilai,
  onKelasChange,
  namaMapel,
  konfigurasi,
}) => {
  const [selectedKelasId, setSelectedKelasId] = useState(kelasList[0]?.id_kelas || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStudent, setEditingStudent] = useState<NilaiSiswa | null>(null);
  const [tugasVal, setTugasVal] = useState<number>(0);
  const [uhVal, setUhVal] = useState<number>(0);
  const [utsVal, setUtsVal] = useState<number>(0);
  const [uasVal, setUasVal] = useState<number>(0);
  const [feedbackVal, setFeedbackVal] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [cfg, setCfg] = useState<KonfigurasiPenilaianData>(konfigurasi || DEFAULT_CONFIG);

  useEffect(() => {
    if (konfigurasi) {
      setCfg(konfigurasi);
      return;
    }
    let isMounted = true;
    async function loadConfig() {
      try {
        const res = await fetchAPI<{ data: any }>('/pengaturan');
        if (res && res.data && isMounted) {
          setCfg({
            kkm_default: res.data.kkm_default !== undefined && res.data.kkm_default !== null ? Number(res.data.kkm_default) : 75,
            bobot_tugas: res.data.bobot_tugas !== undefined && res.data.bobot_tugas !== null ? Number(res.data.bobot_tugas) : 30,
            bobot_uh: res.data.bobot_uh !== undefined && res.data.bobot_uh !== null ? Number(res.data.bobot_uh) : 20,
            bobot_uts: res.data.bobot_uts !== undefined && res.data.bobot_uts !== null ? Number(res.data.bobot_uts) : 25,
            bobot_uas: res.data.bobot_uas !== undefined && res.data.bobot_uas !== null ? Number(res.data.bobot_uas) : 25,
            batas_predikat_a: res.data.batas_predikat_a !== undefined && res.data.batas_predikat_a !== null ? Number(res.data.batas_predikat_a) : 85,
            batas_predikat_b: res.data.batas_predikat_b !== undefined && res.data.batas_predikat_b !== null ? Number(res.data.batas_predikat_b) : 75,
            batas_predikat_c: res.data.batas_predikat_c !== undefined && res.data.batas_predikat_c !== null ? Number(res.data.batas_predikat_c) : 65,
          });
        }
      } catch {
      }
    }
    loadConfig();
    return () => {
      isMounted = false;
    };
  }, [konfigurasi]);

  useEffect(() => {
    if (!selectedKelasId && kelasList.length > 0) {
      setSelectedKelasId(kelasList[0].id_kelas);
    }
  }, [kelasList, selectedKelasId]);

  const currentKelas = kelasList.find((k) => k.id_kelas === selectedKelasId) || kelasList[0];

  const classGrades = nilaiList.filter((n) => {
    const matchesKelas = !selectedKelasId || n.id_kelas === selectedKelasId;
    const matchesSearch =
      n.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.nis.includes(searchQuery);
    return matchesKelas && matchesSearch;
  });

  const classAvg = classGrades.length
    ? (
        classGrades.reduce((acc, curr) => acc + curr.nilai_akhir, 0) /
        classGrades.length
      ).toFixed(1)
    : '0.0';

  const countA = classGrades.filter((g) => g.skor_huruf === 'A').length;
  const countB = classGrades.filter((g) => g.skor_huruf === 'B').length;
  const countC = classGrades.filter((g) => g.skor_huruf === 'C').length;
  const countD = classGrades.filter((g) => g.skor_huruf === 'D').length;

  const handleOpenEdit = (student: NilaiSiswa) => {
    setEditingStudent(student);
    setTugasVal(student.nilai_tugas);
    setUhVal(student.nilai_uh);
    setUtsVal(student.nilai_uts);
    setUasVal(student.nilai_uas);
    setFeedbackVal(student.feedback || '');
  };

  const calculateFinalScore = (tugas: number, uh: number, uts: number, uas: number): number => {
    const raw = (tugas * cfg.bobot_tugas + uh * cfg.bobot_uh + uts * cfg.bobot_uts + uas * cfg.bobot_uas) / 100;
    return Number(raw.toFixed(1));
  };

  const calculateHuruf = (finalScore: number): 'A' | 'B' | 'C' | 'D' => {
    if (finalScore >= cfg.batas_predikat_a) return 'A';
    if (finalScore >= cfg.batas_predikat_b) return 'B';
    if (finalScore >= cfg.batas_predikat_c) return 'C';
    return 'D';
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const calculatedFinal = calculateFinalScore(tugasVal, uhVal, utsVal, uasVal);
    const calculatedHuruf = calculateHuruf(calculatedFinal);

    const updated: NilaiSiswa = {
      ...editingStudent,
      nilai_tugas: tugasVal,
      nilai_uh: uhVal,
      nilai_uts: utsVal,
      nilai_uas: uasVal,
      nilai_akhir: calculatedFinal,
      skor_huruf: calculatedHuruf,
      feedback: feedbackVal,
    };

    onUpdateNilai(updated);
    setSuccessToast(`Nilai akademik untuk ${editingStudent.nama_siswa} berhasil diperbarui.`);
    setTimeout(() => setSuccessToast(null), 3000);
    setEditingStudent(null);
  };

  const handleSelectKelas = (kId: string) => {
    setSelectedKelasId(kId);
    if (onKelasChange) {
      onKelasChange(kId);
    }
  };

  const handleExportExcel = () => {
    const allClassGrades = nilaiList.filter((n) => !selectedKelasId || n.id_kelas === selectedKelasId);
    const exportList = searchQuery.trim() && classGrades.length > 0 ? classGrades : allClassGrades;

    if (exportList.length === 0) {
      toast.warning('Tidak ada data nilai siswa untuk diekspor');
      return;
    }

    const user = getStoredUser();
    const userGelar = (user?.extra?.gelar as string) || '';
    const teacherName = user?.nama_lengkap
      ? formatNamaWithGelar(user.nama_lengkap, userGelar)
      : 'Guru Pengampu';
    const teacherNip = (user?.extra?.nip as string) || (user?.extra?.nomor_identitas as string) || '-';

    const tanggalUnduh = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const totalSiswa = exportList.length;
    const avgTugas = totalSiswa ? (exportList.reduce((acc, curr) => acc + curr.nilai_tugas, 0) / totalSiswa).toFixed(1) : '0.0';
    const avgUH = totalSiswa ? (exportList.reduce((acc, curr) => acc + curr.nilai_uh, 0) / totalSiswa).toFixed(1) : '0.0';
    const avgUTS = totalSiswa ? (exportList.reduce((acc, curr) => acc + curr.nilai_uts, 0) / totalSiswa).toFixed(1) : '0.0';
    const avgUAS = totalSiswa ? (exportList.reduce((acc, curr) => acc + curr.nilai_uas, 0) / totalSiswa).toFixed(1) : '0.0';
    const calculatedClassAvg = totalSiswa ? (exportList.reduce((acc, curr) => acc + curr.nilai_akhir, 0) / totalSiswa).toFixed(1) : '0.0';

    const countAExp = exportList.filter((g) => g.skor_huruf === 'A').length;
    const countBExp = exportList.filter((g) => g.skor_huruf === 'B').length;
    const countCExp = exportList.filter((g) => g.skor_huruf === 'C').length;
    const countDExp = exportList.filter((g) => g.skor_huruf === 'D').length;

    const rowsHtml = exportList
      .map((g, idx) => {
        const isTuntas = g.nilai_akhir >= cfg.kkm_default;
        const statusClass = isTuntas ? 'status-tuntas' : 'status-remedial';
        const statusText = isTuntas ? 'TUNTAS' : 'REMEDIAL';
        const badgeClass =
          g.skor_huruf === 'A' ? 'badge-a' :
          g.skor_huruf === 'B' ? 'badge-b' :
          g.skor_huruf === 'C' ? 'badge-c' : 'badge-d';

        return `
    <tr>
      <td class="td-cell text-center">${idx + 1}</td>
      <td class="td-cell nis-format">${escapeHtml(g.nis)}</td>
      <td class="td-cell text-left bold">${escapeHtml(g.nama_siswa)}</td>
      <td class="td-cell score-format">${g.nilai_tugas}</td>
      <td class="td-cell score-format">${g.nilai_uh}</td>
      <td class="td-cell score-format">${g.nilai_uts}</td>
      <td class="td-cell score-format">${g.nilai_uas}</td>
      <td class="td-cell num-format bold" style="color: #1d4ed8;">${g.nilai_akhir.toFixed(1)}</td>
      <td class="td-cell ${badgeClass}">${escapeHtml(g.skor_huruf)}</td>
      <td class="td-cell ${statusClass}">${statusText}</td>
      <td class="td-cell text-left" style="font-style: italic; color: #475569;">${escapeHtml(g.feedback || '-')}</td>
    </tr>`;
      })
      .join('');

    const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http:
<head>
<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>Leger Nilai</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
     <x:Print>
      <x:ValidPrinterInfo/>
      <x:PaperSizeIndex>9</x:PaperSizeIndex>
      <x:HorizontalResolution>600</x:HorizontalResolution>
      <x:VerticalResolution>600</x:VerticalResolution>
     </x:Print>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 11pt;
    color: #0f172a;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 14px;
  }
  .header-main {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    color: #1e3a8a;
  }
  .header-sub {
    font-size: 12pt;
    font-weight: bold;
    text-align: center;
    color: #1e293b;
  }
  .header-desc {
    font-size: 9.5pt;
    text-align: center;
    color: #64748b;
  }
  .section-header {
    background-color: #1e3a8a;
    color: #ffffff;
    font-weight: bold;
    font-size: 10.5pt;
    padding: 6px 10px;
  }
  .meta-label {
    background-color: #f1f5f9;
    font-weight: bold;
    font-size: 10pt;
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    width: 20%;
  }
  .meta-val {
    font-size: 10pt;
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    width: 30%;
  }
  .th-col {
    background-color: #1d4ed8;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    border: 1px solid #1e3a8a;
    padding: 8px 6px;
    font-size: 10pt;
    vertical-align: middle;
  }
  .th-col-sub {
    background-color: #2563eb;
    color: #ffffff;
    font-weight: bold;
    text-align: center;
    border: 1px solid #1e3a8a;
    padding: 6px 4px;
    font-size: 9pt;
  }
  .td-cell {
    border: 1px solid #94a3b8;
    padding: 6px 8px;
    font-size: 10pt;
    vertical-align: middle;
  }
  .text-center { text-align: center; }
  .text-left { text-align: left; }
  .text-right { text-align: right; }
  .bold { font-weight: bold; }
  .nis-format { mso-number-format: "\\@"; text-align: center; }
  .num-format { mso-number-format: "0\\.0"; text-align: center; }
  .score-format { mso-number-format: "0"; text-align: center; }
  .badge-a { background-color: #dcfce7; color: #166534; font-weight: bold; text-align: center; }
  .badge-b { background-color: #dbeafe; color: #1e40af; font-weight: bold; text-align: center; }
  .badge-c { background-color: #fef3c7; color: #92400e; font-weight: bold; text-align: center; }
  .badge-d { background-color: #fee2e2; color: #991b1b; font-weight: bold; text-align: center; }
  .status-tuntas { background-color: #dcfce7; color: #15803d; font-weight: bold; text-align: center; }
  .status-remedial { background-color: #fee2e2; color: #b91c1c; font-weight: bold; text-align: center; }
  .footer-row td {
    background-color: #f8fafc;
    border: 1px solid #94a3b8;
    font-weight: bold;
    padding: 7px 8px;
    font-size: 10pt;
  }
  .sig-table td {
    border: none;
    padding: 10px;
    text-align: center;
    font-size: 10pt;
  }
</style>
</head>
<body>
  <table>
    <tr>
      <td colspan="11" class="header-main">SMA NEGERI 2 PADALARANG</td>
    </tr>
    <tr>
      <td colspan="11" class="header-sub">BUKU LEGER NILAI AKADEMIK MATA PELAJARAN</td>
    </tr>
    <tr>
      <td colspan="11" class="header-desc">Sistem Informasi Pembelajaran Terpadu (LMS) &bull; Terakreditasi A &bull; Tahun Ajaran 2025/2026</td>
    </tr>
    <tr><td colspan="11" style="border-bottom: 2px solid #1e3a8a; height: 8px;"></td></tr>
  </table>

  <table>
    <tr>
      <td colspan="4" class="section-header">I. INFORMASI AKADEMIK & KELAS</td>
    </tr>
    <tr>
      <td class="meta-label">Mata Pelajaran</td>
      <td class="meta-val bold">${escapeHtml(namaMapel || 'Mata Pelajaran')}</td>
      <td class="meta-label">Rombongan Belajar (Kelas)</td>
      <td class="meta-val bold">${escapeHtml(currentKelas?.nama_kelas || 'Kelas')}</td>
    </tr>
    <tr>
      <td class="meta-label">Guru Pengampu</td>
      <td class="meta-val">${escapeHtml(teacherName)}</td>
      <td class="meta-label">Batas KKM</td>
      <td class="meta-val bold">${cfg.kkm_default.toFixed(2)}</td>
    </tr>
    <tr>
      <td class="meta-label">NIP Guru</td>
      <td class="meta-val">${escapeHtml(teacherNip)}</td>
      <td class="meta-label">Rata-Rata Nilai Kelas</td>
      <td class="meta-val bold" style="color: #1d4ed8;">${calculatedClassAvg}</td>
    </tr>
    <tr>
      <td class="meta-label">Total Peserta Didik</td>
      <td class="meta-val">${totalSiswa} Siswa</td>
      <td class="meta-label">Tanggal Pengunduhan</td>
      <td class="meta-val">${tanggalUnduh}</td>
    </tr>
  </table>

  <table>
    <tr>
      <td colspan="4" class="section-header">II. RINGKASAN REKAPITULASI PREDIKAT KELAS</td>
    </tr>
    <tr>
      <td class="meta-label" style="text-align: center;">Predikat A (&ge; ${cfg.batas_predikat_a})</td>
      <td class="meta-label" style="text-align: center;">Predikat B (${cfg.batas_predikat_b} - ${(cfg.batas_predikat_a - 0.1).toFixed(1)})</td>
      <td class="meta-label" style="text-align: center;">Predikat C (${cfg.batas_predikat_c} - ${(cfg.batas_predikat_b - 0.1).toFixed(1)})</td>
      <td class="meta-label" style="text-align: center;">Predikat D (&lt; ${cfg.batas_predikat_c})</td>
    </tr>
    <tr>
      <td class="meta-val badge-a" style="text-align: center; font-size: 11pt;">${countAExp} Siswa</td>
      <td class="meta-val badge-b" style="text-align: center; font-size: 11pt;">${countBExp} Siswa</td>
      <td class="meta-val badge-c" style="text-align: center; font-size: 11pt;">${countCExp} Siswa</td>
      <td class="meta-val badge-d" style="text-align: center; font-size: 11pt;">${countDExp} Siswa</td>
    </tr>
  </table>

  <table class="data-table">
    <tr>
      <td colspan="11" class="section-header">III. DAFTAR PEROLEHAN NILAI SISWA</td>
    </tr>
    <tr>
      <th class="th-col" rowspan="2" style="width: 40px;">No</th>
      <th class="th-col" rowspan="2" style="width: 100px;">NIS</th>
      <th class="th-col" rowspan="2" style="width: 220px;">Nama Lengkap Siswa</th>
      <th class="th-col" colspan="4">Komponen Penilaian</th>
      <th class="th-col" rowspan="2" style="width: 90px;">Nilai Akhir</th>
      <th class="th-col" rowspan="2" style="width: 70px;">Predikat</th>
      <th class="th-col" rowspan="2" style="width: 110px;">Status KKM</th>
      <th class="th-col" rowspan="2" style="width: 240px;">Catatan Kompetensi / Feedback</th>
    </tr>
    <tr>
      <th class="th-col-sub" style="width: 80px;">Tugas (${cfg.bobot_tugas}%)</th>
      <th class="th-col-sub" style="width: 80px;">UH (${cfg.bobot_uh}%)</th>
      <th class="th-col-sub" style="width: 80px;">UTS (${cfg.bobot_uts}%)</th>
      <th class="th-col-sub" style="width: 80px;">UAS (${cfg.bobot_uas}%)</th>
    </tr>
    ${rowsHtml}
    <tr class="footer-row">
      <td colspan="3" class="text-center bold">RATA-RATA KOMPONEN</td>
      <td class="num-format bold">${avgTugas}</td>
      <td class="num-format bold">${avgUH}</td>
      <td class="num-format bold">${avgUTS}</td>
      <td class="num-format bold">${avgUAS}</td>
      <td class="num-format bold" style="color: #1d4ed8;">${calculatedClassAvg}</td>
      <td colspan="3" class="text-center italic" style="color: #64748b;">KKM Acuan: ${cfg.kkm_default.toFixed(2)}</td>
    </tr>
  </table>

  <table class="sig-table">
    <tr>
      <td style="width: 50%;">
        Mengetahui,<br/>
        Kepala SMA Negeri 2 Padalarang<br/><br/><br/><br/>
        <strong>Drs. Herman Wijaya, M.M</strong><br/>
        NIP. 196804121995011002
      </td>
      <td style="width: 50%;">
        Padalarang, ${tanggalUnduh}<br/>
        Guru Mata Pelajaran ${escapeHtml(namaMapel || 'Mata Pelajaran')}<br/><br/><br/><br/>
        <strong>${escapeHtml(teacherName)}</strong><br/>
        NIP. ${escapeHtml(teacherNip)}
      </td>
    </tr>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const kelasClean = (currentKelas?.nama_kelas || 'Kelas').replace(/\s+/g, '_');
    const mapelClean = (namaMapel || 'Mata_Pelajaran').replace(/\s+/g, '_');
    const tanggalFile = new Date().toISOString().substring(0, 10);
    link.setAttribute('download', `Leger_Nilai_${kelasClean}_${mapelClean}_${tanggalFile}.xls`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success(`Buku Leger Nilai (${currentKelas?.nama_kelas || 'Kelas'}) berhasil diekspor ke Excel`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Modul Penilaian Akademik Mata Pelajaran
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengelolaan buku nilai (Tugas, UH, UTS, UAS), pembobotan terprogram, dan konversi predikat
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer hover:shadow-md"
            title="Unduh Leger Nilai dalam format Microsoft Excel (.xls)"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>Ekspor Excel (.xls)</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Pilih Kelas:
              </label>
              <select
                value={selectedKelasId}
                onChange={(e) => handleSelectKelas(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {kelasList.map((k) => (
                  <option key={k.id_kelas} value={k.id_kelas}>
                    Kelas {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Cari Siswa:
              </label>
              <input
                type="text"
                placeholder="Nama / NIS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#1d4ed8] text-white rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
              Rata-Rata Nilai Kelas
            </p>
            <h3 className="text-3xl font-extrabold font-mono mt-0.5 tabular-nums">{classAvg}</h3>
            <p className="text-[10px] text-blue-100 mt-0.5 font-medium">Batas KKM: {cfg.kkm_default.toFixed(2)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs grid grid-cols-4 gap-1 text-center">
          <div className="bg-emerald-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-emerald-700">Predikat A</span>
            <p className="text-base font-extrabold text-emerald-800 font-mono mt-0.5">{countA}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-blue-700">Predikat B</span>
            <p className="text-base font-extrabold text-blue-800 font-mono mt-0.5">{countB}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-amber-700">Predikat C</span>
            <p className="text-base font-extrabold text-amber-800 font-mono mt-0.5">{countC}</p>
          </div>
          <div className="bg-rose-50 rounded-xl p-2">
            <span className="text-[10px] font-bold text-rose-700">Predikat D</span>
            <p className="text-base font-extrabold text-rose-800 font-mono mt-0.5">{countD}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Buku Nilai Mata Pelajaran: {namaMapel || 'Mata Pelajaran'} ({currentKelas?.nama_kelas || ''})
            </h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <Unlock className="w-3.5 h-3.5" /> Draf Guru (Dapat Diedit)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No</th>
                <th className="py-3 px-4">Nama Siswa / NIS</th>
                <th className="py-3 px-3 text-center">Tugas ({cfg.bobot_tugas}%)</th>
                <th className="py-3 px-3 text-center">UH ({cfg.bobot_uh}%)</th>
                <th className="py-3 px-3 text-center">UTS ({cfg.bobot_uts}%)</th>
                <th className="py-3 px-3 text-center">UAS ({cfg.bobot_uas}%)</th>
                <th className="py-3 px-3 text-center font-bold text-slate-900">Nilai Akhir</th>
                <th className="py-3 px-3 text-center">Predikat</th>
                <th className="py-3 px-4">Catatan Kompetensi</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classGrades.map((g, idx) => (
                <tr key={g.id_nilai} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{g.nama_siswa}</p>
                    <p className="font-mono text-[11px] text-slate-400">NIS: {g.nis}</p>
                  </td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_tugas}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uh}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uts}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-medium">{g.nilai_uas}</td>
                  <td className="py-3.5 px-3 text-center font-mono font-extrabold text-blue-700 bg-blue-50/60">
                    {g.nilai_akhir.toFixed(1)}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold font-mono ${
                      g.skor_huruf === 'A'
                        ? 'bg-emerald-100 text-emerald-800'
                        : g.skor_huruf === 'B'
                        ? 'bg-blue-100 text-blue-800'
                        : g.skor_huruf === 'C'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {g.skor_huruf}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 max-w-[220px]">
                    <p className="truncate text-slate-600 text-[11px]" title={g.feedback || ''}>
                      {g.feedback || <span className="text-slate-400 italic">Belum ada catatan</span>}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Input & Koreksi Nilai Siswa
                </h3>
                <p className="text-xs text-slate-500">
                  {editingStudent.nama_siswa} • NIS: {editingStudent.nis} ({currentKelas?.nama_kelas || ''})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nilai Tugas (Bobot {cfg.bobot_tugas}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={tugasVal}
                  onChange={(e) => setTugasVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ulangan Harian (Bobot {cfg.bobot_uh}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={uhVal}
                  onChange={(e) => setUhVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UTS (Bobot {cfg.bobot_uts}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={utsVal}
                  onChange={(e) => setUtsVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UAS (Bobot {cfg.bobot_uas}%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={uasVal}
                  onChange={(e) => setUasVal(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono font-bold"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs font-semibold text-blue-900">
              <span>Proyeksi Nilai Akhir Otomatis:</span>
              <span className="text-base font-bold font-mono text-blue-700">
                {calculateFinalScore(tugasVal, uhVal, utsVal, uasVal).toFixed(1)}{' '}
                (Predikat {calculateHuruf(calculateFinalScore(tugasVal, uhVal, utsVal, uasVal))})
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Capaian Kompetensi (Deskripsi Nilai)
              </label>
              <textarea
                rows={2}
                value={feedbackVal}
                onChange={(e) => setFeedbackVal(e.target.value)}
                placeholder="Catatan kemajuan siswa untuk diteruskan ke leger nilai wali kelas..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
