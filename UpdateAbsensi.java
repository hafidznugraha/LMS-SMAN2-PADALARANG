import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE 28: AKTOR GURU -> UPDATE ABSENSI SISWA
 * (Halaman 63 SDD - Software Design Document Kelompok 6)
 * ============================================================================
 * 
 * PEMETAAN LIFELINE / OBJEK:
 * 1. Actor            : Guru
 * 2. UI Absensi       : Boundary / Antarmuka Presensi & Kehadiran Kelas
 * 3. Absensi          : Controller / Business Logic Service Presensi
 * 4. Database         : Penyimpanan Data (Simulasi tabel tb_absensi)
 * 
 * ALUR PESAN (SEQUENCE MESSAGES):
 * [1] Guru -> UI Absensi          : Pilih absensi
 * [2] UI Absensi -> Database      : getAbsensi()
 * [3] Database --> UI Absensi     : Data absensi
 * [4] UI Absensi --> Guru         : Tampilkan form update
 * [5] Guru -> UI Absensi          : Submit update
 * [6] UI Absensi -> Absensi       : UpdateAbsensi()
 * [7] Absensi -> Database         : Update absensi
 * [8] Database --> Absensi        : Sukses / gagal
 * [9] Absensi --> UI Absensi      : Hasil update
 * 
 * BLOK ALT 1: [BERHASIL]
 *   [10] UI Absensi --> Guru      : Notifikasi berhasil
 * 
 * BLOK ALT 2: [DATA INVALID]
 *   [11] UI Absensi --> Guru      : Tampilkan pesan error "Status tidak dapat diperbarui"
 * ============================================================================
 */
public class UpdateAbsensi {

    // Atribut data absensi siswa
    private String idAbsensi;
    private String nis;
    private String namaSiswa;
    private String kelas;
    private String pertemuan;
    private String status; // "Hadir", "Sakit", "Izin", "Alfa"
    private String keterangan;

    // Simulasi database absensi (in-memory hash map)
    private static final Map<String, UpdateAbsensi> databaseAbsensi = new HashMap<>();

    // Status absensi yang valid dalam sistem LMS SMAN 2 Padalarang
    private static final List<String> STATUS_VALID = Arrays.asList("Hadir", "Sakit", "Izin", "Alfa");

    // Constructor
    public UpdateAbsensi(String idAbsensi, String nis, String namaSiswa, String kelas, String pertemuan, String status, String keterangan) {
        this.idAbsensi = idAbsensi;
        this.nis = nis;
        this.namaSiswa = namaSiswa;
        this.kelas = kelas;
        this.pertemuan = pertemuan;
        this.status = status;
        this.keterangan = keterangan;
    }

