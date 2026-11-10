/**
 * Types according to PRD SMAN 2 Padalarang LMS
 * Kamus Data Bagian 5 (users, guru, kelas, mata_pelajaran, materi, tugas_kuis, pengumpulan_tugas, absensi, nilai, jadwal_pelajaran)
 */

export type UserRole = 'Kurikulum' | 'Guru' | 'Siswa' | 'WaliKelas';

export interface User {
  id_user: string;
  email: string;
  nama_lengkap: string;
  role: UserRole;
  aktif: boolean;
  avatar_url?: string;
}

export interface Guru {
  id_guru: string;
  id_user: string;
  nip: string;
  bidang_studi: string;
  is_wali_kelas?: boolean;
  wali_kelas_id?: string;
  nama_kelas_binaan?: string;
}

export interface Kelas {
  id_kelas: string;
  nama_kelas: string;
  tingkat: 'X' | 'XI' | 'XII';
  tahun_ajaran: string;
  jumlah_siswa: number;
}

export interface Siswa {
  id_siswa: string;
  id_user: string;
  nis: string;
  nama_lengkap: string;
  id_kelas: string;
  nama_kelas: string;
  jurusan: 'MIPA' | 'IPS' | 'Bahasa';
  email: string;
}

export interface MataPelajaran {
  id_mapel: string;
  kode_mapel: string;
  nama_mapel: string;
}

export type MateriFormat = 'PDF' | 'DOCX' | 'PPTX' | 'MP4' | 'LINK';

export interface Materi {
  id_materi: string;
  id_guru: string;
  id_mapel: string;
  nama_mapel: string;
  id_kelas: string;
  nama_kelas: string;
  judul_materi: string;
  deskripsi: string;
  format_file: MateriFormat;
  file_url: string;
  file_size?: string;
  tanggal_unggah: string;
  unduhan_count: number;
  deleted_at?: string | null;
}

export type JenisPenugasan = 'Tugas' | 'Proyek';

export interface TugasKuis {
  id_tugas_kuis: string;
  id_guru: string;
  nama_guru?: string;
  gelar_guru?: string;
  id_mapel: string;
  nama_mapel: string;
  id_kelas: string;
  nama_kelas: string;
  judul: string;
  instruksi: string;
  topik?: string;
  jenis: JenisPenugasan;
  tenggat_waktu: string; // ISO datetime string
  format_file: string; // e.g., "pdf,docx,zip"
  file_lampiran?: string;
  rubrik_penilaian: string;
  total_siswa: number;
  jumlah_mengumpulkan: number;
  jumlah_dinilai: number;
  created_at?: string;
  deleted_at?: string | null;
}

export interface TopikTugas {
  id: string;
  kelas_id: string;
  mapel_id: string;
  guru_id?: string;
  nama_topik: string;
  created_at?: string;
}

export interface KomentarTugas {
  id: string;
  tugas_id: string;
  user_id: string;
  nama_user: string;
  gelar_user?: string;
  peran_user: string;
  pesan: string;
  created_at: string;
  waktu_format?: string;
}

export type StatusKumpul = 'Tepat Waktu' | 'Terlambat' | 'Belum Mengumpulkan';

export interface PengumpulanTugas {
  id_pengumpulan: string;
  id_tugas_kuis: string;
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  file_tugas?: string;
  file_name?: string;
  file_size?: string;
  catatan_siswa?: string;
  tanggal_kumpul?: string;
  status_kumpul: StatusKumpul;
  nilai?: number | null;
  feedback?: string;
  tanggal_dinilai?: string;
}

export type StatusKehadiran = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

export interface Absensi {
  id_absensi: string;
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  id_guru: string;
  id_mapel: string;
  id_kelas: string;
  tanggal: string; // YYYY-MM-DD
  waktu: string;   // HH:mm:ss
  status_kehadiran: StatusKehadiran;
  keterangan?: string;
  bukti_surat_url?: string;
  diverifikasi_oleh_guru: boolean;
}

export type JenisPenilaian = 'Tugas' | 'UlanganHarian' | 'UTS' | 'UAS';

export interface NilaiSiswa {
  id_nilai: string;
  id_siswa: string;
  nama_siswa: string;
  nis: string;
  id_guru: string;
  id_mapel: string;
  id_kelas: string;
  nilai_tugas: number;
  nilai_uh: number;
  nilai_uts: number;
  nilai_uas: number;
  nilai_akhir: number;
  skor_huruf: 'A' | 'B' | 'C' | 'D';
  feedback?: string;
  status_kunci: 'Draf' | 'Terkunci';
}

export interface JadwalPelajaran {
  id_jadwal: string;
  id_guru: string;
  id_mapel: string;
  nama_mapel: string;
  id_kelas: string;
  nama_kelas: string;
  jumlah_siswa: number;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jam_mulai: string; // "07:00"
  jam_selesai: string; // "09:00"
  ruangan: string;
}

export interface Notifikasi {
  id_notifikasi: string;
  judul_pesan: string;
  isi_pesan: string;
  tipe_notifikasi: 'Tugas' | 'Absensi' | 'Nilai' | 'Sistem';
  status_dibaca: boolean;
  created_at: string;
}
