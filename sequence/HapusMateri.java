import java.util.HashMap;
import java.util.Map;

public class HapusMateri {

    // Atribut data materi
    private String idMateri;
    private String judulMateri;

    // Simulasi database materi
    private static final Map<String, HapusMateri> databaseMateri = new HashMap<>();

    // Constructor
    public HapusMateri(String idMateri, String judulMateri) {
        this.idMateri = idMateri;
        this.judulMateri = judulMateri;
    }

    // Menyimpan data awal ke database (untuk keperluan simulasi)
    public static void simpanMateriAwal(String idMateri, String judul, String deskripsi) {
        databaseMateri.put(idMateri, new HapusMateri(idMateri, judul));
    }

    // 1. Guru: Membuka menu materi
    public void membukaMenuMateri() {
        System.out.println("Guru membuka menu materi.");
        requestDaftarMateri();
    }

    // 2. UI Materi -> Materi: requestDaftarMateri()
    public void requestDaftarMateri() {
        System.out.println("UI Materi memanggil requestDaftarMateri().");
        queryDaftarMateriGuru();
    }

    // 3. Materi -> Database: Query daftar materi guru
    public void queryDaftarMateriGuru() {
        System.out.println("Materi mengirim 'Query daftar materi guru' ke Database.");
        System.out.println("Database mengembalikan: [Daftar materi]");
        tampilkanDaftarMateri();
    }

    // UI Materi -> Guru: Tampilkan daftar materi
    public void tampilkanDaftarMateri() {
        System.out.println("\n=== TAMPILKAN DAFTAR MATERI ===");
        if (databaseMateri.isEmpty()) {
            System.out.println("(Daftar materi kosong)");
            return;
        }
        for (HapusMateri mat : databaseMateri.values()) {
            System.out.println("ID: " + mat.idMateri + " | Judul: " + mat.judulMateri);
        }
    }

    // Alur Lanjutan: Guru memilih materi dan klik hapus
    public void pilihMateriDanKlikHapus(String idMateriPilihan) {
        System.out.println("\nGuru memilih materi (ID: " + idMateriPilihan + ") dan klik hapus.");
        hapusMateri(idMateriPilihan);
    }

    // UI Materi -> Materi: HapusMateri()
    public void hapusMateri(String idMateriPilihan) {
        System.out.println("UI Materi memanggil HapusMateri().");
        cekMateriById(idMateriPilihan);
    }

    // Materi -> Database: cekMateriById()
    public void cekMateriById(String idMateriPilihan) {
        System.out.println("Materi memanggil cekMateriById() ke Database.");
        
        HapusMateri materi = databaseMateri.get(idMateriPilihan);
        
        // Pengecekan blok ALT berdasarkan ketersediaan data di database
        if (materi != null) {
            // ALT: [MATERI DITEMUKAN]
            System.out.println("Database mengembalikan: [Materi]");
            prosesDeleteMateri(materi);
        } else {
            // ALT: [MATERI TIDAK DITEMUKAN]
            System.out.println("Database mengembalikan: Materi tidak ditemukan.");
            materiTidakDitemukan();
        }
    }

    // ALT: [MATERI DITEMUKAN] - Proses penghapusan ke database
    public void prosesDeleteMateri(HapusMateri materi) {
        System.out.println("Materi mengirim 'Delete materi' ke Database.");
        
        // Eksekusi hapus dari database simulasi
        databaseMateri.remove(materi.idMateri);
        
        System.out.println("Database mengembalikan: [Success]");
        materiBerhasilDihapus();
    }

    public void materiBerhasilDihapus() {
        System.out.println("Materi mengirim 'Materi berhasil dihapus' ke UI.");
        notifikasiBerhasilDihapus();
    }

    public void notifikasiBerhasilDihapus() {
        System.out.println("UI menampilkan notifikasi kepada Guru: 'Materi berhasil di hapus'.");
    }

    // ALT: [MATERI TIDAK DITEMUKAN] - Penanganan error
    public void materiTidakDitemukan() {
        System.out.println("Materi mengirim 'Materi tidak ditemukan' ke UI.");
        tampilkanPesanError();
    }

    public void tampilkanPesanError() {
        System.out.println("UI menampilkan pesan error kepada Guru.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Mocking data awal ke database
        simpanMateriAwal("MAT-101", "Algoritma Pemrograman", "Dasar-dasar logika pemrograman.");
        simpanMateriAwal("MAT-102", "Basis Data Relasional", "Pengenalan SQL dan ERD.");

        // Inisialisasi objek utama (disesuaikan dengan parameter constructor baru)
        HapusMateri app = new HapusMateri("", "");

        System.out.println("--- SIMULASI 1: [MATERI DITEMUKAN] ---");
        app.membukaMenuMateri();
        app.pilihMateriDanKlikHapus("MAT-101");

        System.out.println("\n----------------------------------------\n");

        System.out.println("--- SIMULASI 2: [MATERI TIDAK DITEMUKAN] ---");
        app.pilihMateriDanKlikHapus("MAT-999");
    }
}