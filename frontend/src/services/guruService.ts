// frontend/src/services/guruService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Default ID Bu Irma & Mapel Matematika XII IPA 1 yang sudah ada di Supabase kamu
export const DEFAULT_GURU_ID = '298257fb-b4aa-4710-afaa-bbfd63abd5c5';
export const DEFAULT_MAPEL_ID = '20000000-0000-0000-0000-000000000001'; // MTK-XII
export const DEFAULT_KELAS_ID = 'f0000000-0000-0000-0000-000000000001'; // XII IPA 1

// 1. Ambil daftar materi dari Supabase via Backend
export async function getMateriGuru(kelasId = DEFAULT_KELAS_ID, guruId = DEFAULT_GURU_ID) {
  try {
    const res = await fetch(`${API_BASE_URL}/guru/materi?kelas_id=${kelasId}&guru_id=${guruId}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Gagal mengambil materi:', err);
    return [];
  }
}

// 2. Simpan Materi Baru ke Supabase
export async function uploadMateriGuru(payload: {
  judul: string;
  deskripsi: string;
  tipe: string;
  file_url: string;
  tipe_file?: string;
  ukuran_mb?: number;
  kelas_id?: string;
}) {
  const body = {
    guru_id: DEFAULT_GURU_ID,
    mapel_id: DEFAULT_MAPEL_ID,
    kelas_id: payload.kelas_id || DEFAULT_KELAS_ID,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    tipe: payload.tipe || 'pdf',
    tipe_file: payload.tipe_file || 'PDF',
    ukuran_mb: payload.ukuran_mb || 2.5,
    file_url: payload.file_url || 'https://drive.google.com/sample',
  };

  const res = await fetch(`${API_BASE_URL}/guru/materi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// 3. Simpan Tugas Baru ke Supabase
export async function createTugasGuru(payload: {
  judul: string;
  deskripsi: string;
  deadline: string;
  file_lampiran?: string;
  kelas_id?: string;
}) {
  const body = {
    guru_id: DEFAULT_GURU_ID,
    mapel_id: DEFAULT_MAPEL_ID,
    kelas_id: payload.kelas_id || DEFAULT_KELAS_ID,
    judul: payload.judul,
    deskripsi: payload.deskripsi,
    deadline: payload.deadline,
    file_lampiran: payload.file_lampiran || '-',
  };

  const res = await fetch(`${API_BASE_URL}/guru/tugas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await res.json();
}

// 4. Update Status Absensi Siswa ke Supabase
export async function updateAbsensiSiswaGuru(absensiId: string, status: string, catatan = '') {
  const res = await fetch(`${API_BASE_URL}/guru/absensi/${absensiId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: status.toLowerCase(),
      catatan: catatan,
    }),
  });
  return await res.json();
}