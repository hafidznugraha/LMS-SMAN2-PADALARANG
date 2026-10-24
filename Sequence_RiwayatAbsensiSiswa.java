/**
 * ============================================================================
 * PROYEK KELOMPOK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE: RIWAYAT ABSENSI DENGAN AKTOR SISWA (DENGAN BLOK ALT)
 * ============================================================================
 * Nama File: Sequence_RiwayatAbsensiSiswa.java
 * ============================================================================
 */

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Sequence_RiwayatAbsensiSiswa {

    // ========================================================================
    // 1. MODEL ENTITAS: ItemRiwayatAbsensi
    // ========================================================================
    public static class ItemRiwayatAbsensi {
        private String tanggal;
        private String mataPelajaran;
        private String pertemuanKe;
        private String status; // "Hadir", "Izin", "Sakit", "Alfa"
        private String jamPresensi;
        private String catatan;

        public ItemRiwayatAbsensi(String tanggal, String mataPelajaran, String pertemuanKe, 
                                  String status, String jamPresensi, String catatan) {
            this.tanggal = tanggal;
            this.mataPelajaran = mataPelajaran;
            this.pertemuanKe = pertemuanKe;
            this.status = status;
            this.jamPresensi = jamPresensi;
            this.catatan = catatan;
        }

        public String getTanggal() { return tanggal; }
        public String getMataPelajaran() { return mataPelajaran; }
        public String getPertemuanKe() { return pertemuanKe; }
        public String getStatus() { return status; }
        public String getJamPresensi() { return jamPresensi; }
        public String getCatatan() { return catatan; }
    }

    // ========================================================================
    // 2. LIFELINE / OBJEK: Database
    // ========================================================================
    public static class Database {
        // Simulasi database histori absensi per siswa di SMA Negeri 2 Padalarang
        private Map<String, List<ItemRiwayatAbsensi>> dbRiwayatAbsensi = new HashMap<>();

        public Database() {
            initSampleData();
        }

        private void initSampleData() {
            // Siswa 1: Muhammad Rizky Pratama (NIS: 22231001) -> DATA ABSENSI TERSEDIA
            List<ItemRiwayatAbsensi> riwayatRizky = new ArrayList<>();
            riwayatRizky.add(new ItemRiwayatAbsensi("2026-10-20", "Matematika Peminatan", "Pertemuan 01", "Hadir", "07:15", "Tepat Waktu"));
            riwayatRizky.add(new ItemRiwayatAbsensi("2026-10-21", "Fisika", "Pertemuan 01", "Hadir", "08:30", "Praktikum Optik"));
            riwayatRizky.add(new ItemRiwayatAbsensi("2026-10-22", "Kimia", "Pertemuan 02", "Izin", "-", "Surat Dispensasi Lomba"));
            riwayatRizky.add(new ItemRiwayatAbsensi("2026-10-23", "Biologi", "Pertemuan 02", "Hadir", "07:05", "Tepat Waktu"));
            riwayatRizky.add(new ItemRiwayatAbsensi("2026-10-24", "Informatika", "Pertemuan 03", "Hadir", "09:45", "Lab Komputer"));
            dbRiwayatAbsensi.put("22231001", riwayatRizky);

            // Siswa 2: Siswa Pindahan Baru (NIS: 22231999) -> DATA ABSENSI BELUM TERSEDIA (Untuk Pengujian ALT 2)
            dbRiwayatAbsensi.put("22231999", new ArrayList<>());
        }

        /**
         * Langkah 3 Sequence: "Query absensi siswa"
         * Langkah 4: Return "Data absensi"
         */
        public List<ItemRiwayatAbsensi> queryAbsensiSiswa(String nis) {
            System.out.println("[Database] -> Eksekusi: SELECT * FROM tb_riwayat_absensi WHERE nis = '" + nis + "' ORDER BY tanggal DESC");
            List<ItemRiwayatAbsensi> hasil = dbRiwayatAbsensi.get(nis);
            if (hasil == null) {
                hasil = new ArrayList<>();
            }
            System.out.println("[Database] <-- Mengembalikan return 'Data absensi' (" + hasil.size() + " rekaman ditemukan).");
            return hasil;
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
         * Langkah 2 Sequence: "LihatAbsensi()"
         * Langkah 3: Mengirim pesan "Query absensi siswa" ke Database
         * Langkah 4 & 5: Return "Daftar absensi" ke UI Absensi
         */
        public List<ItemRiwayatAbsensi> LihatAbsensi(String nis) {
            System.out.println("[Absensi] Method LihatAbsensi() dipanggil untuk NIS: " + nis);
            System.out.println("[Absensi] -> Mengirim pesan 'Query absensi siswa' ke Database...");
            List<ItemRiwayatAbsensi> data = database.queryAbsensiSiswa(nis);
            System.out.println("[Absensi] <-- Menerima 'Data absensi' dari Database dan mengembalikan 'Daftar absensi' ke UI.");
            return data;
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
         * Langkah 1 Sequence: Siswa -> UI Absensi : "Membuka menu riwayat absensi"
         */
        public void membukaMenuRiwayatAbsensi(String nisSiswa) {
            System.out.println("\n===========================================================");
            System.out.println("[UI Absensi] Aksi Siswa: 'Membuka menu riwayat absensi' (NIS: " + nisSiswa + ")");
            System.out.println("===========================================================");

            // Langkah 2: UI Absensi -> Absensi : LihatAbsensi()
            System.out.println("[UI Absensi] -> Memanggil LihatAbsensi() pada kelas Absensi...");
            List<ItemRiwayatAbsensi> daftar = controllerAbsensi.LihatAbsensi(nisSiswa);

            // Langkah 6 & Evaluasi Blok ALT
            tampilkanDaftarAbsensi(daftar);
        }

        /**
         * Langkah 6 & EVALUASI PERCABANGAN ALT (ALTERNATIVE):
         * ALT 1: [DATA ABSENSI TERSEDIA] -> Tampilkan daftar absensi (Hadir/Izin/Sakit/Alfa) -> Riwayat absensi tampil
         * ALT 2: [DATA ABSENSI BELUM TERSEDIA] -> Tampilkan pesan "Data absensi belum tersedia" -> Pesan ditampilkan
         */
        public void tampilkanDaftarAbsensi(List<ItemRiwayatAbsensi> daftar) {
            System.out.println("\n[UI Absensi] <-- EVALUASI BLOK PERCABANGAN ALT:");

            if (daftar != null && !daftar.isEmpty()) {
                // ============================================================
                // KONDISI ALT 1: [DATA ABSENSI TERSEDIA]
                // ============================================================
                System.out.println(">>> BLOK ALT: [DATA ABSENSI TERSEDIA] <<<");
                System.out.println("Tampilkan daftar absensi (Hadir/Izin/Sakit/Alfa):");
                System.out.println("-------------------------------------------------------------------------");
                System.out.printf("%-12s | %-22s | %-13s | %-8s | %-6s | %s\n", 
                                  "Tanggal", "Mata Pelajaran", "Pertemuan", "Status", "Jam", "Keterangan");
                System.out.println("-------------------------------------------------------------------------");

                int hadir = 0, izin = 0, sakit = 0, alfa = 0;
                for (ItemRiwayatAbsensi item : daftar) {
                    System.out.printf("%-12s | %-22s | %-13s | %-8s | %-6s | %s\n",
                        item.getTanggal(), item.getMataPelajaran(), item.getPertemuanKe(),
                        item.getStatus(), item.getJamPresensi(), item.getCatatan());
                    
                    if (item.getStatus().equalsIgnoreCase("Hadir")) hadir++;
                    else if (item.getStatus().equalsIgnoreCase("Izin")) izin++;
                    else if (item.getStatus().equalsIgnoreCase("Sakit")) sakit++;
                    else if (item.getStatus().equalsIgnoreCase("Alfa")) alfa++;
                }
                System.out.println("-------------------------------------------------------------------------");
                System.out.println("Rekapitulasi: Hadir=" + hadir + " | Izin=" + izin + " | Sakit=" + sakit + " | Alfa=" + alfa);
                
                // Return akhir ke Siswa
                System.out.println(">>> RETURN KE SISWA: [Riwayat absensi tampil] <<<\n");

            } else {
                // ============================================================
                // KONDISI ALT 2: [DATA ABSENSI BELUM TERSEDIA]
                // ============================================================
                System.out.println(">>> BLOK ALT: [DATA ABSENSI BELUM TERSEDIA] <<<");
                System.out.println("Tampilkan pesan: \"Data absensi belum tersedia\"");
                System.out.println("-------------------------------------------------------------------------");
                System.out.println("Pemberitahuan Sistem LMS SMA 2 Padalarang:");
                System.out.println("\"Data absensi belum tersedia untuk akun ini. Anda belum memiliki catatan presensi.\"");
                System.out.println("-------------------------------------------------------------------------");

                // Return akhir ke Siswa
                System.out.println(">>> RETURN KE SISWA: [Pesan ditampilkan] <<<\n");
            }
        }
    }

    public static class Siswa {
        private String nis;
        private String nama;
        private String kelas;

        public Siswa(String nis, String nama, String kelas) {
            this.nis = nis;
            this.nama = nama;
            this.kelas = kelas;
        }

        public void bukaMenuRiwayat(UIAbsensi ui) {
            System.out.println("[Siswa] " + nama + " (" + nis + " - " + kelas + ") mengakses menu riwayat absensi.");
            ui.membukaMenuRiwayatAbsensi(this.nis);
        }

        public String getNis() { return nis; }
        public String getNama() { return nama; }
    }

    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  LMS SMA NEGERI 2 PADALARANG - RIWAYAT ABSENSI (AKTOR SISWA)");
        System.out.println("  Simulasi Sequence Diagram Lengkap dengan Percabangan ALT");
        System.out.println("=================================================================");

        Database database = new Database();
        Absensi absensiService = new Absensi(database);
        UIAbsensi uiAbsensi = new UIAbsensi(absensiService);

        Siswa siswa1 = new Siswa("22231001", "Muhammad Rizky Pratama", "XII MIPA 1");
        System.out.println("\n>>> UJI COBA 1: [DATA ABSENSI TERSEDIA]");
        siswa1.bukaMenuRiwayat(uiAbsensi);

        Siswa siswa2 = new Siswa("22231999", "Bagas Saputra (Siswa Pindahan)", "XII MIPA 1");
        System.out.println("\n>>> UJI COBA 2: [DATA ABSENSI BELUM TERSEDIA]");
        siswa2.bukaMenuRiwayat(uiAbsensi);
    }
}