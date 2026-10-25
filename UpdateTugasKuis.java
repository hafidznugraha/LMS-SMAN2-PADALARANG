import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE 25: AKTOR GURU -> UPDATE TUGAS / KUIS
 * (Halaman 62 SDD - Software Design Document Kelompok 6)
 * ============================================================================
 * 
 * PEMETAAN LIFELINE / OBJEK:
 * 1. Actor            : Guru
 * 2. UI Tugas/Kuis    : Boundary / Tampilan Pengelolaan Tugas & Kuis
 * 3. Sistem           : Controller / Service Logika Bisnis
 * 4. Database         : Penyimpanan Data (Simulasi tabel tb_tugas_kuis)
 * 
 * ALUR PESAN (SEQUENCE MESSAGES):
 * [1]  Guru -> UI Tugas/Kuis          : Pilih tugas/kuis dan klik update
 * [2]  UI Tugas/Kuis -> Sistem        : requestDetailTugasKuis()
 * [3]  Sistem -> Database             : ambilDetailTugasKuis()
 * [4]  Database --> Sistem            : Detail tugas / kuis
 * [5]  Sistem --> UI Tugas/Kuis       : Form edit tugas/kuis
 * [6]  UI Tugas/Kuis --> Guru         : Tampilkan form edit tugas/kuis
 * [7]  Guru -> UI Tugas/Kuis          : Edit nama, deskripsi, tenggat, file
 * [8]  UI Tugas/Kuis -> Sistem        : UpdateTugasKuis()
 * [9]  Sistem -> Database             : cekTenggatWaktu()
 * [10] Database -> Database           : check()
 * [11] Database --> Sistem            : Valid / tidak
 * 
 * BLOK ALT 1: [TENGGAT WAKTU VALID]
 *   [12] Sistem -> Database           : cekFormatFile()
 *   [13] Database -> Database         : check()
 *   [14] Database --> Sistem          : Format Valid / invalid
 * 
 *   BLOK SUB-ALT 1.a: [FORMAT FILE VALID]
 *     [15] Sistem -> Database         : Update tugas / kuis
 *     [16] Database --> Sistem        : Update success
 *     [17] Sistem --> UI Tugas/Kuis   : Tugas / kuis berhasil diperbarui
 *     [18] UI Tugas/Kuis --> Guru     : Notifikasi berhasil
 * 
 *   BLOK SUB-ALT 1.b: [FORMAT FILE TIDAK VALID]
 *     [19] Sistem --> UI Tugas/Kuis   : Format file tidak sesuai
 *     [20] UI Tugas/Kuis --> Guru     : Tampilkan pesan error
 * 
 * BLOK ALT 2: [TENGGAT WAKTU TIDAK VALID]
 *   [21] Sistem --> UI Tugas/Kuis     : Batas waktu tidak valid
 *   [22] UI Tugas/Kuis --> Guru       : Tampilkan pesan error
 * ============================================================================
 */
public class UpdateTugasKuis {

    // Atribut data tugas / kuis
    private String idTugasKuis;
    private String nama;
    private String deskripsi;
    private String tenggatWaktu;
    private String fileTugas;

    // Simulasi database tugas dan kuis (in-memory hash map)
    private static final Map<String, UpdateTugasKuis> databaseTugasKuis = new HashMap<>();

    // Format file yang diizinkan untuk lampiran tugas
    private static final List<String> FORMAT_FILE_DIIZINKAN = Arrays.asList(".pdf", ".doc", ".docx", ".zip", ".rar");

