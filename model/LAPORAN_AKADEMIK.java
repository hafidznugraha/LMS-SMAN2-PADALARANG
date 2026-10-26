package model;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: LAPORAN_AKADEMIK (Entitas Rekapitulasi Laporan Akademik)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class LAPORAN_AKADEMIK {

    // Atribut sesuai Class Diagram (+ public, - private)
    public String id_laporan;
    public String periode;
    private String NIP;

    // Default Constructor
    public LAPORAN_AKADEMIK() {
    }

    // Parameterized Constructor
    public LAPORAN_AKADEMIK(String id_laporan, String periode, String NIP) {
        this.id_laporan = id_laporan;
        this.periode = periode;
        this.NIP = NIP;
    }

    // Method + GetLaporan()
    public LAPORAN_AKADEMIK GetLaporan() {
        System.out.println("[LAPORAN_AKADEMIK] Mengambil data laporan akademik ID: " + this.id_laporan);
        return this;
    }

    // Method + LihatLaporan()
    public void LihatLaporan() {
        System.out.println("[LAPORAN_AKADEMIK] Membuka laporan akademik periode: " + this.periode + " (Penanggung Jawab NIP: " + this.NIP + ")");
        tampilkanLaporan();
    }

    // Method - rekapDataNilaiOtomatis() (private pada diagram)
    private void rekapDataNilaiOtomatis() {
        System.out.println("[LAPORAN_AKADEMIK] Sistem secara otomatis merekapitulasi seluruh nilai tugas dan kuis semester " + this.periode);
    }

    // Method - rekapDataAbsensiOtomatis() (private pada diagram)
    private void rekapDataAbsensiOtomatis() {
        System.out.println("[LAPORAN_AKADEMIK] Sistem secara otomatis menghitung persentase kehadiran siswa semester " + this.periode);
    }

    // Method + tampilkanLaporan()
    public void tampilkanLaporan() {
        // Memicu rekapitulasi data otomatis
        rekapDataNilaiOtomatis();
        rekapDataAbsensiOtomatis();

        System.out.println("========================================================================");
        System.out.println("            LAPORAN HASIL EVALUASI BELAJAR SMAN 2 PADALARANG            ");
        System.out.println("========================================================================");
        System.out.println("ID Laporan   : " + this.id_laporan);
        System.out.println("Periode Smt  : " + this.periode);
        System.out.println("NIP Verifikator : " + this.NIP);
        System.out.println("Status       : Terverifikasi oleh Kurikulum dan Wali Kelas");
        System.out.println("========================================================================");
    }

    // Getter & Setter
    public String getId_laporan() { return id_laporan; }
    public void setId_laporan(String id_laporan) { this.id_laporan = id_laporan; }

    public String getPeriode() { return periode; }
    public void setPeriode(String periode) { this.periode = periode; }

    public String getNIP() { return NIP; }
    public void setNIP(String NIP) { this.NIP = NIP; }
}