    // Getter & Setter
    public String getIdAbsensi() { return idAbsensi; }
    public String getNis() { return nis; }
    public String getNamaSiswa() { return namaSiswa; }
    public String getKelas() { return kelas; }
    public String getPertemuan() { return pertemuan; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getKeterangan() { return keterangan; }
    public void setKeterangan(String keterangan) { this.keterangan = keterangan; }

    // Menyimpan data awal ke database simulasi
    public static void simpanAbsensiAwal(String idAbsensi, String nis, String namaSiswa, String kelas, String pertemuan, String status, String keterangan) {
        databaseAbsensi.put(idAbsensi, new UpdateAbsensi(idAbsensi, nis, namaSiswa, kelas, pertemuan, status, keterangan));
    }

    // ========================================================================
    // ALUR LANGKAH SESUAI DIAGRAM SEQUENCE
    // ========================================================================

    // Langkah 1: Guru -> UI Absensi: Pilih absensi
    public void pilihAbsensi(String idAbsensi) {
        System.out.println("\n[Aksi Guru] Guru memilih record absensi dengan ID: '" + idAbsensi + "'");
        getAbsensi(idAbsensi);
    }

    // Langkah 2 & 3: UI Absensi -> Database: getAbsensi() & Database --> UI Absensi: Data absensi
    public void getAbsensi(String idAbsensi) {
        System.out.println("[UI Absensi] -> [Database]: getAbsensi('" + idAbsensi + "')");
        
        UpdateAbsensi data = databaseAbsensi.get(idAbsensi);

        if (data != null) {
            System.out.println("[Database] <-- [UI Absensi]: Mengembalikan 'Data absensi' (" + data.getNamaSiswa() + " - " + data.getStatus() + ")");
            // Langkah 4: UI Absensi --> Guru: Tampilkan form update
            tampilkanFormUpdate(data);
        } else {
            System.out.println("[Database] <-- [UI Absensi]: Data absensi tidak ditemukan!");
            System.out.println("[UI Absensi] <-- [Guru]: [ERROR] Data absensi tidak ditemukan.");
        }
    }

    // Langkah 4: UI Absensi --> Guru: Tampilkan form update
    public void tampilkanFormUpdate(UpdateAbsensi data) {
        System.out.println("[UI Absensi] <-- [Guru]: Menampilkan Form Update Absensi Siswa");
        System.out.println("----------------------------------------------------------------");
        System.out.println("| ID Absensi : " + data.getIdAbsensi());
        System.out.println("| NIS        : " + data.getNis());
        System.out.println("| Nama Siswa : " + data.getNamaSiswa());
        System.out.println("| Kelas      : " + data.getKelas());
        System.out.println("| Pertemuan  : " + data.getPertemuan());
        System.out.println("| Status Saat Ini: " + data.getStatus());
        System.out.println("| Keterangan : " + data.getKeterangan());
        System.out.println("----------------------------------------------------------------");
    }

    // Langkah 5: Guru -> UI Absensi: Submit update
    public void submitUpdate(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("\n[Aksi Guru] Guru menginput perubahan status menjadi '" + statusBaru + "' (Ket: " + keteranganBaru + ") dan klik 'Submit update'");
        updateAbsensi(idAbsensi, statusBaru, keteranganBaru);
    }

    // Langkah 6: UI Absensi -> Absensi: UpdateAbsensi()
    public void updateAbsensi(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("[UI Absensi] -> [Absensi]: UpdateAbsensi('" + idAbsensi + "', '" + statusBaru + "')");
        prosesUpdateDatabase(idAbsensi, statusBaru, keteranganBaru);
    }

    // Langkah 7, 8, & 9: Absensi -> Database: Update absensi -> Sukses / gagal -> Hasil update
    public void prosesUpdateDatabase(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("[Absensi] -> [Database]: 'Update absensi' (UPDATE tb_absensi SET status='" + statusBaru + "' WHERE id='" + idAbsensi + "')");

        UpdateAbsensi record = databaseAbsensi.get(idAbsensi);

        // Kriteria validasi status: harus salah satu dari "Hadir", "Sakit", "Izin", "Alfa" dan record ditemukan
        boolean isStatusValid = (statusBaru != null && STATUS_VALID.stream().anyMatch(s -> s.equalsIgnoreCase(statusBaru)));
        boolean isBerhasil = (record != null && isStatusValid);

        // Langkah 8: Database --> Absensi: Sukses / gagal
        if (isBerhasil) {
            record.setStatus(statusBaru);
            record.setKeterangan(keteranganBaru);
            System.out.println("[Database] <-- [Absensi]: Return 'Sukses'");
        } else {
            System.out.println("[Database] <-- [Absensi]: Return 'Gagal'");
        }

        // Langkah 9: Absensi --> UI Absensi: Hasil update
        System.out.println("[Absensi] <-- [UI Absensi]: Mengirimkan 'Hasil update' -> " + (isBerhasil ? "SUKSES" : "GAGAL"));

        // Penanganan Blok ALT
        if (isBerhasil) {
            // BLOK ALT 1: [BERHASIL]
            // Langkah 10: UI Absensi --> Guru: Notifikasi berhasil
            System.out.println(">> Masuk BLOK ALT: [BERHASIL]");
            System.out.println("[UI Absensi] <-- [Guru]: [SUKSES] Menampilkan notifikasi 'Data kehadiran berhasil diperbarui!'");
        } else {
            // BLOK ALT 2: [DATA INVALID]
            // Langkah 11: UI Absensi --> Guru: Tampilkan pesan error "Status tidak dapat diperbarui"
            System.out.println(">> Masuk BLOK ALT: [DATA INVALID]");
            System.out.println("[UI Absensi] <-- [Guru]: [ERROR] Tampilkan pesan error 'Status tidak dapat diperbarui'");
        }
    }

    // ========================================================================
    // MAIN METHOD: SIMULASI PENGUJIAN
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 28: GURU MENGUPDATE ABSENSI SISWA");
        System.out.println("========================================================================");

        // Inisialisasi data absensi kelas di database simulasi
        UpdateAbsensi.simpanAbsensiAwal(
                "ABS-2026-001",
                "22231001",
                "Muhammad Rizky Pratama",
                "XII MIPA 1",
                "Pertemuan 5 - Fisika",
                "Alfa",
                "Belum ada keterangan"
        );
        UpdateAbsensi.simpanAbsensiAwal(
                "ABS-2026-002",
                "22231045",
                "Siti Nurhaliza Putri",
                "XII MIPA 1",
                "Pertemuan 5 - Fisika",
                "Hadir",
                "Tepat waktu"
        );

        UpdateAbsensi app = new UpdateAbsensi("", "", "", "", "", "", "");

        // SKENARIO 1: Update Sukses (Siswa awalnya Alfa membawa surat izin dokter, diubah jadi Sakit)
        System.out.println("\n>>> [UJI COBA 1: SUKSES (ALFA DIUBAH JADI SAKIT)] <<<");
        app.pilihAbsensi("ABS-2026-001");
        app.submitUpdate("ABS-2026-001", "Sakit", "Surat keterangan dokter terlampir");

        // SKENARIO 2: Update Gagal / Data Invalid (Status yang dimasukkan tidak valid / tidak dikenal)
        System.out.println("\n>>> [UJI COBA 2: DATA INVALID (STATUS TIDAK DIKENAL)] <<<");
        app.pilihAbsensi("ABS-2026-002");
        app.submitUpdate("ABS-2026-002", "BolosKeKantin", "Status di luar ketentuan sistem");

        // SKENARIO 3: Update Gagal (ID Absensi tidak ada di sistem)
        System.out.println("\n>>> [UJI COBA 3: DATA INVALID (ID ABSENSI TIDAK DITEMUKAN)] <<<");
        app.pilihAbsensi("ABS-9999-NOTFOUND");

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 28 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
