import java.util.HashMap;
import java.util.Map;

public class TambahTugasKuis {

    // Atribut data tugas/kuis
    private String idTugasKuis;
    private String nama;
    private String deskripsi;
    private String tenggatWaktu;

    // Simulasi database tugas dan kuis
    private static final Map<String, TambahTugasKuis> databaseTugasKuis = new HashMap<>();

    // Constructor
    public TambahTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        this.idTugasKuis = idTugasKuis;
        this.nama = nama;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
    }

    // 1. Guru: Membuka menu tugas dan kuis
    public void membukaMenuTugasDanKuis() {
        System.out.println("Guru membuka menu tugas dan kuis.");
        requestDaftarTugasKuis();
    }

    // UI Tugas/Kuis -> Tugas/Kuis: requestDaftarTugasKuis()
    public void requestDaftarTugasKuis() {
        System.out.println("UI Tugas/Kuis memanggil requestDaftarTugasKuis().");
        queryDaftarTugasDanKuis();
    }

    // Tugas/Kuis -> Database: Query daftar tugas dan kuis
    public void queryDaftarTugasDanKuis() {
        System.out.println("Tugas/Kuis mengirim 'Query daftar tugas dan kuis' ke Database.");
        System.out.println("Database mengembalikan: [Daftar tugas dan kuis]");
        tampilkanDaftarTugasDanKuis();
    }

    // UI Tugas/Kuis -> Guru: Tampilkan daftar tugas dan kuis
    public void tampilkanDaftarTugasDanKuis() {
        System.out.println("\n=== TAMPILKAN DAFTAR TUGAS DAN KUIS ===");
        if (databaseTugasKuis.isEmpty()) {
            System.out.println("(Daftar tugas dan kuis kosong)");
            return;
        }
        for (TambahTugasKuis tk : databaseTugasKuis.values()) {
            System.out.println("ID: " + tk.idTugasKuis + " | Nama: " + tk.nama + " | Tenggat: " + tk.tenggatWaktu);
        }
    }

    // Guru: Klik tombol tambah tugas/kuis
    public void klikTombolTambahTugasKuis() {
        System.out.println("\nGuru mengklik tombol tambah tugas/kuis.");
        requestFormTambah();
    }

    // UI Tugas/Kuis -> Tugas/Kuis: requestFormtambah()
    public void requestFormTambah() {
        System.out.println("UI Tugas/Kuis memanggil requestFormtambah().");
        formInputTugasKuis();
    }

    // Tugas/Kuis -> UI Tugas/Kuis: Form input tugas/kuis
    public void formInputTugasKuis() {
        System.out.println("Tugas/Kuis mengirim 'Form input tugas/kuis' ke UI.");
        tampilkanFormInputTugasKuis();
    }

    // UI Tugas/Kuis -> Guru: Tampilkan form input tugas/kuis
    public void tampilkanFormInputTugasKuis() {
        System.out.println("\n=== FORM INPUT TUGAS / KUIS ===");
        System.out.println("Silakan isi nama, deskripsi, dan tenggat waktu.");
    }

    // 2. Guru: Isi nama, deskripsi, tenggat waktu
    public void isiDataDanSimpan(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        System.out.println("\nGuru mengisi nama, deskripsi, dan tenggat waktu.");
        inputTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu);
    }

    // UI Tugas/Kuis -> Tugas/Kuis: InputTugasKuis()
    public void inputTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        System.out.println("UI Tugas/Kuis memanggil InputTugasKuis().");
        cekTenggatWaktu(idTugasKuis, nama, deskripsi, tenggatWaktu);
    }

    // Tugas/Kuis -> Database: cekTenggatWaktu() (check())
    public void cekTenggatWaktu(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        System.out.println("Tugas/Kuis memanggil 'cekTenggatWaktu()' (check()) ke Database.");

        // Simulasi validasi: Tenggat waktu dianggap valid jika diisi (tidak kosong)
        boolean isTenggatDiisi = (tenggatWaktu != null && !tenggatWaktu.trim().isEmpty());

        if (isTenggatDiisi) {
            System.out.println("Database mengembalikan: [Valid / Success]");
            
            // ALT: [TENGGAT WAKTU DIISI]
            insertTugasKuisBaru(idTugasKuis, nama, deskripsi, tenggatWaktu);
        } else {
            System.out.println("Database mengembalikan: [Tidak Valid / Kosong]");
            
            // ALT: [TENGGAT WAKTU KOSONG]
            tenggatWaktuKosong();
        }
    }

    // ALT: [TENGGAT WAKTU DIISI] - Proses insert ke database
    public void insertTugasKuisBaru(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        System.out.println("Tugas/Kuis mengirim 'Insert tugas / kuis baru' ke Database.");
        
        // Simpan ke database simulasi dan gunakan atribut deskripsi agar bersih dari warning
        TambahTugasKuis baru = new TambahTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu);
        databaseTugasKuis.put(idTugasKuis, baru);
        
        System.out.println("Database menyimpan -> ID: " + baru.idTugasKuis + 
                           " | Nama: " + baru.nama + 
                           " | Deskripsi: " + baru.deskripsi + 
                           " | Tenggat: " + baru.tenggatWaktu);
        
        System.out.println("Database mengembalikan: [Success]");
        tugasKuisBerhasilDitambahkan();
    }

    public void tugasKuisBerhasilDitambahkan() {
        System.out.println("Tugas/Kuis mengirim 'Tugas / kuis berhasil ditambahkan' ke UI.");
        notifikasiBerhasil();
    }

    public void notifikasiBerhasil() {
        System.out.println("UI menampilkan: [Notifikasi berhasil] kepada Guru.");
    }

    // ALT: [TENGGAT WAKTU KOSONG] - Penanganan error
    public void tenggatWaktuKosong() {
        System.out.println("Tugas/Kuis mengirim pesan 'Batas waktu wajib diisi' ke UI.");
        tampilkanPesanError();
    }

    public void tampilkanPesanError() {
        System.out.println("UI menampilkan pesan error kepada Guru: Batas waktu wajib diisi.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Inisialisasi objek utama
        TambahTugasKuis app = new TambahTugasKuis("", "", "", "");

        System.out.println("--- SIMULASI 1: [TENGGAT WAKTU DIISI] ---");
        app.membukaMenuTugasDanKuis();
        app.klikTombolTambahTugasKuis();
        app.isiDataDanSimpan("TGS-001", "Kuis Pemrograman Java", "Kerjakan soal pilihan ganda OOP.", "2026-11-01 23:59");

        System.out.println("\n----------------------------------------\n");

        System.out.println("--- SIMULASI 2: [TENGGAT WAKTU KOSONG] ---");
        app.klikTombolTambahTugasKuis();
        app.isiDataDanSimpan("TGS-002", "Tugas Mandiri Struktur Data", "Implementasi Linked List.", "");
    }
}