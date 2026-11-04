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
  mapel_id?: string;
  mapel?: MataPelajaran;
  user?: User;
  kelas_binaan?: Kelas[];
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

export type StatusLaporan = "Draf" | "DitinjauWali" | "DisahkanKurikulum";

export interface NilaiMapelDetail {
  kode_mapel: string;
  nama_mapel: string;
  kategori: string;
  pengetahuan: number;
  keterampilan: number;
  nilai_akhir: number;
  predikat: "A" | "B" | "C" | "D";
  capaian: string;
}

export interface LaporanAkademik {
  id: string;
  siswa_id: string;
  nis: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: "Laki-laki" | "Perempuan";
  kelas_id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  wali_kelas_nama: string;
  semester: "Ganjil" | "Genap";
  tahun_ajaran: string;
  nilai_pengetahuan: number;
  nilai_keterampilan: number;
  rata_rata_akhir: number;
  predikat_akhir: "A" | "B" | "C" | "D";
  deskripsi_nilai: string;
  catatan_wali: string;
  kehadiran: {
    hadir: number;
    sakit: number;
    izin: number;
    alfa: number;
    persentase: number;
  };
  nilai_mapel: NilaiMapelDetail[];
  status_laporan: StatusLaporan;
  disahkan_pada?: string;
  disahkan_oleh?: string;
  catatan_revisi?: string;
}

export interface RombelLegerSummary {
  kelas_id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  wali_kelas_nama: string;
  total_siswa: number;
  disahkan_count: number;
  ditinjau_count: number;
  draf_count: number;
  rata_rata_kelas: number;
  status_rombel: StatusLaporan;
}

export interface PengaturanSekolah {
  id: string;
  nama_sekolah: string;
  npsn: string;
  akreditasi: string;
  alamat: string;
  telepon: string;
  email: string;
  website: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  waka_kurikulum: string;
  nip_waka_kurikulum: string;
  tahun_ajaran_aktif: string;
  semester_aktif: "Ganjil" | "Genap";
  tenggat_kunci_raport?: string;
  durasi_kbm_menit: number;
  jam_masuk: string;
  jam_pulang: string;
  status_sinkronisasi_dapodik: string;
  terakhir_sinkron?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AbsensiRombelRekap {
  kelas_id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  wali_kelas: string;
  total_siswa: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  persen_kehadiran: number;
}

export interface AbsensiSummary {
  total_siswa: number;
  rata_rata_kehadiran: number;
  total_hadir_hari_ini: number;
  total_sakit_hari_ini: number;
  total_izin_hari_ini: number;
  total_alpa_hari_ini: number;
  total_terlambat_hari_ini: number;
  tanggal_hari_ini: string;
  rombel_rekap: AbsensiRombelRekap[];
}

export interface AbsensiPeringatanItem {
  siswa_id: string;
  nama_siswa: string;
  nisn: string;
  nis: string;
  kelas_id: string;
  nama_kelas: string;
  wali_kelas: string;
  jumlah_alpa: number;
  jumlah_sakit: number;
  jumlah_izin: number;
  jumlah_terlambat: number;
  total_hari: number;
  persen_kehadiran: number;
  tingkat_risiko: string;
  catatan_terakhir: string;
}

export interface AbsensiDetailItem {
  id: string;
  siswa_id: string;
  nama_siswa: string;
  nisn: string;
  nama_kelas: string;
  tanggal: string;
  waktu_masuk?: string;
  status: "hadir" | "sakit" | "izin" | "alpa" | "terlambat";
  catatan: string;
}
