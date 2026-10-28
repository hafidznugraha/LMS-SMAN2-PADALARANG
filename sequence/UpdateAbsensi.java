import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UpdateAbsensi {

    private String idAbsensi;
    private String nis;
    private String namaSiswa;
    private String kelas;
    private String pertemuan;
    private String status;
    private String keterangan;

    private static final Map<String, UpdateAbsensi> databaseAbsensi = new HashMap<>();

    private static final List<String> STATUS_VALID = Arrays.asList("Hadir", "Sakit", "Izin", "Alfa");

    public UpdateAbsensi(String idAbsensi, String nis, String namaSiswa, String kelas, String pertemuan, String status, String keterangan) {
        this.idAbsensi = idAbsensi;
        this.nis = nis;
        this.namaSiswa = namaSiswa;
        this.kelas = kelas;
        this.pertemuan = pertemuan;
        this.status = status;
        this.keterangan = keterangan;
    }

    public String getIdAbsensi() { return idAbsensi; }
    public String getNis() { return nis; }
    public String getNamaSiswa() { return namaSiswa; }
    public String getKelas() { return kelas; }
    public String getPertemuan() { return pertemuan; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getKeterangan() { return keterangan; }
    public void setKeterangan(String keterangan) { this.keterangan = keterangan; }

    public static void simpanAbsensiAwal(String idAbsensi, String nis, String namaSiswa, String kelas, String pertemuan, String status, String keterangan) {
        databaseAbsensi.put(idAbsensi, new UpdateAbsensi(idAbsensi, nis, namaSiswa, kelas, pertemuan, status, keterangan));
    }

    public void pilihAbsensi(String idAbsensi) {
        System.out.println("\n[Aksi Guru] Guru memilih record absensi dengan ID: '" + idAbsensi + "'");
        getAbsensi(idAbsensi);
    }

    public void getAbsensi(String idAbsensi) {
        System.out.println("[UI Absensi] -> [Database]: getAbsensi('" + idAbsensi + "')");

        UpdateAbsensi data = databaseAbsensi.get(idAbsensi);

        if (data != null) {
            System.out.println("[Database] <-- [UI Absensi]: Mengembalikan 'Data absensi' (" + data.getNamaSiswa() + " - " + data.getStatus() + ")");

            tampilkanFormUpdate(data);
        } else {
            System.out.println("[Database] <-- [UI Absensi]: Data absensi tidak ditemukan!");
            System.out.println("[UI Absensi] <-- [Guru]: [ERROR] Data absensi tidak ditemukan.");
        }
    }

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

    public void submitUpdate(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("\n[Aksi Guru] Guru menginput perubahan status menjadi '" + statusBaru + "' (Ket: " + keteranganBaru + ") dan klik 'Submit update'");
        updateAbsensi(idAbsensi, statusBaru, keteranganBaru);
    }

    public void updateAbsensi(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("[UI Absensi] -> [Absensi]: UpdateAbsensi('" + idAbsensi + "', '" + statusBaru + "')");
        prosesUpdateDatabase(idAbsensi, statusBaru, keteranganBaru);
    }

    public void prosesUpdateDatabase(String idAbsensi, String statusBaru, String keteranganBaru) {
        System.out.println("[Absensi] -> [Database]: 'Update absensi' (UPDATE tb_absensi SET status='" + statusBaru + "' WHERE id='" + idAbsensi + "')");

        UpdateAbsensi record = databaseAbsensi.get(idAbsensi);

        boolean isStatusValid = (statusBaru != null && STATUS_VALID.stream().anyMatch(s -> s.equalsIgnoreCase(statusBaru)));
        boolean isBerhasil = (record != null && isStatusValid);

        if (isBerhasil) {
            record.setStatus(statusBaru);
            record.setKeterangan(keteranganBaru);
            System.out.println("[Database] <-- [Absensi]: Return 'Sukses'");
        } else {
            System.out.println("[Database] <-- [Absensi]: Return 'Gagal'");
        }

        System.out.println("[Absensi] <-- [UI Absensi]: Mengirimkan 'Hasil update' -> " + (isBerhasil ? "SUKSES" : "GAGAL"));

        if (isBerhasil) {

            System.out.println(">> Masuk BLOK ALT: [BERHASIL]");
            System.out.println("[UI Absensi] <-- [Guru]: [SUKSES] Menampilkan notifikasi 'Data kehadiran berhasil diperbarui!'");
        } else {

            System.out.println(">> Masuk BLOK ALT: [DATA INVALID]");
            System.out.println("[UI Absensi] <-- [Guru]: [ERROR] Tampilkan pesan error 'Status tidak dapat diperbarui'");
        }
    }

    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 28: GURU MENGUPDATE ABSENSI SISWA");
        System.out.println("========================================================================");

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

        System.out.println("\n>>> [UJI COBA 1: SUKSES (ALFA DIUBAH JADI SAKIT)] <<<");
        app.pilihAbsensi("ABS-2026-001");
        app.submitUpdate("ABS-2026-001", "Sakit", "Surat keterangan dokter terlampir");

        System.out.println("\n>>> [UJI COBA 2: DATA INVALID (STATUS TIDAK DIKENAL)] <<<");
        app.pilihAbsensi("ABS-2026-002");
        app.submitUpdate("ABS-2026-002", "BolosKeKantin", "Status di luar ketentuan sistem");

        System.out.println("\n>>> [UJI COBA 3: DATA INVALID (ID ABSENSI TIDAK DITEMUKAN)] <<<");
        app.pilihAbsensi("ABS-9999-NOTFOUND");

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 28 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
