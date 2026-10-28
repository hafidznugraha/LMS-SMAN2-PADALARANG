import java.util.HashMap;
import java.util.Map;

public class UpdateMateri {

    // Atribut data materi
    private String idMateri;
    private String judulMateri;
    private String fileMateri;

    // Simulasi database materi
    private static final Map<String, UpdateMateri> databaseMateri = new HashMap<>();

    // Constructor
    public UpdateMateri(String idMateri, String judulMateri, String fileMateri) {
        this.idMateri = idMateri;
        this.judulMateri = judulMateri;
        this.fileMateri = fileMateri;
    }

    // Menyimpan data awal ke database (untuk keperluan simulasi)
    public static void simpanMateriAwal(String idMateri, String judul, String file) {
        databaseMateri.put(idMateri, new UpdateMateri(idMateri, judul, file));
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
        for (UpdateMateri mat : databaseMateri.values()) {
            System.out.println("ID: " + mat.idMateri + " | Judul: " + mat.judulMateri + " | File: " + mat.fileMateri);
        }
    }

    // Alur Lanjutan: Guru memilih materi dan klik update
    public void pilihMateriDanKlikUpdate(String idMateriPilihan) {
        System.out.println("\nGuru memilih materi (ID: " + idMateriPilihan + ") dan klik update.");
        requestMateriUntukUpdate(idMateriPilihan);
    }

    // UI Materi -> Materi: requestMateriUntukUpdate()
    public void requestMateriUntukUpdate(String idMateriPilihan) {
        System.out.println("UI Materi memanggil requestMateriUntukUpdate().");
        ambilDetailMateri(idMateriPilihan);
    }

    // Materi -> Database: ambilDetailMateri()
    public void ambilDetailMateri(String idMateriPilihan) {
        System.out.println("Materi memanggil ambilDetailMateri() ke Database.");
        
        UpdateMateri dataMateri = databaseMateri.get(idMateriPilihan);
        if (dataMateri != null) {
            System.out.println("Database mengembalikan: [Detail materi]");
            kirimDetailKeUI(dataMateri);
        } else {
            System.out.println("Database: Materi tidak ditemukan.");
        }
    }

    public void kirimDetailKeUI(UpdateMateri dataMateri) {
        System.out.println("Materi mengirim 'Detail materi' ke UI.");
        tampilkanFormEditMateri(dataMateri);
    }

    // UI Materi -> Guru: Tampilkan form edit materi
    public void tampilkanFormEditMateri(UpdateMateri dataMateri) {
        System.out.println("\n=== FORM EDIT MATERI ===");
        System.out.println("ID Materi    : " + dataMateri.idMateri);
        System.out.println("Judul Lama   : " + dataMateri.judulMateri);
        System.out.println("File Lama    : " + dataMateri.fileMateri);
    }

    // Guru: Mengisi perubahan
    public void mengisiPerubahan(String idMateri, String judulBaru, String fileBaru) {
        System.out.println("\nGuru mengisi perubahan data dan menyimpan.");
        updateMateri(idMateri, judulBaru, fileBaru);
    }

    // UI Materi -> Materi: UpdateMateri()
    public void updateMateri(String idMateri, String judulBaru, String fileBaru) {
        System.out.println("UI Materi memanggil UpdateMateri().");
        validasiDatabase(idMateri, judulBaru, fileBaru);
    }

    // Materi -> Database: Validasi & Check
    public void validasiDatabase(String idMateri, String judulBaru, String fileBaru) {
        System.out.println("Materi memanggil 'Validasi' (check()) ke Database.");
        
        UpdateMateri materiLama = databaseMateri.get(idMateri);
        
        // Simulasi aturan validasi: File dianggap valid jika berformat .pdf atau .docx
        boolean isFileValid = fileBaru != null && (fileBaru.endsWith(".pdf") || fileBaru.endsWith(".docx"));

        if (isFileValid) {
            System.out.println("Database mengembalikan: [Valid / Success]");
            
            // ALT: [FILE VALID]
            databaseMateri.put(idMateri, new UpdateMateri(idMateri, judulBaru, fileBaru));
            System.out.println("Materi mengirim 'Update materi' ke Database.");
            System.out.println("Database mengembalikan: [Success]");
            materiBerhasilDiperbarui();
        } else {
            System.out.println("Database mengembalikan: [Invalid / Format tidak sesuai]");
            
            // ALT: [FORMAT FILE TIDAK DITEMUKAN / TIDAK SESUAI]
            formatFileTidakSesuai();
        }
    }

    public void materiBerhasilDiperbarui() {
        System.out.println("Materi mengirim 'Materi berhasil diperbarui' ke UI.");
        notifikasiBerhasil();
    }

    public void notifikasiBerhasil() {
        System.out.println("UI menampilkan: [Notifikasi berhasil] kepada Guru.");
    }

    public void formatFileTidakSesuai() {
        System.out.println("Materi mengirim 'Format file tidak sesuai' ke UI.");
        tampilkanPesanError();
    }

    public void tampilkanPesanError() {
        System.out.println("UI menampilkan pesan error kepada Guru: Format file tidak valid.");
    }

    // Fungsi Utama / Main untuk simulasi eksekusi program
    public static void main(String[] args) {
        // Mocking data awal ke database
        simpanMateriAwal("MAT-201", "Kalkulus Dasar", "modul_kalkulus.pdf");

        // Inisialisasi objek utama
        UpdateMateri app = new UpdateMateri("", "", "");

        System.out.println("--- SIMULASI 1: [FILE VALID] ---");
        app.membukaMenuMateri();
        app.pilihMateriDanKlikUpdate("MAT-201");
        app.mengisiPerubahan("MAT-201", "Kalkulus Lanjutan", "modul_kalkulus_rev.pdf");

        System.out.println("\n----------------------------------------\n");

        System.out.println("--- SIMULASI 2: [FORMAT FILE TIDAK SESUAI] ---");
        app.pilihMateriDanKlikUpdate("MAT-201");
        app.mengisiPerubahan("MAT-201", "Kalkulus Lanjutan", "virus.exe");
    }
}