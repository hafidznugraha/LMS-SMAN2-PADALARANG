export type UserRole = "kurikulum" | "guru" | "wali_kelas" | "siswa";

export interface User {
  id: string;
  username: string;
  nama_lengkap: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface Guru {
  id: string;
  user_id: string;
  nip: string;
  gelar: string;
  no_telepon?: string;
  user?: User;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  wali_guru_id?: string;
  wali_guru?: Guru;
}

export interface MataPelajaran {
  id: string;
  kode_mapel: string;
  nama_mapel: string;
  kategori: string;
}

export interface JadwalPelajaran {
  id: string;
  kelas_id: string;
  guru_id: string;
  mapel_id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  kelas?: Kelas;
  guru?: Guru;
  mapel?: MataPelajaran;
}

export interface SiswaProfile {
  id: string;
  nis: string;
  nisn: string;
  nama_lengkap: string;
  kelas: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  email: string;
  no_telepon?: string;
  alamat?: string;
}

export interface JadwalItem {
  id: string;
  kelas: string;
  guru: string;
  mapel: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  is_bentrok?: boolean;
}

export interface ConflictWarning {
  guru: string;
  mapelKelas: string;
  waktu: string;
}

export interface MetricData {
  title: string;
  value: string | number;
  subtitle: string;
  variant?: "primary" | "white" | "success" | "cyan";
}
