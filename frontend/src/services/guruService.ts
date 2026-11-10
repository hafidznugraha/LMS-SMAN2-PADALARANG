import { fetchAPI } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { 
  Absensi, 
  JadwalPelajaran, 
  Kelas, 
  Materi, 
  NilaiSiswa, 
  PengumpulanTugas, 
  TugasKuis,
  TopikTugas,
  KomentarTugas
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

export async function getKelasGuru(guruId?: string): Promise<Kelas[]> {
  try {
    const user = getStoredUser();
    const effectiveGuruId =
      guruId !== undefined
        ? guruId
        : ((user?.extra?.guru_id as string) || (user?.id as string) || '');

    const searchParams = new URLSearchParams();
    if (effectiveGuruId && effectiveGuruId !== 'ALL') {
      searchParams.append('guru_id', effectiveGuruId);
    }
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<
      ApiResponse<
        Array<{
          id: string;
          nama_kelas: string;
          tingkat: number;
          jurusan: string;
          total_siswa?: number;
          jumlah_siswa?: number;
          tahun_ajaran?: string;
        }>
      >
    >(`/guru/kelas${qs}`);
    if (res?.success && Array.isArray(res.data)) {
      return res.data.map((k) => ({
        id_kelas: k.id,
        nama_kelas: k.nama_kelas,
        tingkat: k.tingkat === 10 ? 'X' : k.tingkat === 11 ? 'XI' : 'XII',
        tahun_ajaran: k.tahun_ajaran || '2026/2027',
        jumlah_siswa: Number(k.total_siswa ?? k.jumlah_siswa ?? 0),
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

export async function getTugasDetailGuru(tugasId: string): Promise<ApiResponse<TugasKuis>> {
  return await fetchAPI<ApiResponse<TugasKuis>>(`/guru/tugas/${tugasId}`);
}

export async function createTugasGuru(payload: {
  judul: string;
  deskripsi: string;
  instruksi?: string;
  topik?: string;
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
    topik: payload.topik || '',
    jenis: payload.jenis || 'Tugas',
    deadline: payload.deadline || payload.tenggat_waktu,
    tenggat_waktu: payload.tenggat_waktu || payload.deadline,
    file_lampiran: payload.file_lampiran || '',
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
    topik?: string;
    jenis?: string;
    deadline?: string;
    tenggat_waktu?: string;
    format_file?: string;
    rubrik_penilaian?: string;
    file_lampiran?: string;
    kelas_id?: string;
    mapel_id?: string;
  }
): Promise<ApiResponse<TugasKuis>> {
  const body = {
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    instruksi: payload.instruksi || payload.deskripsi,
    topik: payload.topik,
    jenis: payload.jenis,
    deadline: payload.deadline || payload.tenggat_waktu,
    tenggat_waktu: payload.tenggat_waktu || payload.deadline,
    format_file: payload.format_file,
    rubrik_penilaian: payload.rubrik_penilaian,
    file_lampiran: payload.file_lampiran,
    kelas_id: payload.kelas_id,
    mapel_id: payload.mapel_id,
  };

  return await fetchAPI<ApiResponse<TugasKuis>>('/guru/tugas/' + tugasId, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function getTopikKelas(kelasId: string, mapelId?: string): Promise<ApiResponse<TopikTugas[]>> {
  const query = new URLSearchParams();
  if (kelasId) query.set('kelas_id', kelasId);
  if (mapelId) query.set('mapel_id', mapelId);
  return await fetchAPI<ApiResponse<TopikTugas[]>>(`/guru/topik?${query.toString()}`);
}

export async function createTopikKelas(kelasId: string, namaTopik: string, mapelId?: string): Promise<ApiResponse<TopikTugas>> {
  return await fetchAPI<ApiResponse<TopikTugas>>('/guru/topik', {
    method: 'POST',
    body: JSON.stringify({
      kelas_id: kelasId,
      nama_topik: namaTopik,
      mapel_id: mapelId,
    }),
  });
}

export async function uploadLampiranTugas(file: File): Promise<ApiResponse<{ file_url: string; file_name: string; file_size: number }>> {
  const formData = new FormData();
  formData.append('file', file);

  return await fetchAPI<ApiResponse<{ file_url: string; file_name: string; file_size: number }>>('/guru/tugas/upload', {
    method: 'POST',
    body: formData,
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

export async function updateAbsensiSiswaGuru(
  absensiId: string,
  status: string,
  catatan = '',
  extra?: { siswa_id?: string; kelas_id?: string; tanggal?: string }
): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/absensi/${absensiId}`, {
    method: 'PUT',
    body: JSON.stringify({
      status: status.toLowerCase(),
      catatan,
      siswa_id: extra?.siswa_id,
      kelas_id: extra?.kelas_id,
      tanggal: extra?.tanggal,
    }),
  });
}

export async function verifyAbsensiGuru(kelasId: string, tanggal: string): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>('/guru/absensi/verify', {
    method: 'POST',
    body: JSON.stringify({
      kelas_id: kelasId,
      tanggal,
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
        jumlah_siswa: Number((j.kelas as { total_siswa?: number; jumlah_siswa?: number })?.total_siswa ?? (j.kelas as { total_siswa?: number; jumlah_siswa?: number })?.jumlah_siswa ?? 0),
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

export interface PengajarItem {
  id: string;
  nama_lengkap: string;
  gelar?: string;
  nip: string;
  email: string;
  peran: string;
  mapel: string;
}

export interface SiswaItem {
  id: string;
  user_id: string;
  nama_lengkap: string;
  nis: string;
  nisn: string;
  email: string;
  jenis_kelamin: string;
}

export interface AnggotaKelasData {
  pengajar: PengajarItem[];
  siswa: SiswaItem[];
  total_siswa: number;
  nama_kelas?: string;
}

export async function getAnggotaKelas(
  kelasId: string,
  params?: { guru_id?: string; mapel?: string }
): Promise<AnggotaKelasData | null> {
  try {
    const sp = new URLSearchParams();
    if (params?.guru_id) sp.append('guru_id', params.guru_id);
    if (params?.mapel) sp.append('mapel', params.mapel);
    const qs = sp.toString() ? `?${sp.toString()}` : '';

    const res = await fetchAPI<ApiResponse<AnggotaKelasData>>(
      `/guru/kelas/${encodeURIComponent(kelasId)}/anggota${qs}`
    );
    if (res?.success && res.data) {
      return res.data;
    }
    const fallbackRes = await fetchAPI<ApiResponse<AnggotaKelasData>>(
      `/guru/anggota-kelas?kelas_id=${encodeURIComponent(kelasId)}${params?.guru_id ? `&guru_id=${encodeURIComponent(params.guru_id)}` : ''}`
    );
    if (fallbackRes?.success && fallbackRes.data) {
      return fallbackRes.data;
    }
    return null;
  } catch (err) {
    console.error('Gagal mengambil data anggota kelas:', err);
    return null;
  }
}

export async function getKomentarTugas(tugasId: string): Promise<KomentarTugas[]> {
  try {
    const res = await fetchAPI<ApiResponse<KomentarTugas[]>>(
      `/guru/tugas/${encodeURIComponent(tugasId)}/komentar`
    );
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.error('Gagal mengambil komentar tugas:', err);
    return [];
  }
}

export async function createKomentarTugas(
  tugasId: string,
  pesan: string
): Promise<{ success: boolean; data?: KomentarTugas; message?: string }> {
  try {
    const res = await fetchAPI<ApiResponse<KomentarTugas>>(
      `/guru/tugas/${encodeURIComponent(tugasId)}/komentar`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pesan }),
      }
    );
    if (res?.success && res.data) {
      return { success: true, data: res.data, message: res.message };
    }
    return { success: false, message: res?.message || 'Gagal menambahkan komentar' };
  } catch (err: unknown) {
    console.error('Gagal menambahkan komentar tugas:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menambahkan komentar',
    };
  }
}

export async function deleteKomentarTugas(
  tugasId: string,
  komentarId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetchAPI<ApiResponse<null>>(
      `/guru/tugas/${encodeURIComponent(tugasId)}/komentar/${encodeURIComponent(komentarId)}`,
      {
        method: 'DELETE',
      }
    );
    if (res?.success) {
      return { success: true, message: res.message };
    }
    return { success: false, message: res?.message || 'Gagal menghapus komentar' };
  } catch (err: unknown) {
    console.error('Gagal menghapus komentar tugas:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghapus komentar',
    };
  }
}
