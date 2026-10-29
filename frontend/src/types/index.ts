export type UserRole = "kurikulum" | "guru" | "wali_kelas" | "siswa";

export interface User {
  id: string;
  username: string;
  nama_lengkap: string;
  email: string;
  role: UserRole;
  is_active: boolean;
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
