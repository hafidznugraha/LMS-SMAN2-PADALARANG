import { fetchAPI } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { 
  Absensi, 
  JadwalPelajaran, 
  Kelas, 
  Materi, 
  NilaiSiswa, 
  PengumpulanTugas, 
  TugasKuis 
} from '@/types/lms';

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
        tahun_ajaran: '2026/2027',
        jumlah_siswa: 32,
      }));
    }
    return [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

export async function getTugasGuru(params?: { kelas_id?: string; guru_id?: string; jenis?: string }): Promise<TugasKuis[]> {
  try {
    const user = getStoredUser();
    const effectiveGuruId =
      params?.guru_id !== undefined
        ? params.guru_id
        : ((user?.extra?.guru_id as string) || (user?.id as string) || '');

    const searchParams = new URLSearchParams();
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (effectiveGuruId && effectiveGuruId !== 'ALL') searchParams.append('guru_id', effectiveGuruId);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<TugasKuis[]>>(`/guru/tugas${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      if (params?.jenis) {
        return res.data.filter((t) => t.jenis?.toLowerCase() === params.jenis?.toLowerCase());
      }
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
  kelas_id: string;
  guru_id?: string;
  mapel_id?: string;
}): Promise<ApiResponse<TugasKuis>> {
  const user = getStoredUser();
  const guruId = payload.guru_id || (user?.extra?.guru_id as string) || (user?.id as string) || '';
  const mapelId = payload.mapel_id || (user?.extra?.mapel_id as string) || (user?.extra?.mapel?.id as string) || '';

  const body = {
    guru_id: guruId,
    mapel_id: mapelId,
    kelas_id: payload.kelas_id,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    instruksi: payload.instruksi || payload.deskripsi,
    jenis: payload.jenis || 'Tugas',
    deadline: payload.deadline || payload.tenggat_waktu,
    tenggat_waktu: payload.tenggat_waktu || payload.deadline,
    file_lampiran: payload.file_lampiran || payload.format_file || '',
    format_file: payload.format_file || '',
    rubrik_penilaian: payload.rubrik_penilaian || '',
  };

  return await fetchAPI<ApiResponse<TugasKuis>>('/guru/tugas', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTugasGuru(
  tugasId: string,
  payload: {
    judul?: string;
    deskripsi?: string;
    instruksi?: string;
    jenis?: string;
    deadline?: string;
    tenggat_waktu?: string;
    format_file?: string;
    rubrik_penilaian?: string;
    kelas_id?: string;
    mapel_id?: string;
  }
): Promise<ApiResponse<TugasKuis>> {
  const body = {
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    instruksi: payload.instruksi || payload.deskripsi,
    jenis: payload.jenis,
    deadline: payload.deadline || payload.tenggat_waktu,
    tenggat_waktu: payload.tenggat_waktu || payload.deadline,
    format_file: payload.format_file,
    rubrik_penilaian: payload.rubrik_penilaian,
    kelas_id: payload.kelas_id,
    mapel_id: payload.mapel_id,
  };

  return await fetchAPI<ApiResponse<TugasKuis>>('/guru/tugas/' + tugasId, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteTugasGuru(tugasId: string): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>('/guru/tugas/' + tugasId, {
    method: 'DELETE',
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

export async function getMateriGuru(kelasId?: string, guruId?: string): Promise<Materi[]> {
  try {
    const user = getStoredUser();
    const effectiveGuruId =
      guruId !== undefined
        ? guruId
        : ((user?.extra?.guru_id as string) || (user?.id as string) || '');

    const params = new URLSearchParams();
    if (kelasId && kelasId !== 'ALL') params.append('kelas_id', kelasId);
    if (effectiveGuruId && effectiveGuruId !== 'ALL') params.append('guru_id', effectiveGuruId);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetchAPI<ApiResponse<Materi[]>>(`/guru/materi${qs}`);
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
  kelas_id: string;
  guru_id?: string;
  mapel_id?: string;
  file?: File | null;
}): Promise<ApiResponse<unknown>> {
  const user = getStoredUser();
  const guruId = payload.guru_id || (user?.extra?.guru_id as string) || (user?.id as string) || '';
  const mapelId = payload.mapel_id || (user?.extra?.mapel_id as string) || (user?.extra?.mapel as { id?: string })?.id || '';
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
    if (payload.ukuran_mb) {
      formData.append('ukuran_mb', String(payload.ukuran_mb));
    }
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

export async function updateMateriGuru(
  materiId: string,
  payload: {
    judul: string;
    deskripsi: string;
    tipe?: string;
    tipe_file?: string;
    ukuran_mb?: number;
    file_url?: string;
    kelas_id?: string;
    mapel_id?: string;
    file?: File | null;
  }
): Promise<ApiResponse<unknown>> {
  if (payload.file) {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('judul', payload.judul);
    formData.append('deskripsi', payload.deskripsi);
    if (payload.tipe) formData.append('tipe', payload.tipe);
    if (payload.tipe_file) formData.append('tipe_file', payload.tipe_file);
    if (payload.kelas_id) formData.append('kelas_id', payload.kelas_id);
    if (payload.mapel_id) formData.append('mapel_id', payload.mapel_id);
    if (payload.ukuran_mb) formData.append('ukuran_mb', String(payload.ukuran_mb));
    if (payload.file_url) formData.append('file_url', payload.file_url);

    return await fetchAPI<ApiResponse<unknown>>(`/guru/materi/${encodeURIComponent(materiId)}`, {
      method: 'PUT',
      body: formData,
    });
  }

  return await fetchAPI<ApiResponse<unknown>>(`/guru/materi/${encodeURIComponent(materiId)}`, {
    method: 'PUT',
    body: JSON.stringify({
      judul: payload.judul,
      deskripsi: payload.deskripsi,
      tipe: payload.tipe || (payload.tipe_file || 'PDF').toLowerCase(),
      tipe_file: payload.tipe_file || 'PDF',
      ukuran_mb: payload.ukuran_mb,
      file_url: payload.file_url,
      kelas_id: payload.kelas_id,
      mapel_id: payload.mapel_id,
    }),
  });
}

export async function deleteMateriGuru(materiId: string): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/materi/${encodeURIComponent(materiId)}`, {
    method: 'DELETE',
  });
}

export async function getAbsensiGuru(kelasId: string, tanggal?: string): Promise<Absensi[]> {
  try {
    const searchParams = new URLSearchParams();
    if (kelasId) searchParams.append('kelas_id', kelasId);
    if (tanggal) searchParams.append('tanggal', tanggal);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<Absensi[]>>(`/guru/absensi${qs}`);
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('getAbsensiGuru error:', err);
    return [];
  }
}

export async function updateAbsensiSiswaGuru(absensiId: string, status: string, catatan = ''): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/absensi/${absensiId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: status.toLowerCase(),
      catatan,
    }),
  });
}

