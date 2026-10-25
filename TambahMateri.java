import java.util.HashMap;
import java.util.Map;

public class TambahMateri {

    // Atribut data materi
    private String idMateri;
    private String judulMateri;
    private String deskripsi;
    private String fileMateri;

    // Simulasi database materi
    private static final Map<String, TambahMateri> databaseMateri = new HashMap<>();

    // Constructor
    public TambahMateri(String idMateri, String judulMateri, String deskripsi, String fileMateri) {
        this.idMateri = idMateri;
        this.judulMateri = judulMateri;
        this.deskripsi = deskripsi;
        this.fileMateri = fileMateri;
    }

    // 1. Guru: Klik tombol tambah materi
    public void klikTombolTambahMateri() {
        System.out.println("Guru mengklik tombol tambah materi.");
        requestFormTambahMateri();
    }

    // UI Materi -> Materi: requestFormTambahMateri()
    public void requestFormTambahMateri() {
        System.out.println("UI Materi memanggil requestFormTambahMateri().");
        formInputMateri();
    }

    // Materi -> UI Materi: Form input materi
    public void formInputMateri() {
        System.out.println("Materi mengirim 'Form input materi' ke UI.");
        tampilkanFormInputMateri();
    }

    // UI Materi -> Guru: Tampilkan Form input materi
    public void tampilkanFormInputMateri() {
        System.out.println("\n=== FORM INPUT MATERI BARU ===");
        System.out.println("Silakan masukkan judul, deskripsi, dan upload file.");
    }

    // 2. Guru: Isi judul, deskripsi, upload file
    public void isiDataDanUploadFile(String idMateri, String judul, String deskripsi, String file) {
        System.out.println("\nGuru mengisi judul, deskripsi, dan upload file.");
        inputMateri(idMateri, judul, deskripsi, file);
    }

    // UI Materi -> Materi: InputMateri()
    public void inputMateri(String idMateri, String judul, String deskripsi, String file) {
        System.out.println("UI Materi memanggil InputMateri().");
        cekFileTerupload(idMateri, judul, deskripsi, file);
    }

    // Materi -> Database: cekFileTerupload()
    public void cekFileTerupload(String idMateri, String judul, String deskripsi, String file) {
        System.out.println("Materi memanggil 'cekFileTerupload()' ke Database.");
        
        // Pengecekan file di database/sistem
        boolean isFileAda = (file != null && !file.trim().isEmpty());

        if (isFileAda) {
            System.out.println("Database mengembalikan: [File ada]");
            
            // ALT: [FILE DIUNGGAH]
            insertMateriBaru(idMateri, judul, deskripsi, file);
        } else {
            System.out.println("Database mengembalikan: [File tidak ada / kosong]");
            
            // ALT: [FILE TIDAK DIUNGGAH]
            fileTidakBolehKosong();
        }
    }

    // ALT: [FILE DIUNGGAH] - Proses insert ke database
    public void insertMateriBaru(String idMateri, String judul, String deskripsi, String file) {
        System.out.println("Materi mengirim 'Insert materi baru' ke Database.");
        
        // Membuat objek baru dan menyimpannya ke database simulasi
        TambahMateri materiBaru = new TambahMateri(idMateri, judul, deskripsi, file);
        databaseMateri.put(idMateri, materiBaru);
        
        // Membaca atribut untuk memastikan field digunakan (menghilangkan warning)
        System.out.println("Data Tersimpan -> ID: " + materiBaru.idMateri + 
                           " | Judul: " + materiBaru.judulMateri + 
                           " | Deskripsi: " + materiBaru.deskripsi + 
                           " | File: " + materiBaru.fileMateri);
        
        System.out.println("Database mengembalikan: [Success]");
        materiBerhasilDitambahkan();
    }

    public void materiBerhasilDitambahkan() {
        System.out.println("Materi mengirim 'Materi berhasil ditambahkan' ke UI.");
        notifikasiBerhasil();
    }

    public void notifikasiBerhasil() {
        System.out.println("UI menampilkan: [Notifikasi berhasil] kepada Guru.");
    }

    // ALT: [FILE TIDAK DIUNGGAH] - Penanganan error
    public void fileTidakBolehKosong() {
        System.out.println("Materi mengirim pesan 'File tidak boleh kosong' ke UI.");
        tampilkanPesanError();
    }

    public void tampilkanPesanError() {
        System.out.println("UI menampilkan pesan error kepada Guru: File tidak boleh kosong.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Inisialisasi objek utama
        TambahMateri app = new TambahMateri("", "", "", "");

        System.out.println("--- SIMULASI 1: [FILE DIUNGGAH] ---");
        app.klikTombolTambahMateri();
        app.isiDataDanUploadFile("MAT-301", "Pemrograman Berorientasi Objek", "Belajar konsep Class dan Object.", "modul_pbo.pdf");

        System.out.println("\n----------------------------------------\n");

        System.out.println("--- SIMULASI 2: [FILE TIDAK DIUNGGAH] ---");
        app.klikTombolTambahMateri();
        app.isiDataDanUploadFile("MAT-302", "Basis Data Lanjut", "Belajar Store Procedure.", "");
    }
}