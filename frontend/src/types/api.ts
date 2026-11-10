export type Role = "kurikulum" | "guru" | "wali_kelas" | "siswa";

export interface APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: unknown;
}

export interface Kelas {
  id: string;
  nama_kelas: string;
  tingkat: number;
  jurusan: string;
  total_siswa?: number;
  jumlah_siswa?: number;
  tahun_ajaran?: string;
}

export interface Siswa {
  id: string;
  user_id: string;
  nis: string;
  nisn: string;
  kelas_id?: string;
  jenis_kelamin: string;
  no_telepon: string;
  alamat: string;
  kelas?: Kelas;
  user?: {
    id: string;
    username: string;
    nama_lengkap: string;
    email: string;
  };
}

export interface SiswaDashboard {
  nama_lengkap: string;
  nama_kelas: string;
  semester: string;
  tahun_ajaran: string;
  materi_tersedia: number;
  jumlah_mapel: number;
  tugas_total: number;
  tugas_selesai: number;
  tugas_menunggu: number;
  tugas_mendesak: number;
  tugas_dinilai: number;
  rata_rata_nilai: number | null;
  kehadiran_persen: number;
  hari_tercatat: number;
  absen_hari_ini: {
    sudah: boolean;
    status?: string;
    waktu_masuk?: string;
  };
  hari_ini: string;                 // <- tambah
  jadwal_hari_ini: SiswaJadwalItem[]; // <- tambah
}

export interface SiswaMateri {
  id: string;
  judul: string;
  deskripsi: string;
  mapel_id: string;
  nama_mapel: string;
  nama_guru: string;
  tipe_file: string;
  ukuran_mb: number;
  created_at: string;
}

export interface SiswaMapelOption {
  id: string;
  nama_mapel: string;
}

export interface SiswaMateriList {
  items: SiswaMateri[];
  mapel: SiswaMapelOption[];
}

export interface SiswaMateriDownload {
  file_url: string;
  judul: string;
  tipe_file: string;
}

export interface SiswaPengumpulan {
  id: string;
  nama_file: string;
  catatan: string;
  nilai: number | null;
  feedback_guru: string;
  status: "dikumpulkan" | "dinilai";
  submitted_at: string;
  graded_at?: string;
}

export interface SiswaTugas {
  id: string;
  judul: string;
  deskripsi: string;
  format_file?: string;
  file_lampiran?: string;
  nama_mapel: string;
  nama_guru: string;
  deadline: string;
  status: "belum" | "dikumpulkan" | "dinilai";
  lewat_deadline: boolean;
  mendesak: boolean;
  pengumpulan?: SiswaPengumpulan;
}

export interface SiswaAbsensiRiwayat {
  id: string;
  tanggal: string; // YYYY-MM-DD
  status: string;
  waktu_masuk: string;
  catatan: string;
}

export interface SiswaAbsensiRekap {
  hadir: number;
  terlambat: number;
  sakit: number;
  izin: number;
  alpa: number;
  total: number;
  persen: number;
}

export interface SiswaAbsensiHariIni {
  sudah: boolean;
  status?: string;
  waktu_masuk?: string;
  catatan?: string;
  bisa_absen: boolean;
  alasan?: string;
}

export interface SiswaAbsensi {
  bulan: string;
  tanggal: string;
  jam_masuk: string;
  jam_pulang: string;
  hari_ini: SiswaAbsensiHariIni;
  rekap: SiswaAbsensiRekap;
  riwayat: SiswaAbsensiRiwayat[];
}

export interface SiswaNilaiItem {
  id: string;
  jenis: "Tugas" | "UlanganHarian" | "UTS" | "UAS" | string;
  skor: number;
  huruf: string;
  feedback: string;
  created_at: string;
}

export interface SiswaNilaiMapel {
  mapel_id: string;
  nama_mapel: string;
  rata_rata: number;
  predikat: string;
  items: SiswaNilaiItem[];
}

export interface SiswaNilai {
  rata_rata: number | null;
  mapel: SiswaNilaiMapel[];
}

export interface SiswaRaporRingkas {
  id: string;
  semester: string;
  tahun_ajaran: string;
  rata_rata: number | null;
  predikat: string;
  disahkan_pada: string | null;
}

export interface SiswaRaporMapel {
  kode: string;
  nama: string;
  kategori: string;
  tugas: number | null;
  uh: number | null;
  uts: number | null;
  uas: number | null;
  nilai_akhir: number;
  predikat: string;
}

export interface SiswaRaporDetail {
  id_laporan: string;
  semester: string;
  tahun_ajaran: string;
  nama_sekolah: string;
  alamat_sekolah: string;
  telepon_sekolah: string;
  kepala_sekolah: string;
  nip_kepala_sekolah: string;
  nama_siswa: string;
  nis: string;
  nisn: string;
  kelas: string;
  tingkat: number;
  jurusan: string;
  wali_kelas: string;
  wali_nip: string;
  nilai_pengetahuan: number | null;
  nilai_keterampilan: number | null;
  rata_rata: number | null;
  predikat: string;
  deskripsi_nilai: string;
  catatan_wali: string;
  disahkan_pada: string | null;
  disahkan_oleh: string;
  kehadiran: {
    hadir: number;
    terlambat: number;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
    persen: number;
  };
  nilai_mapel: SiswaRaporMapel[];
}

export interface SiswaJadwalItem {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  mapel_id: string;
  nama_mapel: string;
  kode_mapel: string;
  guru_id: string;
  nama_guru: string;
  nip_guru: string;
  kelas_id: string;
  nama_kelas: string;
}

export interface SiswaJadwalResponse {
  nama_kelas: string;
  tingkat: string;
  items: SiswaJadwalItem[];
}

export interface SiswaJadwalItem {
  id: string;
  nama_mapel: string;
  nama_guru: string;
  jam_mulai: string;
  jam_selesai: string;
  ruang: string;
  status: "selesai" | "berlangsung" | "akan_datang";
}