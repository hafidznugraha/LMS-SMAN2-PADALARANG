package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: SISWA (Subclass dari USER)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class SISWA extends USER {

    // Atribut sesuai Class Diagram (+ public, - private)
    public String nisn; // <<Unique>>
    public String kelas;
    private String wali_kelas_id;

    // Default Constructor
    public SISWA() {
        super();
        this.role = "Siswa";
    }

    // Parameterized Constructor
    public SISWA(String ID_user, String email, String password, String nama_lengkap, String nisn, String kelas, String wali_kelas_id) {
        super(ID_user, email, password, nama_lengkap, "Siswa");
        this.nisn = nisn;
        this.kelas = kelas;
        this.wali_kelas_id = wali_kelas_id;
    }

    // Method + melihatMateriPembelajaran()
    public void melihatMateriPembelajaran() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " (NISN: " + this.nisn + ") melihat materi pelajaran.");
    }

    // Method + mengunduhMateriPembelajaran()
    public void mengunduhMateriPembelajaran() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " mengunduh berkas materi pelajaran.");
    }

    // Method + mengumpulkanTugas()
    public void mengumpulkanTugas() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " mengunggah dan mengumpulkan tugas.");
    }

    // Method + menghapusTugas()
    public void menghapusTugas() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " membatalkan/menghapus pengumpulan tugas.");
    }

    // Method + mengupdateTugas()
    public void mengupdateTugas() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " memperbarui berkas tugas yang telah dikumpulkan.");
    }

    // Method + melihatTugas()
    public void melihatTugas() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " melihat daftar tugas aktif dan tenggat waktunya.");
    }

    // Method + melihatNilai()
    public void melihatNilai() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " melihat nilai hasil evaluasi tugas/kuis.");
    }

    // Method + melakukanAbsensi()
    public void melakukanAbsensi() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " melakukan presensi mandiri pada sesi jam pelajaran.");
    }

    // Method + melihatAbsensi()
    public void melihatAbsensi() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " melihat riwayat presensi kehadiran.");
    }

    // Method + mengumpulkanKuis()
    public void mengumpulkanKuis() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " mengumpulkan jawaban kuis online.");
    }

    // Method + menghapusKuis()
    public void menghapusKuis() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " menghapus pengajuan kuis.");
    }

    // Method + mengupdateKuis()
    public void mengupdateKuis() {
        System.out.println("[SISWA] Siswa " + this.nama_lengkap + " memperbarui jawaban kuis sebelum batas waktu.");
    }

    // Getter & Setter
    public String getNisn() { return nisn; }
    public void setNisn(String nisn) { this.nisn = nisn; }

    public String getKelas() { return kelas; }
    public void setKelas(String kelas) { this.kelas = kelas; }

    public String getWali_kelas_id() { return wali_kelas_id; }
    public void setWali_kelas_id(String wali_kelas_id) { this.wali_kelas_id = wali_kelas_id; }
}
