import java.util.HashMap;
import java.util.Map;

public class LihatMateri {

    // Atribut data materi
    private String idMateri;
    private String judulMateri;
    private String isiMateri;
    private boolean materiSudahDiinput; // Telah diubah dari nilaiSudahDiinput menjadi materiSudahDiinput

    // Simulasi database materi
    private static final Map<String, LihatMateri> databaseMateri = new HashMap<>();

    // Constructor
    public LihatMateri(String idMateri, String judulMateri, String isiMateri, boolean materiSudahDiinput) {
        this.idMateri = idMateri;
        this.judulMateri = judulMateri;
        this.isiMateri = isiMateri;
        this.materiSudahDiinput = materiSudahDiinput;
    }

    // Menyimpan data awal ke database (untuk keperluan simulasi)
    public static void simpanMateriAwal(String idMateri, String judul, String isi, boolean statusMateri) {
        databaseMateri.put(idMateri, new LihatMateri(idMateri, judul, isi, statusMateri));
    }

    // 1. Siswa: Membuka menu materi
    public void membukaMenuMateri() {
        System.out.println("Siswa membuka menu materi.");
        requestDaftarMateri();
    }

    // 2. UI Materi -> Materi: requesrDaftarMateri() [sesuai typo di diagram]
    public void requestDaftarMateri() {
        System.out.println("UI Materi memanggil requesrDaftarMateri().");
        queryDaftarMateriSiswa();
    }

    // 3. Materi -> Database: Query daftar materi siswa
    public void queryDaftarMateriSiswa() {
        System.out.println("Materi mengirim query ke Database...");
        System.out.println("Database mengembalikan: [Daftar materi]");
        tampilkanDaftarMateri();
    }

    // UI Materi -> Siswa: Tampilkan daftar materi
    public void tampilkanDaftarMateri() {
        System.out.println("\n=== TAMPILKAN DAFTAR MATERI ===");
        for (LihatMateri mat : databaseMateri.values()) {
            System.out.println("ID: " + mat.idMateri + " | Judul: " + mat.judulMateri);
        }
    }

    // Alur Lanjutan: Siswa memilih salah satu materi
    public void pilihSalahSatuMateri(String idMateriPilihan) {
        System.out.println("\nSiswa memilih salah satu materi (ID: " + idMateriPilihan + ").");
        lihatMateri(idMateriPilihan);
    }

    // UI Materi -> Materi: LihatMateri()
    public void lihatMateri(String idMateriPilihan) {
        System.out.println("UI Materi memanggil LihatMateri().");
        ambilDetailMateri(idMateriPilihan);
    }

    // Materi -> Database: Ambil detail materi
    public void ambilDetailMateri(String idMateriPilihan) {
        System.out.println("Materi memanggil Ambil detail materi ke Database.");
        
        LihatMateri materi = databaseMateri.get(idMateriPilihan);
        if (materi != null) {
            System.out.println("Database mengembalikan: [Isi materi]");
            
            // Pengecekan Blok ALT (disesuaikan menjadi status ketersediaan materi)
            if (materi.materiSudahDiinput) {
                // ALT: [MATERI SUDAH DIINPUT]
                tampilkanIsiMateri(materi);
            } else {
                // ALT: [MATERI BELUM DIINPUT]
                tampilkanPesanMateriTidakDitemukan();
            }
        } else {
            System.out.println("Materi tidak ditemukan di database.");
        }
    }

    // ALT: [MATERI SUDAH DIINPUT] - Tampilkan isi materi ke UI
    public void tampilkanIsiMateri(LihatMateri materi) {
        System.out.println("Materi mengirim 'Tampilkan isi materi' ke UI.");
        System.out.println("\n=== ISI MATERI ===");
        System.out.println("Judul : " + materi.judulMateri);
        System.out.println("Isi   : " + materi.isiMateri);
        materiTampil();
    }

    public void materiTampil() {
        System.out.println("Notifikasi UI: Materi tampil kepada Siswa.");
    }

    // ALT: [MATERI BELUM DIINPUT] - Tampilkan pesan error
    public void tampilkanPesanMateriTidakDitemukan() {
        System.out.println("Materi mengirim pesan 'Materi tidak ditemukan' ke UI.");
        pesanErrorTampil();
    }

    public void pesanErrorTampil() {
        System.out.println("UI menampilkan pesan error kepada Siswa: 'Materi tidak ditemukan'.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Mocking data ke database
        // Skenario 1: Materi sudah diinput (bisa diakses)
        simpanMateriAwal("MAT-001", "Pemrograman Java Dasar", "Mengenal OOP dan Class.", true);
        
        // Skenario 2: Materi belum diinput (materi terkunci / tidak ditemukan)
        simpanMateriAwal("MAT-002", "Struktur Data Lanjutan", "Materi Tree dan Graph.", false);

        // Inisialisasi objek utama
        LihatMateri app = new LihatMateri("", "", "", false);

        System.out.println("--- SIMULASI 1: [MATERI SUDAH DIINPUT] ---");
        app.membukaMenuMateri();
        app.pilihSalahSatuMateri("MAT-001");

        System.out.println("\n----------------------------------------\n");

        System.out.println("--- SIMULASI 2: [MATERI BELUM DIINPUT] ---");
        app.pilihSalahSatuMateri("MAT-002");
    }
}