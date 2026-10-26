package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: NILAI (Entitas Penilaian Hasil Belajar Siswa)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class NILAI {

    // Atribut sesuai Class Diagram (+ public, - private)
    public String id_nilai;
    public String id_pengumpulan;
    public String nisn;
    public Float nilai_angka;
    public String komentar;
    public String nip;

    // Default Constructor
    public NILAI() {
    }

    // Parameterized Constructor
    public NILAI(String id_nilai, String id_pengumpulan, String nisn, Float nilai_angka, String komentar, String nip) {
        this.id_nilai = id_nilai;
        this.id_pengumpulan = id_pengumpulan;
        this.nisn = nisn;
        this.nilai_angka = nilai_angka;
        this.komentar = komentar;
        this.nip = nip;
    }

    // Method + GetNilai()
    public Float GetNilai() {
        return this.nilai_angka;
    }

    // Method + LihatNilai()
    public void LihatNilai() {
        System.out.println("==================== DETAIL NILAI SISWA ====================");
        System.out.println("ID Nilai         : " + this.id_nilai);
        System.out.println("ID Pengumpulan   : " + this.id_pengumpulan);
        System.out.println("NISN Siswa       : " + this.nisn);
        System.out.println("Skor Angka       : " + this.nilai_angka);
        System.out.println("Feedback/Komentar: " + this.komentar);
        System.out.println("NIP Guru Penilai : " + this.nip);
        System.out.println("============================================================");
    }

    // Method + inputNilai()
    public void inputNilai() {
        System.out.println("[NILAI] Memasukkan skor angka (" + this.nilai_angka + ") untuk submisi ID: " + this.id_pengumpulan);
        simpanNilai();
    }

    // Method + UpdateNilai()
    public void UpdateNilai() {
        System.out.println("[NILAI] Memperbarui nilai ID " + this.id_nilai + " menjadi " + this.nilai_angka + " (Feedback: " + this.komentar + ")");
    }

    // Method + HapusNilai()
    public void HapusNilai() {
        System.out.println("[NILAI] Menghapus data nilai ID: " + this.id_nilai);
    }

    // Method + FormInput_nilai()
    public void FormInput_nilai() {
        System.out.println("[NILAI] Menampilkan antarmuka Form Input Nilai & Umpan Balik Guru.");
    }

    // Method - simpanNilai() (private pada diagram)
    private void simpanNilai() {
        System.out.println("[NILAI] Menyimpan record nilai ke tabel tb_nilai di database.");
    }

    // Getter & Setter
    public String getId_nilai() { return id_nilai; }
    public void setId_nilai(String id_nilai) { this.id_nilai = id_nilai; }

    public String getId_pengumpulan() { return id_pengumpulan; }
    public void setId_pengumpulan(String id_pengumpulan) { this.id_pengumpulan = id_pengumpulan; }

    public String getNisn() { return nisn; }
    public void setNisn(String nisn) { this.nisn = nisn; }

    public Float getNilai_angka() { return nilai_angka; }
    public void setNilai_angka(Float nilai_angka) { this.nilai_angka = nilai_angka; }

    public String getKomentar() { return komentar; }
    public void setKeterangan(String komentar) { this.komentar = komentar; }

    public String getNip() { return nip; }
    public void setNip(String nip) { this.nip = nip; }
}
