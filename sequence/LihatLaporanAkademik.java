import java.util.HashMap;
import java.util.Map;

public class LihatLaporanAkademik {

    // Atribut data laporan akademik
    private String idLaporan;
    private String mataPelajaran;
    private String kelas;
    private String semester;
    private String deskripsi;

    // Simulasi database laporan akademik
    private static final Map<String, LihatLaporanAkademik> databaseLaporan = new HashMap<>();

    // Constructor
    public LihatLaporanAkademik(String idLaporan, String mataPelajaran, String kelas, String semester, String deskripsi) {
        this.idLaporan = idLaporan;
        this.mataPelajaran = mataPelajaran;
        this.kelas = kelas;
        this.semester = semester;
        this.deskripsi = deskripsi;
    }

    // Menyimpan data awal ke database (untuk keperluan simulasi)
    public static void simpanLaporanAwal(String idLaporan, String mapel, String kelas, String smt, String desc) {
        databaseLaporan.put(idLaporan, new LihatLaporanAkademik(idLaporan, mapel, kelas, smt, desc));
    }

    // 1. Walikelas / Kurikulum: Membuka menu laporan akademik
    public void memukaMenuLaporanAkademik() {
        System.out.println("Walikelas / Kurikulum membuka menu laporan akademik.");
        requestDaftarLaporan();
    }

    // 2. UI Laporan Akademik -> Laporan Akademik: requestDaftarLaporan()
    public void requestDaftarLaporan() {
        System.out.println("UI Laporan Akademik memanggil requestDaftarLaporan().");
        queryLaporanAkademikSiswa();
    }

    // 3. Laporan Akademik -> Database: Query laporan akademik siswa
    public void queryLaporanAkademikSiswa() {
        System.out.println("Laporan Akademik mengirim query ke Database...");
        
        // Simulasi pengecekan kelengkapan data
        boolean isDataLengkap = !databaseLaporan.isEmpty(); 

        if (isDataLengkap) {
            // Masuk Blok ALT: [DATA LENGKAP]
            System.out.println("Database mengembalikan: [Daftar Laporan]");
            tampilkanDaftarLaporanAkademik();
        } else {
            // Masuk Blok ALT: [DATA BELUM LENGKAP]
            System.out.println("Database mengembalikan: Data belum lengkap / kosong.");
            tampilkanPesanDataBelumLengkap();
        }
    }

    // ALT: [DATA LENGKAP] - Tampilkan daftar laporan akademik ke UI
    public void tampilkanDaftarLaporanAkademik() {
        System.out.println("\n=== TAMPILKAN DAFTAR LAPORAN AKADEMIK ===");
        for (LihatLaporanAkademik lap : databaseLaporan.values()) {
            System.out.println("ID: " + lap.idLaporan + " | Mapel: " + lap.mataPelajaran + " | Kelas: " + lap.kelas);
        }
    }

    // ALT: [DATA BELUM LENGKAP] - Pesan "Data belum lengkap"
    public void tampilkanPesanDataBelumLengkap() {
        System.out.println("Laporan Akademik mengirim pesan: 'Data belum lengkap' ke UI.");
        tampilkanPesanUI();
    }

    public void tampilkanPesanUI() {
        System.out.println("UI menampilkan pesan kepada Walikelas / Kurikulum: 'Data belum lengkap'.");
    }

    // Alur Lanjutan: Walikelas / Kurikulum memilih salah satu laporan
    public void pilihSalahSatuLaporan(String idLaporanPilihan) {
        System.out.println("\nWalikelas / Kurikulum memilih salah satu laporan (ID: " + idLaporanPilihan + ").");
        lihatLaporan(idLaporanPilihan);
    }

    // Laporan Akademik -> lihatLaporan()
    public void lihatLaporan(String idLaporanPilihan) {
        System.out.println("Laporan Akademik mengeksekusi lihatLaporan().");
        ambilDetailLaporan(idLaporanPilihan);
    }

    // Laporan Akademik -> Database: ambilDetailLaporan()
    public void ambilDetailLaporan(String idLaporanPilihan) {
        System.out.println("Laporan Akademik memanggil ambilDetailLaporan() ke Database.");
        
        LihatLaporanAkademik detail = databaseLaporan.get(idLaporanPilihan);
        if (detail != null) {
            System.out.println("Database mengembalikan: [Detail Laporan]");
            tampilkanDetailLaporan(detail);
        } else {
            System.out.println("Detail laporan tidak ditemukan di database.");
        }
    }

    // Menampilkan detail laporan ke UI dan Aktor
    public void tampilkanDetailLaporan(LihatLaporanAkademik detail) {
        System.out.println("\n=== DETAIL LAPORAN AKADEMIK ===");
        System.out.println("ID Laporan    : " + detail.idLaporan);
        System.out.println("Mata Pelajaran: " + detail.mataPelajaran);
        System.out.println("Kelas         : " + detail.kelas);
        System.out.println("Semester      : " + detail.semester);
        System.out.println("Deskripsi     : " + detail.deskripsi);
        
        detailLaporanTampil();
    }

    public void detailLaporanTampil() {
        System.out.println("Notifikasi UI: Detail laporan tampil kepada Walikelas / Kurikulum.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Mocking data awal ke database agar [DATA LENGKAP]
        simpanLaporanAwal("LAP-001", "Matematika", "XI-IPA-1", "Genap", "Nilai rata-rata kelas meningkat.");
        simpanLaporanAwal("LAP-002", "Fisika", "XI-IPA-2", "Genap", "Perlu peningkatan pada praktikum lab.");

        // Inisialisasi objek utama dengan nama kelas yang spesifik
        LihatLaporanAkademik app = new LihatLaporanAkademik("", "", "", "", "");

        // 1. Sesuai sequence: Walikelas / Kurikulum membuka menu laporan akademik
        app.memukaMenuLaporanAkademik();

        // 2. Sesuai sequence: Walikelas / Kurikulum memilih salah satu laporan (contoh: "LAP-001")
        app.pilihSalahSatuLaporan("LAP-001");
    }
}