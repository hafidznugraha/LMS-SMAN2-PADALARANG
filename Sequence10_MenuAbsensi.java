import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Sequence10_MenuAbsensi {

    // ========================================================================
    // 1. MODEL ENTITAS: RecordKehadiran
    // ========================================================================
    public static class RecordKehadiran {
        private String nis;
        private String namaSiswa;
        private String kelas;
        private String status; // "Hadir", "Sakit", "Izin", "Alfa", "Belum Absen"
        private String waktuAbsen;

        public RecordKehadiran(String nis, String namaSiswa, String kelas, String status, String waktuAbsen) {
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.kelas = kelas;
            this.status = status;
            this.waktuAbsen = waktuAbsen;
        }

        public String getNis() { return nis; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getKelas() { return kelas; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getWaktuAbsen() { return waktuAbsen; }
        public void setWaktuAbsen(String waktuAbsen) { this.waktuAbsen = waktuAbsen; }
    }

    // ========================================================================
    // 2. LIFELINE / OBJEK: Database
    // ========================================================================
    public static class Database {
        private Map<String, Boolean> statusPertemuanMap = new HashMap<>();
        private Map<String, RecordKehadiran> tabelAbsensi = new HashMap<>();

        public Database() {
            // Sesi pelajaran Matematika SMA 2 Padalarang (Status pertemuan aktif)
            statusPertemuanMap.put("SESI-01", true);

            // Data siswa kelas
            tabelAbsensi.put("22231001", new RecordKehadiran("22231001", "Muhammad Rizky Pratama", "XII MIPA 1", "Belum Absen", "-"));
            tabelAbsensi.put("22231045", new RecordKehadiran("22231045", "Siti Nurhaliza Putri", "XII MIPA 1", "Belum Absen", "-"));
            tabelAbsensi.put("22231088", new RecordKehadiran("22231088", "Fajar Maulana Sidik", "XII MIPA 1", "Belum Absen", "-"));
        }

        /**
         * Langkah 3 Sequence: "Query status pertemuan"
         * Langkah 4: Return "Status aktif"
         */
        public boolean queryStatusPertemuan(String idPertemuan) {
            System.out.println("[Database] -> Eksekusi: SELECT status_aktif FROM tb_pertemuan WHERE id = '" + idPertemuan + "'");
            boolean aktif = statusPertemuanMap.getOrDefault(idPertemuan, false);
            System.out.println("[Database] <-- Mengembalikan return: Status " + (aktif ? "aktif" : "tidak aktif"));
            return aktif;
        }

        /**
         * Langkah 8 Sequence: "Insert kehadiran (status: Hadir, waktu)"
         * Langkah 9: Return "Success"
         */
        public boolean insertKehadiran(String nis, String status, String waktu) {
            System.out.println("[Database] -> Eksekusi: INSERT INTO tb_absensi (nis, status, waktu) VALUES ('" + nis + "', '" + status + "', '" + waktu + "')");
            RecordKehadiran data = tabelAbsensi.get(nis);
            if (data != null) {
                data.setStatus(status);
                data.setWaktuAbsen(waktu);
                System.out.println("[Database] <-- Mengembalikan return: Success");
                return true;
            }
            return false;
        }

        /**
         * Langkah 14 Sequence: "Query daftar kehadiran siswa"
         * Langkah 15: Return "Daftar kehadiran"
         */
        public List<RecordKehadiran> queryDaftarKehadiranSiswa() {
            System.out.println("[Database] -> Eksekusi: SELECT * FROM tb_absensi");
            List<RecordKehadiran> list = new ArrayList<>(tabelAbsensi.values());
            System.out.println("[Database] <-- Mengembalikan return: 'Daftar kehadiran' (" + list.size() + " siswa).");
            return list;
        }

        /**
         * ALT 1 Langkah 17: "Otomatis catat alfa"
         * Langkah 18: Return "Success"
         */
        public boolean otomatisCatatAlfa(String nis) {
            System.out.println("[Database] -> Otomatis catat alfa: UPDATE tb_absensi SET status = 'Alfa' WHERE nis = '" + nis + "'");
            RecordKehadiran data = tabelAbsensi.get(nis);
            if (data != null && data.getStatus().equals("Belum Absen")) {
                data.setStatus("Alfa");
                data.setWaktuAbsen("Batas Waktu Habis");
                System.out.println("[Database] <-- Mengembalikan return: Success (Alfa tercatat)");
                return true;
            }
            return false;
        }

        /**
         * ALT 2 Langkah 21: "Update status absensi"
         * Langkah 22: Return "Success"
         */
        public boolean updateStatusAbsensi(String nis, String status) {
            System.out.println("[Database] -> Update status absensi: UPDATE tb_absensi SET status = '" + status + "' WHERE nis = '" + nis + "'");
            RecordKehadiran data = tabelAbsensi.get(nis);
            if (data != null) {
                data.setStatus(status);
                System.out.println("[Database] <-- Mengembalikan return: Success (Status berhasil diupdate)");
                return true;
            }
            return false;
        }
    }

    // ========================================================================
    // 3. LIFELINE / OBJEK: Absensi (Control / Service)
    // ========================================================================
    public static class Absensi {
        private Database database;

        public Absensi(Database database) {
            this.database = database;
        }

        /**
         * Langkah 2 Sequence: "requestMenuAbsensi()"
         */
        public boolean requestMenuAbsensi(String idPertemuan) {
            System.out.println("[Absensi] Method requestMenuAbsensi() dipanggil untuk pertemuan: " + idPertemuan);
            System.out.println("[Absensi] -> Mengirim pesan 'Query status pertemuan' ke Database...");
            return database.queryStatusPertemuan(idPertemuan);
        }

        /**
         * Langkah 7 Sequence: "AbsenHadir()"
         */
        public boolean AbsenHadir(String nis, String waktu) {
            System.out.println("[Absensi] Method AbsenHadir() dipanggil untuk NIS: " + nis);
            System.out.println("[Absensi] -> Mengirim pesan 'Insert kehadiran (status: Hadir, waktu)' ke Database...");
            return database.insertKehadiran(nis, "Hadir", waktu);
        }

        /**
         * Langkah 13 Sequence: "requestDaftarKehadiran()"
         */
        public List<RecordKehadiran> requestDaftarKehadiran() {
            System.out.println("[Absensi] Method requestDaftarKehadiran() dipanggil oleh Guru.");
            System.out.println("[Absensi] -> Mengirim pesan 'Query daftar kehadiran siswa' ke Database...");
            return database.queryDaftarKehadiranSiswa();
        }

        /**
         * ALT 1: Otomatis catat alfa
         */
        public boolean prosesOtomatisAlfa(String nis) {
            System.out.println("[Absensi] -> Mengirim pesan 'Otomatis catat alfa' ke Database...");
            return database.otomatisCatatAlfa(nis);
        }

        /**
         * ALT 2 Langkah 20: "requestUpdateStatus()"
         */
        public boolean requestUpdateStatus(String nis, String status) {
            System.out.println("[Absensi] Method requestUpdateStatus() dipanggil untuk NIS: " + nis + " menjadi: " + status);
            System.out.println("[Absensi] -> Mengirim pesan 'Update status absensi' ke Database...");
            return database.updateStatusAbsensi(nis, status);
        }
    }

    // ========================================================================
    // 4. LIFELINE / OBJEK: UI Absensi (Boundary / View)
    // ========================================================================
    public static class UIAbsensi {
        private Absensi controllerAbsensi;

        public UIAbsensi(Absensi controllerAbsensi) {
            this.controllerAbsensi = controllerAbsensi;
        }

        /**
         * Langkah 1 Sequence: Siswa -> UI Absensi: "Membuka menu absensi"
         */
        public void membukaMenuAbsensi(String idPertemuan) {
            System.out.println("\n-----------------------------------------------------------");
            System.out.println("[UI Absensi] Siswa melakukan aksi: 'Membuka menu absensi'");
            System.out.println("-----------------------------------------------------------");

            // Langkah 2: UI Absensi -> Absensi: requestMenuAbsensi()
            System.out.println("[UI Absensi] -> Memanggil requestMenuAbsensi() pada kelas Absensi...");
            boolean statusAktif = controllerAbsensi.requestMenuAbsensi(idPertemuan);

            // Langkah 5: Absensi --> UI Absensi: Tampilkan tombol hadir
            if (statusAktif) {
                tampilkanTombolHadir();
            } else {
                System.out.println("[UI Absensi] Pertemuan belum dibuka. Tombol hadir tidak aktif.");
            }
        }

        /**
         * Langkah 5: Tampilkan tombol hadir
         */
        public void tampilkanTombolHadir() {
            System.out.println("[UI Absensi] <-- Menampilkan Tombol di Layar: [KLIK TOMBOL HADIR]");
        }

        /**
         * Langkah 6 Sequence: Siswa -> UI Absensi: "Klik tombol hadir"
         */
        public void klikTombolHadir(String nisSiswa) {
            System.out.println("\n[UI Absensi] Siswa mengklik tombol hadir...");
            String waktuSekarang = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));

            // Langkah 7: UI Absensi -> Absensi: AbsenHadir()
            System.out.println("[UI Absensi] -> Memanggil AbsenHadir() pada kelas Absensi...");
            boolean sukses = controllerAbsensi.AbsenHadir(nisSiswa, waktuSekarang);

            // Langkah 10 & 11: Absen berhasil -> Notifikasi "Hadir tercatat"
            if (sukses) {
                System.out.println("[UI Absensi] <-- Menerima return 'Absen berhasil'.");
                notifikasiHadirTercatat();
            }
        }

        /**
         * Langkah 11: Notifikasi "Hadir tercatat"
         */
        public void notifikasiHadirTercatat() {
            System.out.println("===========================================================");
            System.out.println(">>> NOTIFIKASI SISWA: 'Hadir tercatat' <<<");
            System.out.println("Presensi kehadiran Anda di LMS SMA 2 Padalarang BERHASIL!");
            System.out.println("===========================================================\n");
        }

        /**
         * Langkah 12 Sequence: Guru -> UI Absensi: "Membuka daftar absensi"
         */
        public void membukaDaftarAbsensi() {
            System.out.println("-----------------------------------------------------------");
            System.out.println("[UI Absensi] Guru melakukan aksi: 'Membuka daftar absensi'");
            System.out.println("-----------------------------------------------------------");

            // Langkah 13: UI Absensi -> Absensi: requestDaftarKehadiran()
            System.out.println("[UI Absensi] -> Memanggil requestDaftarKehadiran() pada kelas Absensi...");
            List<RecordKehadiran> list = controllerAbsensi.requestDaftarKehadiran();

            // Langkah 16: Tampilkan daftar absensi
            tampilkanDaftarAbsensi(list);
        }

        /**
         * Langkah 16: Tampilkan daftar absensi kepada Guru
         */
        public void tampilkanDaftarAbsensi(List<RecordKehadiran> list) {
            System.out.println("\n[UI Absensi] <-- TAMPILKAN DAFTAR ABSENSI KEPADA GURU:");
            System.out.println("===========================================================");
            System.out.printf("%-10s | %-24s | %-12s | %-10s\n", "NIS", "Nama Siswa", "Status", "Waktu Absen");
            System.out.println("-----------------------------------------------------------");
            for (RecordKehadiran r : list) {
                System.out.printf("%-10s | %-24s | %-12s | %-10s\n", r.getNis(), r.getNamaSiswa(), r.getStatus(), r.getWaktuAbsen());
            }
            System.out.println("===========================================================\n");
        }

        /**
         * ALT 2 Langkah 19: Guru -> UI Absensi: "Ubah status"
         */
        public void ubahStatus(String nis, String status) {
            System.out.println("-----------------------------------------------------------");
            System.out.println("[UI Absensi] Guru melakukan aksi: 'Ubah status' (NIS: " + nis + " -> " + status + ")");
            System.out.println("-----------------------------------------------------------");

            // Langkah 20: requestUpdateStatus()
            System.out.println("[UI Absensi] -> Memanggil requestUpdateStatus() pada kelas Absensi...");
            boolean sukses = controllerAbsensi.requestUpdateStatus(nis, status);

            // Langkah 23: Status diperbarui
            if (sukses) {
                statusDiperbarui();
            }
        }

        /**
         * Langkah 23: Status diperbarui
         */
        public void statusDiperbarui() {
            System.out.println("[UI Absensi] <-- Return diterima: Status diperbarui.");
            System.out.println("Status absensi siswa di sistem LMS berhasil diperbarui oleh Guru!\n");
        }
    }

    // ========================================================================
    // 5. AKTOR: Siswa & Guru
    // ========================================================================
    public static class Siswa {
        private String nis;
        private String nama;

        public Siswa(String nis, String nama) {
            this.nis = nis;
            this.nama = nama;
        }

        public void aksiBukaMenuAbsensi(UIAbsensi ui) {
            System.out.println("[Aktor Siswa] " + nama + " membuka menu absensi di LMS.");
            ui.membukaMenuAbsensi("SESI-01");
        }

        public void aksiKlikHadir(UIAbsensi ui) {
            System.out.println("[Aktor Siswa] " + nama + " menekan tombol Hadir.");
            ui.klikTombolHadir(this.nis);
        }
    }

    public static class Guru {
        private String nip;
        private String nama;

        public Guru(String nip, String nama) {
            this.nip = nip;
            this.nama = nama;
        }

        public void aksiBukaDaftarAbsensi(UIAbsensi ui) {
            System.out.println("[Aktor Guru] " + nama + " membuka daftar rekap absensi kelas.");
            ui.membukaDaftarAbsensi();
        }

        public void aksiUbahStatus(UIAbsensi ui, String nis, String statusBaru) {
            System.out.println("[Aktor Guru] " + nama + " mengubah status siswa NIS " + nis + " menjadi " + statusBaru);
            ui.ubahStatus(nis, statusBaru);
        }
    }

    // ========================================================================
    // MAIN METHOD: Pengujian Seluruh Skenario Diagram Sequence 10
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  LMS SMA NEGERI 2 PADALARANG - DIAGRAM SEQUENCE 10: MENU ABSENSI");
        System.out.println("=================================================================");

        // 1. Inisialisasi Objek
        Database database = new Database();
        Absensi absensiService = new Absensi(database);
        UIAbsensi uiAbsensi = new UIAbsensi(absensiService);

        Siswa siswa = new Siswa("22231001", "Muhammad Rizky Pratama");
        Guru guru = new Guru("198204152008011004", "Drs. Budi Santoso, M.Pd.");

        // FASE 1: Siswa Mengisi Kehadiran (Langkah 1 s/d 11)
        System.out.println("\n>>> [FASE 1] Siswa Membuka Menu dan Melakukan Presensi Hadir");
        siswa.aksiBukaMenuAbsensi(uiAbsensi);
        siswa.aksiKlikHadir(uiAbsensi);

        // FASE 2: Guru Membuka Rekap Absensi (Langkah 12 s/d 16)
        System.out.println("\n>>> [FASE 2] Guru Membuka Rekapitulasi Daftar Kehadiran");
        guru.aksiBukaDaftarAbsensi(uiAbsensi);

        // FASE 3 (ALT KONDISI 1): Siswa Tidak Hadir (Otomatis Alfa) (Langkah 17 s/d 18)
        System.out.println("\n>>> [FASE 3 - ALT KONDISI 1] Siswa Tidak Hadir (Alfa)");
        System.out.println("Batas jam pelajaran berakhir, sistem mengeksekusi otomatis catat alfa:");
        absensiService.prosesOtomatisAlfa("22231088"); // Fajar Maulana Sidik tidak absen

        // FASE 4 (ALT KONDISI 2): Guru Mengubah Status (Izin/Sakit) (Langkah 19 s/d 23)
        System.out.println("\n>>> [FASE 4 - ALT KONDISI 2] Guru Mengubah Status Kehadiran");
        System.out.println("Siti Nurhaliza Putri mengirimkan surat izin dokter, Guru mengubah status:");
        guru.aksiUbahStatus(uiAbsensi, "22231045", "Sakit");

        // Rekapitulasi Akhir
        System.out.println("\n>>> [REKAPITULASI AKHIR] Status Terkini Seluruh Siswa:");
        guru.aksiBukaDaftarAbsensi(uiAbsensi);
    }
}