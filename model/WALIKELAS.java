package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: WALIKELAS (Subclass dari USER)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class WALIKELAS extends USER {

    // Atribut sesuai Class Diagram (+ public)
    public String kelas_diampu;

    // Default Constructor
    public WALIKELAS() {
        super();
        this.role = "Wali Kelas";
    }

    // Parameterized Constructor
    public WALIKELAS(String ID_user, String email, String password, String nama_lengkap, String kelas_diampu) {
        super(ID_user, email, password, nama_lengkap, "Wali Kelas");
        this.kelas_diampu = kelas_diampu;
    }

    // Method + melihatLaporanAkademik()
    public void melihatLaporanAkademik() {
        System.out.println("[WALIKELAS] Wali Kelas " + this.nama_lengkap + " melihat laporan akademik untuk kelas binaan: " + this.kelas_diampu);
    }

    // Method + menerimaNotifikasiLaporan()
    public void menerimaNotifikasiLaporan() {
        System.out.println("[WALIKELAS] Wali Kelas " + this.nama_lengkap + " menerima notifikasi: Laporan akademik kelas " + this.kelas_diampu + " telah diperbarui.");
    }

    // Getter & Setter
    public String getKelas_diampu() { return kelas_diampu; }
    public void setKelas_diampu(String kelas_diampu) { this.kelas_diampu = kelas_diampu; }
}
