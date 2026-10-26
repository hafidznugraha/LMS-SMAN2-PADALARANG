package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: GURU (Subclass dari USER)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class GURU extends USER {

    // Atribut sesuai Class Diagram (+ public)
    public String nip;
    public String bidang_studi;

    // Default Constructor
    public GURU() {
        super();
        this.role = "Guru";
    }

    // Parameterized Constructor
    public GURU(String ID_user, String email, String password, String nama_lengkap, String nip, String bidang_studi) {
        super(ID_user, email, password, nama_lengkap, "Guru");
        this.nip = nip;
        this.bidang_studi = bidang_studi;
    }

    // Method + inputMateri()
    public void inputMateri() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " (NIP: " + this.nip + ") melakukan input materi baru untuk mapel " + this.bidang_studi);
    }

    // Method + mengupdateMateri()
    public void mengupdateMateri() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " mengupdate materi pelajaran.");
    }

    // Method + menghapusMateri()
    public void menghapusMateri() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " menghapus materi pelajaran.");
    }

    // Method + inputTugasKuis()
    public void inputTugasKuis() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " membuat dan menginput tugas/kuis baru.");
    }

    // Method + mengupdateTugasKuis()
    public void mengupdateTugasKuis() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " memperbarui data tugas/kuis.");
    }

    // Method + menghapusTugasKuis()
    public void menghapusTugasKuis() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " menghapus tugas/kuis.");
    }

    // Method + inputNilai()
    public void inputNilai() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " menginput nilai hasil evaluasi siswa.");
    }

    // Method + mengupdateNilai()
    public void mengupdateNilai() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " mengubah nilai siswa.");
    }

    // Method + menghapusNilai()
    public void menghapusNilai() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " menghapus entri nilai siswa.");
    }

    // Method + verifikasiAbsensi()
    public void verifikasiAbsensi() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " memverifikasi daftar kehadiran presensi siswa.");
    }

    // Method + mengeditAbsensi()
    public void mengeditAbsensi() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " mengedit status kehadiran absensi siswa.");
    }

    // Method + melihatMateri()
    public void melihatMateri() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " melihat daftar materi pelajaran yang telah diunggah.");
    }

    // Method + melihatTugasKuis()
    public void melihatTugasKuis() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " melihat rincian tugas dan kuis aktif.");
    }

    // Method + melihatNilaiSiswa()
    public void melihatNilaiSiswa() {
        System.out.println("[GURU] Guru " + this.nama_lengkap + " melihat daftar nilai seluruh siswa.");
    }

    // Method - rekapNilaiSiswa() (private pada diagram)
    private void rekapNilaiSiswa() {
        System.out.println("[GURU] Melakukan rekapitulasi nilai siswa secara internal untuk mapel " + this.bidang_studi);
    }

    // Helper publik untuk memicu rekapitulasi internal
    public void jalankanRekapNilaiSiswa() {
        rekapNilaiSiswa();
    }

    // Getter & Setter
    public String getNip() { return nip; }
    public void setNip(String nip) { this.nip = nip; }

    public String getBidang_studi() { return bidang_studi; }
    public void setBidang_studi(String bidang_studi) { this.bidang_studi = bidang_studi; }
}