    // Constructor
    public UpdateTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu, String fileTugas) {
        this.idTugasKuis = idTugasKuis;
        this.nama = nama;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
        this.fileTugas = fileTugas;
    }

    // Getter & Setter
    public String getIdTugasKuis() { return idTugasKuis; }
    public String getNama() { return nama; }
    public void setNama(String nama) { this.nama = nama; }
    public String getDeskripsi() { return deskripsi; }
    public void setDeskripsi(String deskripsi) { this.deskripsi = deskripsi; }
    public String getTenggatWaktu() { return tenggatWaktu; }
    public void setTenggatWaktu(String tenggatWaktu) { this.tenggatWaktu = tenggatWaktu; }
    public String getFileTugas() { return fileTugas; }
    public void setFileTugas(String fileTugas) { this.fileTugas = fileTugas; }

    // Menyimpan data awal ke database simulasi
    public static void simpanTugasAwal(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu, String fileTugas) {
        databaseTugasKuis.put(idTugasKuis, new UpdateTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu, fileTugas));
    }

    // ========================================================================
    // ALUR LANGKAH SESUAI DIAGRAM SEQUENCE
    // ========================================================================

    // Langkah 1: Guru -> UI Tugas/Kuis: "Pilih tugas/kuis dan klik update"
    public void pilihTugasDanKlikUpdate(String idTugasKuis) {
        System.out.println("\n[Aksi Guru] Guru memilih tugas/kuis dengan ID '" + idTugasKuis + "' dan mengklik tombol Update.");
        requestDetailTugasKuis(idTugasKuis);
    }

    // Langkah 2: UI Tugas/Kuis -> Sistem: requestDetailTugasKuis()
    public void requestDetailTugasKuis(String idTugasKuis) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: requestDetailTugasKuis('" + idTugasKuis + "')");
        ambilDetailTugasKuis(idTugasKuis);
    }

    // Langkah 3 & 4: Sistem -> Database: ambilDetailTugasKuis() & Database --> Sistem
    public void ambilDetailTugasKuis(String idTugasKuis) {
        System.out.println("[Sistem] -> [Database]: ambilDetailTugasKuis('" + idTugasKuis + "')");
        
        UpdateTugasKuis tugas = databaseTugasKuis.get(idTugasKuis);
        if (tugas != null) {
            System.out.println("[Database] <-- [Sistem]: Return data 'Detail tugas / kuis' -> [" + tugas.getNama() + "]");
            // Langkah 5: Sistem --> UI Tugas/Kuis: Form edit tugas/kuis
            formEditTugasKuis(tugas);
        } else {
            System.out.println("[Database] <-- [Sistem]: Data tugas dengan ID '" + idTugasKuis + "' tidak ditemukan.");
        }
    }

    // Langkah 5: Sistem --> UI Tugas/Kuis: Form edit tugas/kuis
    public void formEditTugasKuis(UpdateTugasKuis tugas) {
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan 'Form edit tugas/kuis'");
        tampilkanFormEditTugasKuis(tugas);
    }

    // Langkah 6: UI Tugas/Kuis --> Guru: Tampilkan form edit tugas/kuis
    public void tampilkanFormEditTugasKuis(UpdateTugasKuis tugas) {
        System.out.println("[UI Tugas/Kuis] <-- [Guru]: Menampilkan antarmuka Form Edit Tugas/Kuis");
        System.out.println("----------------------------------------------------------------");
        System.out.println("| ID Tugas    : " + tugas.getIdTugasKuis());
        System.out.println("| Nama Tugas  : " + tugas.getNama());
        System.out.println("| Deskripsi   : " + tugas.getDeskripsi());
        System.out.println("| Tenggat     : " + tugas.getTenggatWaktu());
        System.out.println("| File Lampiran: " + tugas.getFileTugas());
        System.out.println("----------------------------------------------------------------");
    }

    // Langkah 7: Guru -> UI Tugas/Kuis: Edit nama, deskripsi, tenggat, file
    public void editDataDanSubmit(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("\n[Aksi Guru] Mengisi data perubahan: Nama='" + namaBaru + "', Tenggat='" + tenggatBaru + "', File='" + fileBaru + "'");
        updateTugasKuis(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
    }

    // Langkah 8: UI Tugas/Kuis -> Sistem: UpdateTugasKuis()
    public void updateTugasKuis(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: UpdateTugasKuis()");
        cekTenggatWaktu(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
    }

    // Langkah 9 & 10: Sistem -> Database: cekTenggatWaktu() & Database self-check()
    public void cekTenggatWaktu(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("[Sistem] -> [Database]: cekTenggatWaktu('" + tenggatBaru + "')");
        System.out.println("[Database] -> [Database]: check() validasi nilai tenggat waktu...");

        // Kriteria validasi tenggat waktu: tidak null, tidak kosong, dan tidak berupa string invalid
        boolean isTenggatValid = (tenggatBaru != null && !tenggatBaru.trim().isEmpty() && !tenggatBaru.equalsIgnoreCase("invalid"));

        // Langkah 11: Database --> Sistem: Return Valid / tidak
        if (isTenggatValid) {
            System.out.println("[Database] <-- [Sistem]: Return 'Valid'");
            // Masuk ke BLOK ALT 1: [TENGGAT WAKTU VALID]
            prosesAltTenggatValid(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'Tidak Valid'");
            // Masuk ke BLOK ALT 2: [TENGGAT WAKTU TIDAK VALID]
            prosesAltTenggatTidakValid();
        }
    }

    // BLOK ALT 1: [TENGGAT WAKTU VALID]
    private void prosesAltTenggatValid(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println(">> Masuk BLOK ALT: [TENGGAT WAKTU VALID]");

        // Langkah 12 & 13: Sistem -> Database: cekFormatFile() & check()
        System.out.println("[Sistem] -> [Database]: cekFormatFile('" + fileBaru + "')");
        System.out.println("[Database] -> [Database]: check() validasi ekstensi format file...");

        boolean isFormatValid = false;
        if (fileBaru != null) {
            for (String ext : FORMAT_FILE_DIIZINKAN) {
                if (fileBaru.toLowerCase().endsWith(ext)) {
                    isFormatValid = true;
                    break;
                }
            }
        }

        // Langkah 14: Database --> Sistem: Format Valid / invalid
        if (isFormatValid) {
            System.out.println("[Database] <-- [Sistem]: Return 'Format Valid'");
            // Masuk ke SUB-ALT 1.a: [FORMAT FILE VALID]
            prosesSubAltFormatValid(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'Format Invalid'");
            // Masuk ke SUB-ALT 1.b: [FORMAT FILE TIDAK VALID]
            prosesSubAltFormatTidakValid();
        }
    }

    // SUB-ALT 1.a: [FORMAT FILE VALID]
    private void prosesSubAltFormatValid(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("   >> Masuk BLOK SUB-ALT: [FORMAT FILE VALID]");
        
        // Langkah 15: Sistem -> Database: Update tugas / kuis
        System.out.println("   [Sistem] -> [Database]: Update tugas / kuis (UPDATE tb_tugas_kuis SET ...)");
        
        UpdateTugasKuis tugas = databaseTugasKuis.get(idTugasKuis);
        if (tugas != null) {
            tugas.setNama(namaBaru);
            tugas.setDeskripsi(deskripsiBaru);
            tugas.setTenggatWaktu(tenggatBaru);
            tugas.setFileTugas(fileBaru);
        }

        // Langkah 16: Database --> Sistem: Update success
        System.out.println("   [Database] <-- [Sistem]: Return 'Update success'");

        // Langkah 17: Sistem --> UI Tugas/Kuis: Tugas / kuis berhasil diperbarui
        System.out.println("   [Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Tugas / kuis berhasil diperbarui'");

        // Langkah 18: UI Tugas/Kuis --> Guru: Notifikasi berhasil
        System.out.println("   [UI Tugas/Kuis] <-- [Guru]: [SUKSES] Menampilkan pop-up 'Notifikasi berhasil diperbarui'!");
    }

    // SUB-ALT 1.b: [FORMAT FILE TIDAK VALID]
    private void prosesSubAltFormatTidakValid() {
        System.out.println("   >> Masuk BLOK SUB-ALT: [FORMAT FILE TIDAK VALID]");
        // Langkah 19: Sistem --> UI Tugas/Kuis: Format file tidak sesuai
        System.out.println("   [Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Format file tidak sesuai'");

        // Langkah 20: UI Tugas/Kuis --> Guru: Tampilkan pesan error
        System.out.println("   [UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Format file tidak sesuai! (Gunakan .pdf, .docx, atau .zip)'");
    }

    // BLOK ALT 2: [TENGGAT WAKTU TIDAK VALID]
    private void prosesAltTenggatTidakValid() {
        System.out.println(">> Masuk BLOK ALT: [TENGGAT WAKTU TIDAK VALID]");
        // Langkah 21: Sistem --> UI Tugas/Kuis: Batas waktu tidak valid
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Batas waktu tidak valid'");

        // Langkah 22: UI Tugas/Kuis --> Guru: Tampilkan pesan error
        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Batas waktu tidak valid / tidak boleh kosong!'");
    }

    // ========================================================================
    // MAIN METHOD: SIMULASI PENGUJIAN SEMUA JALUR
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 25: GURU MENGUPDATE TUGAS / KUIS");
        System.out.println("========================================================================");

        // Inisialisasi data tugas awal
        UpdateTugasKuis.simpanTugasAwal(
                "TGS-001",
                "Tugas Matematika Wajib Bab 3",
                "Kerjakan soal latihan 3.1 halaman 45 nomor 1-10",
                "2026-11-01 23:59",
                "soal_latihan_bab3.pdf"
        );

        UpdateTugasKuis app = new UpdateTugasKuis("TGS-001", "", "", "", "");

        // SKENARIO 1: Jalur Normal (Tenggat Valid & Format File Valid)
        System.out.println("\n>>> [UJI COBA 1: SUKSES (TENGGAT VALID & FILE VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Wajib Bab 3 (Revisi)",
                "Kerjakan soal nomor 1-5 saja di buku tugas",
                "2026-11-05 23:59",
                "revisi_soal_bab3.pdf"
        );

        // SKENARIO 2: Jalur Alternatif 1.b (Tenggat Valid, namun Format File Tidak Valid)
        System.out.println("\n>>> [UJI COBA 2: GAGAL (FORMAT FILE TIDAK VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Bab 3",
                "Kerjakan nomor 1-5",
                "2026-11-05 23:59",
                "script_jawaban.exe" // ekstensi .exe tidak diizinkan
        );

        // SKENARIO 3: Jalur Alternatif 2 (Tenggat Waktu Tidak Valid / Kosong)
        System.out.println("\n>>> [UJI COBA 3: GAGAL (TENGGAT WAKTU TIDAK VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Bab 3",
                "Kerjakan nomor 1-5",
                "", // tenggat kosong
                "dokumen_tugas.pdf"
        );

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 25 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
