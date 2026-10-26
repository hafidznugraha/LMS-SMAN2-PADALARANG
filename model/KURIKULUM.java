package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: KURIKULUM (Subclass dari USER)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class KURIKULUM extends USER {

    // Default Constructor
    public KURIKULUM() {
        super();
        this.role = "Kurikulum";
    }

    // Parameterized Constructor
    public KURIKULUM(String ID_user, String email, String password, String nama_lengkap) {
        super(ID_user, email, password, nama_lengkap, "Kurikulum");
    }

    // Method + tampilkanDaftarSiswa()
    public void tampilkanDaftarSiswa() {
        System.out.println("[KURIKULUM] " + this.nama_lengkap + " menampilkan master data seluruh siswa SMAN 2 Padalarang.");
    }

    // Method + tambahDataSiswa()
    public void tambahDataSiswa() {
        System.out.println("[KURIKULUM] Menambahkan data siswa baru ke sistem.");
    }

    // Method + updateDataSiswa()
    public void updateDataSiswa() {
        System.out.println("[KURIKULUM] Memperbarui data siswa pada database.");
    }

    // Method + hapusDataSiswa()
    public void hapusDataSiswa() {
        System.out.println("[KURIKULUM] Menghapus data siswa dari sistem.");
    }

    // Method + memilihPeriodeLaporan()
    public void memilihPeriodeLaporan() {
        System.out.println("[KURIKULUM] Memilih periode laporan akademik semester berjalan.");
    }

    // Method + meninjauLaporan()
    public void meninjauLaporan() {
        System.out.println("[KURIKULUM] Meninjau draft laporan akademik dan rekapitulasi raport.");
    }

    // Method + menyimpanLaporan()
    public void menyimpanLaporan() {
        System.out.println("[KURIKULUM] Menyimpan data laporan akademik ke database.");
    }

    // Method + kirimNotifikasiLaporanBaru()
    public void kirimNotifikasiLaporanBaru() {
        System.out.println("[KURIKULUM] Mengirimkan notifikasi publikasi laporan baru ke Wali Kelas dan Siswa.");
    }

    // Method + melihatLaporanAkademik()
    public void melihatLaporanAkademik() {
        System.out.println("[KURIKULUM] Melihat rekapitulasi laporan akademik tingkat sekolah.");
    }

    // Method + rekapAbsensi()
    public void rekapAbsensi() {
        System.out.println("[KURIKULUM] Menghasilkan rekapitulasi kehadiran seluruh kelas SMAN 2 Padalarang.");
    }
}
