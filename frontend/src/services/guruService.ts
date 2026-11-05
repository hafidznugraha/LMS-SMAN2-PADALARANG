import { fetchAPI } from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Absensi, JadwalPelajaran, Kelas, Materi, NilaiSiswa, PengumpulanTugas, TugasKuis } from '@/types/lms';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export async function getKelasGuru(): Promise<Kelas[]> {
  try {
    const res = await fetchAPI<ApiResponse<Array<{ id: string; nama_kelas: string; tingkat: number; jurusan: string }>>>('/guru/kelas');
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((k) => ({
        id_kelas: k.id,
        nama_kelas: k.nama_kelas,
        tingkat: k.tingkat === 10 ? 'X' : k.tingkat === 11 ? 'XI' : 'XII',
        tahun_ajaran: '',
        jumlah_siswa: 0,
      }));
    }
    return [];
  } catch (err) {
    console.warn(err);
    return [];
  }
}

export async function getTugasGuru(params?: { kelas_id?: string; guru_id?: string; jenis?: string }): Promise<TugasKuis[]> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.kelas_id) searchParams.append('kelas_id', params.kelas_id);
    if (params?.guru_id) searchParams.append('guru_id', params.guru_id);
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
    console.warn(err);
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

export async function getTugasSubmissions(tugasId: string): Promise<PengumpulanTugas[]> {
  try {
    const res = await fetchAPI<ApiResponse<PengumpulanTugas[]>>(`/guru/tugas/${tugasId}/submissions`);
    if (res?.success && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  } catch (err) {
    console.warn(err);
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
    const searchParams = new URLSearchParams();
    if (kelasId) searchParams.append('kelas_id', kelasId);
    if (guruId) searchParams.append('guru_id', guruId);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

    const res = await fetchAPI<ApiResponse<Materi[]>>(`/guru/materi${qs}`);
    return res?.success && Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.warn(err);
    return [];
  }
}

export async function uploadMateriGuru(payload: {
  judul: string;
  deskripsi: string;
  tipe: string;
  file_url: string;
  tipe_file?: string;
  ukuran_mb?: number;
  kelas_id: string;
  guru_id?: string;
  mapel_id?: string;
}): Promise<ApiResponse<Materi>> {
  const user = getStoredUser();
  const body = {
    guru_id: payload.guru_id || (user?.extra?.guru_id as string) || (user?.id as string) || '',
    mapel_id: payload.mapel_id || (user?.extra?.mapel_id as string) || (user?.extra?.mapel?.id as string) || '',
    kelas_id: payload.kelas_id,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    tipe: payload.tipe || 'pdf',
    tipe_file: payload.tipe_file || 'PDF',
    ukuran_mb: payload.ukuran_mb || 0,
    file_url: payload.file_url,
  };

  return await fetchAPI<ApiResponse<Materi>>('/guru/materi', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function deleteMateriGuru(id: string): Promise<ApiResponse<unknown>> {
  return await fetchAPI<ApiResponse<unknown>>(`/guru/materi/${id}`, {
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
    console.warn(err);
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
    console.warn(err);
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
    console.warn(err);
    return [];
  }
}
