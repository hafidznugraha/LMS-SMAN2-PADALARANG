import java.util.HashMap;
import java.util.Map;

public class EditLaporanAkademik {

    // Atribut data laporan akademik
    private String idLaporan;
    private String mataPelajaran;
    private String kelas;
    private String semester;
    private String deskripsi;

    // Simulasi database laporan akademik
    private static final Map<String, EditLaporanAkademik> databaseLaporan = new HashMap<>();

    // Constructor
    public EditLaporanAkademik(String idLaporan, String mataPelajaran, String kelas, String semester, String deskripsi) {
        this.idLaporan = idLaporan;
        this.mataPelajaran = mataPelajaran;
        this.kelas = kelas;
        this.semester = semester;
        this.deskripsi = deskripsi;
    }

    // Menyimpan data awal ke database (untuk keperluan simulasi)
    public static void simpanLaporanAwal(String idLaporan, String mapel, String kelas, String smt, String desc) {
        databaseLaporan.put(idLaporan, new EditLaporanAkademik(idLaporan, mapel, kelas, smt, desc));
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
        
        boolean isDataLengkap = !databaseLaporan.isEmpty(); 

        // Blok ALT 1: [DATA LENGKAP]
        if (isDataLengkap) {
            System.out.println("Database mengembalikan: [Daftar Laporan]");
            tampilkanDaftarLaporanAkademik();
        } 
        
        // Blok ALT 2: [DATA BELUM LENGKAP]
        if (!isDataLengkap) {
            System.out.println("Database mengembalikan: Data belum lengkap / kosong.");
            tampilkanPesanDataBelumLengkap();
        }
    }

    // ALT: [DATA LENGKAP] - Tampilkan daftar laporan akademik
    public void tampilkanDaftarLaporanAkademik() {
        System.out.println("\n=== TAMPILKAN DAFTAR LAPORAN AKADEMIK ===");
        for (EditLaporanAkademik lap : databaseLaporan.values()) {
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

    // Alur Edit: Walikelas / Kurikulum memilih laporan yang akan diperbarui
    public void pilihLaporanYangAkanDiperbarui(String idLaporanPilihan) {
        System.out.println("\nWalikelas / Kurikulum memilih laporan yang akan diperbarui (ID: " + idLaporanPilihan + ").");
        requestEditLaporan(idLaporanPilihan);
    }

    // UI Laporan Akademik -> Laporan Akademik: requestEditLaporan()
    public void requestEditLaporan(String idLaporanPilihan) {
        System.out.println("UI Laporan Akademik memanggil requestEditLaporan().");
        ambilDetailLaporan(idLaporanPilihan);
    }

    // Laporan Akademik -> Database: ambilDetailLaporan()
    public void ambilDetailLaporan(String idLaporanPilihan) {
        System.out.println("Laporan Akademik memanggil ambilDetailLaporan() ke Database.");
        
        EditLaporanAkademik detail = databaseLaporan.get(idLaporanPilihan);
        if (detail != null) {
            System.out.println("Database mengembalikan: [Detail Laporan]");
            formEditLaporan(detail);
        } else {
            System.out.println("Detail laporan tidak ditemukan di database.");
        }
    }

    // Laporan Akademik -> UI Laporan Akademik: Form edit laporan
    public void formEditLaporan(EditLaporanAkademik detail) {
        System.out.println("Laporan Akademik mengirim Form edit laporan ke UI.");
        tampilkanFormEditLaporan(detail);
    }

    // UI Laporan Akademik -> Walikelas / Kurikulum: Tampilkan form edit laporan
    public void tampilkanFormEditLaporan(EditLaporanAkademik detail) {
        System.out.println("\n=== FORM EDIT LAPORAN AKADEMIK ===");
        System.out.println("ID Laporan    : " + detail.idLaporan);
        System.out.println("Mata Pelajaran: " + detail.mataPelajaran);
        System.out.println("Kelas         : " + detail.kelas);
        System.out.println("Semester      : " + detail.semester);
        System.out.println("Deskripsi Lama: " + detail.deskripsi);
    }

    // Walikelas / Kurikulum: Mengisi data baru dan simpan
    public void mengisiDataBaruDanSimpan(String idLaporan, String mapelBaru, String kelasBaru, String smtBaru, String descBaru) {
        System.out.println("\nWalikelas / Kurikulum mengisi data baru dan menyimpan.");
        sendUpdateLaporan(idLaporan, mapelBaru, kelasBaru, smtBaru, descBaru);
    }

    // UI Laporan Akademik -> Laporan Akademik: sendUpdateLaporan()
    public void sendUpdateLaporan(String idLaporan, String mapelBaru, String kelasBaru, String smtBaru, String descBaru) {
        System.out.println("UI memanggil sendUpdateLaporan() ke Laporan Akademik.");
        updateLaporanAkademikDatabase(idLaporan, mapelBaru, kelasBaru, smtBaru, descBaru);
    }

    // Laporan Akademik -> Database: Update laporan akademik
    public void updateLaporanAkademikDatabase(String idLaporan, String mapelBaru, String kelasBaru, String smtBaru, String descBaru) {
        System.out.println("Laporan Akademik mengirim perintah 'Update laporan akademik' ke Database.");

        if (databaseLaporan.containsKey(idLaporan)) {
            // Memperbarui data di database simulasi
            EditLaporanAkademik updatedData = new EditLaporanAkademik(idLaporan, mapelBaru, kelasBaru, smtBaru, descBaru);
            databaseLaporan.put(idLaporan, updatedData);

            System.out.println("Database mengembalikan: [Update success]");
            updateSuccess();
        } else {
            System.out.println("Database: Gagal update, laporan tidak ditemukan.");
        }
    }

    // Database -> Laporan Akademik: Update success
    public void updateSuccess() {
        System.out.println("Laporan Akademik menerima status 'Update success'.");
        laporanAkademikBerhasilDiperbarui();
    }

    // Laporan Akademik -> UI Laporan Akademik: Laporan akademik berhasil diperbarui
    public void laporanAkademikBerhasilDiperbarui() {
        System.out.println("Laporan Akademik mengirim notifikasi 'Laporan akademik berhasil diperbarui' ke UI.");
        notifikasiBerhasil();
    }

    // UI Laporan Akademik -> Walikelas / Kurikulum: Notifikasi berhasil
    public void notifikasiBerhasil() {
        System.out.println("UI menampilkan: [Notifikasi berhasil] kepada Walikelas / Kurikulum.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Mocking data awal ke database agar [DATA LENGKAP]
        simpanLaporanAwal("LAP-001", "Matematika", "XI-IPA-1", "Genap", "Nilai rata-rata kelas meningkat.");

        // Inisialisasi objek utama
        EditLaporanAkademik app = new EditLaporanAkademik("", "", "", "", "");

        // 1. Walikelas membuka menu laporan akademik
        app.memukaMenuLaporanAkademik();

        // 2. Walikelas memilih laporan yang akan diperbarui (misal: "LAP-001")
        app.pilihLaporanYangAkanDiperbarui("LAP-001");

        // 3. Walikelas mengisi data baru dan menyimpan
        app.mengisiDataBaruDanSimpan("LAP-001", "Matematika Lanjutan", "XI-IPA-1", "Genap", "Nilai rata-rata kelas sangat memuaskan.");
    }
}