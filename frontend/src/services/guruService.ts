import { fetchAPI } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Kelas, PengumpulanTugas, TugasKuis } from '@/types/lms';

export const DEFAULT_GURU_ID = '298257fb-b4aa-4710-afaa-bbfd63abd5c5';
export const DEFAULT_MAPEL_ID = '1ca770d9-0e57-471b-95c2-aedc472da0b9';
export const DEFAULT_KELAS_ID = 'f0000000-0000-0000-0000-000000000001';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export async function getKelasGuru(): Promise<Kelas[]> {
  try {
    const res = await fetchAPI<ApiResponse<Array<{ id: string; nama_kelas: string; tingkat: number; jurusan: string }>>>('/guru/kelas');
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map((k) => ({
        id_kelas: k.id,
        nama_kelas: k.nama_kelas,
        tingkat: k.tingkat === 10 ? 'X' : k.tingkat === 11 ? 'XI' : 'XII',
        tahun_ajaran: '2025/2026',
        jumlah_siswa: 32,
      }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getTugasGuru(params?: { kelas_id?: string; guru_id?: string }): Promise<TugasKuis[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (params?.guru_id) searchParams.append('guru_id', params.guru_id);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<TugasKuis[]>>(`/guru/tugas${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function createTugasGuru(payload: {
  judul: string;
  deskripsi: string;
  instruksi?: string;
  jenis?: string;
  deadline: string;
  tenggat_waktu?: string;
  format_file?: string;
  rubrik_penilaian?: string;
  file_lampiran?: string;
  kelas_id?: string;
  guru_id?: string;
  mapel_id?: string;
}): Promise<ApiResponse<TugasKuis>> {
  const user = getStoredUser();
  const guruId = payload.guru_id || user?.extra?.guru_id || DEFAULT_GURU_ID;
  const mapelId = payload.mapel_id || user?.extra?.mapel_id || user?.extra?.mapel?.id || DEFAULT_MAPEL_ID;

  const body = {
    guru_id: guruId,
    mapel_id: mapelId,
    kelas_id: payload.kelas_id || DEFAULT_KELAS_ID,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    instruksi: payload.instruksi || payload.deskripsi,
    jenis: payload.jenis || 'Tugas',
    deadline: payload.deadline || payload.tenggat_waktu,
    tenggat_waktu: payload.tenggat_waktu || payload.deadline,
    file_lampiran: payload.file_lampiran || payload.format_file || 'pdf, docx',
    format_file: payload.format_file || 'pdf, docx',
    rubrik_penilaian: payload.rubrik_penilaian || '',
  };

  return await fetchAPI<ApiResponse<TugasKuis>>('/guru/tugas', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTugasSubmissions(tugasId: string): Promise<PengumpulanTugas[]> {
  try {
    const res = await fetchAPI<ApiResponse<PengumpulanTugas[]>>(`/guru/tugas/${tugasId}/submissions`);
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function gradeSubmissionGuru(
  subId: string,
  payload: {
    nilai: number;
    feedback_guru: string;
    tugas_id?: string;
    siswa_id?: string;
  }
): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/submissions/${subId}/grade`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function getMateriGuru(kelasId?: string, guruId?: string) {
  try {
    const params = new URLSearchParams();
    if (kelasId && kelasId !== 'ALL') params.append('kelas_id', kelasId);
    if (guruId && guruId !== 'ALL') params.append('guru_id', guruId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const res = await fetchAPI<ApiResponse<unknown[]>>(`/guru/materi${qs}`);
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('getMateriGuru error:', err);
    return [];
  }
}

export async function uploadMateriGuru(payload: {
  judul: string;
  deskripsi: string;
  tipe: string;
  file_url?: string;
  tipe_file?: string;
  ukuran_mb?: number;
  kelas_id?: string;
  guru_id?: string;
  mapel_id?: string;
  file?: File | null;
}) {
  const user = getStoredUser();
  const guruId = payload.guru_id || user?.extra?.guru_id || DEFAULT_GURU_ID;
  const mapelId = payload.mapel_id || user?.extra?.mapel_id || DEFAULT_MAPEL_ID;
  const kelasId = payload.kelas_id || DEFAULT_KELAS_ID;

  if (payload.file) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('judul', payload.judul);
    formData.append('deskripsi', payload.deskripsi);
    formData.append('tipe', payload.tipe || 'pdf');
    formData.append('tipe_file', payload.tipe_file || 'PDF');
    formData.append('kelas_id', kelasId);
    formData.append('guru_id', guruId);
    formData.append('mapel_id', mapelId);
    if (payload.file_url) {
      formData.append('file_url', payload.file_url);
    }

    return await fetchAPI<ApiResponse<unknown>>('/guru/materi', {
      method: 'POST',
      body: formData,
    });
  }

  const body = {
    guru_id: guruId,
    mapel_id: mapelId,
    kelas_id: kelasId,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    tipe: payload.tipe || 'pdf',
    tipe_file: payload.tipe_file || 'PDF',
    ukuran_mb: payload.ukuran_mb || 2.5,
    file_url: payload.file_url || '',
  };

  return await fetchAPI<ApiResponse<unknown>>('/guru/materi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAbsensiSiswaGuru(absensiId: string, status: string, catatan = '') {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/absensi/${absensiId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: status.toLowerCase(),
      catatan,
    }),
  });
}
