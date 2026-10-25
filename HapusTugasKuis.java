import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE 27: AKTOR GURU -> MENGHAPUS TUGAS / KUIS
 * (Halaman 63 SDD - Software Design Document Kelompok 6)
 * ============================================================================
 * 
 * PEMETAAN LIFELINE / OBJEK:
 * 1. Actor            : Guru
 * 2. UI Tugas/Kuis    : Boundary / Tampilan Pengelolaan Tugas & Kuis
 * 3. Sistem           : Controller / Service Sistem LMS
 * 4. Database         : Penyimpanan Data (Simulasi tabel tb_tugas_kuis)
 * 
 * ALUR PESAN (SEQUENCE MESSAGES):
 * [1] Guru -> UI Tugas/Kuis          : Membuka menu tugas dan kuis
 * [2] UI Tugas/Kuis -> Sistem        : requestDaftarTugasKuis()
 * [3] Sistem -> Database             : Query daftar tugas dan kuis
 * [4] Database --> Sistem            : Daftar tugas dan kuis
 * [5] Sistem --> UI Tugas/Kuis       : Tampilkan daftar
 * [6] Guru -> UI Tugas/Kuis          : Pilih tugas / kuis dan klik hapus
 * [7] UI Tugas/Kuis -> Sistem        : HapusTugasKuis()
 * [8] Sistem -> Database             : cekTugasKuisByID()
 * [9] Database --> Sistem            : Data ditemukan / null
 * 
 * BLOK ALT 1: [DATA DITEMUKAN]
 *   [10] Sistem -> Database          : Delete tugas / kuis
 *   [11] Database --> Sistem         : Success
 *   [12] Sistem --> UI Tugas/Kuis    : Tugas / kuis berhasil dihapus
 *   [13] UI Tugas/Kuis --> Guru      : Notifikasi berhasil
 * 
 * BLOK ALT 2: [DATA TIDAK TEMUKAN]
 *   [14] Sistem --> UI Tugas/Kuis    : Data tidak ditemukan
 *   [15] UI Tugas/Kuis --> Guru      : Tampilkan pesan error
 * ============================================================================
 */
public class HapusTugasKuis {

    // Atribut data tugas / kuis
    private String idTugasKuis;
    private String nama;
    private String deskripsi;
    private String tenggatWaktu;

    // Simulasi database tugas dan kuis (in-memory hash map)
    private static final Map<String, HapusTugasKuis> databaseTugasKuis = new HashMap<>();

