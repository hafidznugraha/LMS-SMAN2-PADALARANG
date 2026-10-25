import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE 26: AKTOR GURU -> MELIHAT TUGAS / KUIS
 * (Halaman 63 SDD - Software Design Document Kelompok 6)
 * ============================================================================
 * 
 * PEMETAAN LIFELINE / OBJEK:
 * 1. Actor            : Guru
 * 2. UI Materi        : Boundary / Antarmuka Modul Pembelajaran (Materi & Tugas)
 * 3. Tugas            : Controller / Business Logic Service Pengelolaan Tugas
 * 4. Database         : Penyimpanan Data (Simulasi tabel tb_tugas_kuis)
 * 
 * ALUR PESAN (SEQUENCE MESSAGES):
 * [1] Guru -> UI Materi           : Pilih tugas / kuis
 * [2] UI Materi -> Tugas          : LihatTugasKuis()
 * [3] Tugas -> Database           : Ambil detail tugas / kuis
 * [4] Database --> Tugas          : Detail tugas / kuis
 * [5] Tugas --> UI Materi         : Detail tugas / kuis
 * [6] UI Materi --> Guru          : Tampilkan detail tugas / kuis
 * ============================================================================
 */
public class LihatTugasKuis {

    // Atribut data tugas / kuis
    private String idTugasKuis;
    private String judul;
    private String jenis; // "Tugas" atau "Kuis"
    private String deskripsi;
    private String tenggatWaktu;
    private String fileLampiran;

    // Simulasi database tugas dan kuis (in-memory hash map)
    private static final Map<String, LihatTugasKuis> databaseTugas = new HashMap<>();

    // Constructor
    public LihatTugasKuis(String idTugasKuis, String judul, String jenis, String deskripsi, String tenggatWaktu, String fileLampiran) {
        this.idTugasKuis = idTugasKuis;
        this.judul = judul;
        this.jenis = jenis;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
        this.fileLampiran = fileLampiran;
    }

    // Getter
    public String getIdTugasKuis() { return idTugasKuis; }
    public String getJudul() { return judul; }
    public String getJenis() { return jenis; }
    public String getDeskripsi() { return deskripsi; }
    public String getTenggatWaktu() { return tenggatWaktu; }
    public String getFileLampiran() { return fileLampiran; }

    // Menyimpan data awal ke database simulasi
    public static void simpanTugasAwal(String idTugasKuis, String judul, String jenis, String deskripsi, String tenggatWaktu, String fileLampiran) {
        databaseTugas.put(idTugasKuis, new LihatTugasKuis(idTugasKuis, judul, jenis, deskripsi, tenggatWaktu, fileLampiran));
    }

    // ========================================================================
    // ALUR LANGKAH SESUAI DIAGRAM SEQUENCE
    // ========================================================================

    // Langkah 1: Guru -> UI Materi: Pilih tugas / kuis
    public void pilihTugasKuis(String idTugasKuis) {
        System.out.println("\n[Aksi Guru] Guru memilih tugas / kuis dengan ID: '" + idTugasKuis + "'");
        // Memanggil langkah 2
        lihatTugasKuis(idTugasKuis);
    }

    // Langkah 2: UI Materi -> Tugas: LihatTugasKuis()
    public void lihatTugasKuis(String idTugasKuis) {
        System.out.println("[UI Materi] -> [Tugas]: Memanggil LihatTugasKuis('" + idTugasKuis + "')");
        // Memanggil langkah 3
        ambilDetailTugasKuis(idTugasKuis);
    }

    // Langkah 3: Tugas -> Database: Ambil detail tugas / kuis
    public void ambilDetailTugasKuis(String idTugasKuis) {
        System.out.println("[Tugas] -> [Database]: 'Ambil detail tugas / kuis' (SELECT * FROM tb_tugas WHERE id='" + idTugasKuis + "')");

        LihatTugasKuis detail = databaseTugas.get(idTugasKuis);

        // Langkah 4: Database --> Tugas: Detail tugas / kuis
        if (detail != null) {
            System.out.println("[Database] <-- [Tugas]: Mengembalikan return 'Detail tugas / kuis'");
            // Langkah 5: Tugas --> UI Materi: Detail tugas / kuis
            kirimDetailKeUI(detail);
        } else {
            System.out.println("[Database] <-- [Tugas]: Data tugas / kuis tidak ditemukan!");
            System.out.println("[UI Materi] <-- [Guru]: Menampilkan pesan 'Tugas atau kuis tidak ditemukan.'");
        }
    }

    // Langkah 5: Tugas --> UI Materi: Detail tugas / kuis
    public void kirimDetailKeUI(LihatTugasKuis detail) {
        System.out.println("[Tugas] <-- [UI Materi]: Mengirimkan 'Detail tugas / kuis'");
        // Memanggil langkah 6
        tampilkanDetailTugasKuis(detail);
    }

    // Langkah 6: UI Materi --> Guru: Tampilkan detail tugas / kuis
    public void tampilkanDetailTugasKuis(LihatTugasKuis detail) {
        System.out.println("[UI Materi] <-- [Guru]: Tampilkan detail tugas / kuis");
        System.out.println("========================================================================");
        System.out.println("                   DETAIL TUGAS / KUIS SMAN 2 PADALARANG               ");
        System.out.println("========================================================================");
        System.out.println("ID Tugas / Kuis : " + detail.getIdTugasKuis());
        System.out.println("Judul           : " + detail.getJudul());
        System.out.println("Jenis Evaluasi  : " + detail.getJenis());
        System.out.println("Deskripsi/Soal  : " + detail.getDeskripsi());
        System.out.println("Batas Tenggat   : " + detail.getTenggatWaktu());
        System.out.println("File Lampiran   : " + detail.getFileLampiran());
        System.out.println("========================================================================");
    }

    // ========================================================================
    // MAIN METHOD: SIMULASI PENGUJIAN
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 26: GURU MELIHAT TUGAS / KUIS");
        System.out.println("========================================================================");

        // Menyiapkan data tugas / kuis di database simulasi
        LihatTugasKuis.simpanTugasAwal(
                "TGS-MIPA-01",
                "Fisika Terapan: Kinematika Gerak Lurus",
                "Tugas",
                "Kerjakan 5 soal perhitungan mengenai GLB dan GLBB di buku catatan",
                "2026-11-10 17:00 WIB",
                "modul_kinematika.pdf"
        );
        LihatTugasKuis.simpanTugasAwal(
                "KUIS-BIO-02",
                "Kuis Harian: Struktur Sel Tumbuhan",
                "Kuis",
                "Kuis online 20 soal pilihan ganda melalui LMS",
                "2026-11-12 12:00 WIB",
                "petunjuk_kuis_bio.pdf"
        );

        LihatTugasKuis app = new LihatTugasKuis("", "", "", "", "", "");

        // SKENARIO 1: Guru melihat tugas yang tersedia
        System.out.println("\n>>> [UJI COBA 1: MELIHAT DETAIL TUGAS FISIKA] <<<");
        app.pilihTugasKuis("TGS-MIPA-01");

        // SKENARIO 2: Guru melihat kuis yang tersedia
        System.out.println("\n>>> [UJI COBA 2: MELIHAT DETAIL KUIS BIOLOGI] <<<");
        app.pilihTugasKuis("KUIS-BIO-02");

        // SKENARIO 3: Guru memilih ID yang tidak ada di sistem
        System.out.println("\n>>> [UJI COBA 3: DATA TIDAK DITEMUKAN] <<<");
        app.pilihTugasKuis("TGS-999-NOTFOUND");

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 26 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