export async function getNilaiGuru(kelasId: string, mapelId?: string, guruId?: string): Promise<NilaiSiswa[]> {
  try {
    const searchParams = new URLSearchParams();
    if (kelasId) searchParams.append('kelas_id', kelasId);
    if (mapelId) searchParams.append('mapel_id', mapelId);
    if (guruId) searchParams.append('guru_id', guruId);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<NilaiSiswa[]>>(`/guru/nilai${qs}`);
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn('getNilaiGuru error:', err);
    return [];
  }
}

export async function updateNilaiGuru(payload: {
  siswa_id: string;
  guru_id?: string;
  mapel_id?: string;
  nilai_tugas: number;
  nilai_uh: number;
  nilai_uts: number;
  nilai_uas: number;
  feedback?: string;
}): Promise<ApiResponse<unknown>> {
  const user = getStoredUser();
  const guruId = payload.guru_id || (user?.extra?.guru_id as string) || (user?.id as string) || '';
  const mapelId = payload.mapel_id || (user?.extra?.mapel_id as string) || (user?.extra?.mapel?.id as string) || '';

  return await fetchAPI<ApiResponse<unknown>>('/guru/nilai', {
    method: 'PUT',
    body: JSON.stringify({
      ...payload,
      guru_id: guruId,
      mapel_id: mapelId,
    }),
  });
}

export async function getJadwalGuru(params?: { guru_id?: string; kelas_id?: string; hari?: string }): Promise<JadwalPelajaran[]> {
  try {
    const user = getStoredUser();
    const guruId = params?.guru_id || (user?.extra?.guru_id as string) || (user?.id as string) || '';
    const searchParams = new URLSearchParams();
    if (guruId) searchParams.append('guru_id', guruId);
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (params?.hari) searchParams.append('hari', params.hari);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<Array<{
      id: string;
      guru_id: string;
      mapel_id: string;
      kelas_id: string;
      hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
      jam_mulai: string;
      jam_selesai: string;
      ruang?: string;
      kelas?: { nama_kelas?: string };
      mapel?: { nama_mapel?: string };
    }>>>(`/jadwal${qs}`);

    if (res?.success && Array.isArray(res.data)) {
      return res.data.map((j) => ({
        id_jadwal: j.id,
        id_guru: j.guru_id,
        id_mapel: j.mapel_id,
        nama_mapel: j.mapel?.nama_mapel || 'Mata Pelajaran',
        id_kelas: j.kelas_id,
        nama_kelas: j.kelas?.nama_kelas || 'Kelas',
        jumlah_siswa: 0,
        hari: j.hari,
        jam_mulai: j.jam_mulai,
        jam_selesai: j.jam_selesai,
        ruangan: j.ruang || '-',
      }));
    }
    return [];
  } catch (err) {
    console.warn('getJadwalGuru error:', err);
    return [];
  }
}