    // Constructor
    public HapusTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        this.idTugasKuis = idTugasKuis;
        this.nama = nama;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
    }

    // Getter
    public String getIdTugasKuis() { return idTugasKuis; }
    public String getNama() { return nama; }
    public String getDeskripsi() { return deskripsi; }
    public String getTenggatWaktu() { return tenggatWaktu; }

    // Menyimpan data awal ke database simulasi
    public static void simpanTugasAwal(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        databaseTugasKuis.put(idTugasKuis, new HapusTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu));
    }

    // ========================================================================
    // ALUR LANGKAH SESUAI DIAGRAM SEQUENCE
    // ========================================================================

    // Langkah 1: Guru -> UI Tugas/Kuis: Membuka menu tugas dan kuis
    public void membukaMenuTugasDanKuis() {
        System.out.println("\n[Aksi Guru] Guru membuka menu Tugas dan Kuis.");
        requestDaftarTugasKuis();
    }

    // Langkah 2: UI Tugas/Kuis -> Sistem: requestDaftarTugasKuis()
    public void requestDaftarTugasKuis() {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: requestDaftarTugasKuis()");
        queryDaftarTugasDanKuis();
    }

    // Langkah 3 & 4: Sistem -> Database: Query daftar tugas dan kuis & Database --> Sistem
    public void queryDaftarTugasDanKuis() {
        System.out.println("[Sistem] -> [Database]: 'Query daftar tugas dan kuis' (SELECT * FROM tb_tugas_kuis)");
        System.out.println("[Database] <-- [Sistem]: Mengembalikan return 'Daftar tugas dan kuis' (" + databaseTugasKuis.size() + " data)");
        tampilkanDaftar();
    }

    // Langkah 5: Sistem --> UI Tugas/Kuis: Tampilkan daftar
    public void tampilkanDaftar() {
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan 'Tampilkan daftar'");
        System.out.println("\n====================== DAFTAR TUGAS DAN KUIS ======================");
        if (databaseTugasKuis.isEmpty()) {
            System.out.println("| (Daftar tugas dan kuis kosong / tidak ada data)                |");
        } else {
            for (HapusTugasKuis tk : databaseTugasKuis.values()) {
                System.out.println("| ID: " + tk.getIdTugasKuis() + " | Nama: " + tk.getNama() + " | Tenggat: " + tk.getTenggatWaktu());
            }
        }
        System.out.println("===================================================================");
    }

    // Langkah 6: Guru -> UI Tugas/Kuis: Pilih tugas / kuis dan klik hapus
    public void pilihTugasDanKlikHapus(String idTugasKuis) {
        System.out.println("\n[Aksi Guru] Guru memilih tugas dengan ID '" + idTugasKuis + "' dan mengklik tombol Hapus.");
        hapusTugasKuis(idTugasKuis);
    }

    // Langkah 7: UI Tugas/Kuis -> Sistem: HapusTugasKuis()
    public void hapusTugasKuis(String idTugasKuis) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: HapusTugasKuis('" + idTugasKuis + "')");
        cekTugasKuisByID(idTugasKuis);
    }

    // Langkah 8 & 9: Sistem -> Database: cekTugasKuisByID() & Database --> Sistem: Data ditemukan / null
    public void cekTugasKuisByID(String idTugasKuis) {
        System.out.println("[Sistem] -> [Database]: cekTugasKuisByID('" + idTugasKuis + "')");
        
        HapusTugasKuis data = databaseTugasKuis.get(idTugasKuis);

        if (data != null) {
            System.out.println("[Database] <-- [Sistem]: Return 'Data ditemukan'");
            // Masuk ke BLOK ALT 1: [DATA DITEMUKAN]
            prosesAltDataDitemukan(idTugasKuis);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'null'");
            // Masuk ke BLOK ALT 2: [DATA TIDAK TEMUKAN]
            prosesAltDataTidakDitemukan();
        }
    }

    // BLOK ALT 1: [DATA DITEMUKAN]
    private void prosesAltDataDitemukan(String idTugasKuis) {
        System.out.println(">> Masuk BLOK ALT: [DATA DITEMUKAN]");

        // Langkah 10: Sistem -> Database: Delete tugas / kuis
        System.out.println("[Sistem] -> [Database]: 'Delete tugas / kuis' (DELETE FROM tb_tugas_kuis WHERE id='" + idTugasKuis + "')");
        databaseTugasKuis.remove(idTugasKuis);

        // Langkah 11: Database --> Sistem: Success
        System.out.println("[Database] <-- [Sistem]: Return 'Success'");

        // Langkah 12: Sistem --> UI Tugas/Kuis: Tugas / kuis berhasil dihapus
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan pesan 'Tugas / kuis berhasil dihapus'");

        // Langkah 13: UI Tugas/Kuis --> Guru: Notifikasi berhasil
        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [SUKSES] Menampilkan notifikasi 'Tugas / kuis berhasil dihapus!'");
    }

    // BLOK ALT 2: [DATA TIDAK TEMUKAN]
    private void prosesAltDataTidakDitemukan() {
        System.out.println(">> Masuk BLOK ALT: [DATA TIDAK TEMUKAN]");

        // Langkah 14: Sistem --> UI Tugas/Kuis: Data tidak ditemukan
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan pesan 'Data tidak ditemukan'");

        // Langkah 15: UI Tugas/Kuis --> Guru: Tampilkan pesan error
        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Data tugas / kuis tidak ditemukan!'");
    }

    // ========================================================================
    // MAIN METHOD: SIMULASI PENGUJIAN
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 27: GURU MENGHAPUS TUGAS / KUIS");
        System.out.println("========================================================================");

        // Menyiapkan data awal
        HapusTugasKuis.simpanTugasAwal("TGS-101", "Tugas Kimia Larutan Asam Basa", "Kerjakan soal 1-10", "2026-11-01");
        HapusTugasKuis.simpanTugasAwal("TGS-102", "Kuis Sejarah Perang Dunia 2", "Pilihan ganda 15 soal", "2026-11-03");

        HapusTugasKuis app = new HapusTugasKuis("", "", "", "");

        // Menampilkan daftar awal
        app.membukaMenuTugasDanKuis();

        // SKENARIO 1: Menghapus tugas yang ada di database (BLOK ALT: DATA DITEMUKAN)
        System.out.println("\n>>> [UJI COBA 1: DATA DITEMUKAN -> BERHASIL DIHAPUS] <<<");
        app.pilihTugasDanKlikHapus("TGS-101");

        // Menampilkan daftar setelah dihapus
        app.tampilkanDaftar();

        // SKENARIO 2: Menghapus tugas dengan ID yang tidak valid (BLOK ALT: DATA TIDAK TEMUKAN)
        System.out.println("\n>>> [UJI COBA 2: DATA TIDAK DITEMUKAN -> PESAN ERROR] <<<");
        app.pilihTugasDanKlikHapus("TGS-999-SALAH");

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 27 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
