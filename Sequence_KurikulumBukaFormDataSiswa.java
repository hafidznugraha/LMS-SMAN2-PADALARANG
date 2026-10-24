/**
 * ============================================================================
 * PROYEK KELOMPOK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE: AKTOR KURIKULUM -> BUKA FORM DATA SISWA
 * ============================================================================
 * Nama File: Sequence_KurikulumBukaFormDataSiswa.java
 * ============================================================================
 */

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Sequence_KurikulumBukaFormDataSiswa {

    // ========================================================================
    // 1. MODEL ENTITAS: Siswa (Representasi data siswa SMA 2 Padalarang)
    // ========================================================================
    public static class Siswa {
        private String nis;
        private String namaSiswa;
        private String kelas;
        private String jurusan;
        private String statusAkademik; // "Aktif", "Lulus", "Pindah"

        public Siswa(String nis, String namaSiswa, String kelas, String jurusan, String statusAkademik) {
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.kelas = kelas;
            this.jurusan = jurusan;
            this.statusAkademik = statusAkademik;
        }

        public String getNis() { return nis; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getKelas() { return kelas; }
        public String getJurusan() { return jurusan; }
        public String getStatusAkademik() { return statusAkademik; }

        @Override
        public String toString() {
            return String.format("%-10s | %-25s | %-12s | %-10s | %-8s", 
                                 nis, namaSiswa, kelas, jurusan, statusAkademik);
        }
    }

    // ========================================================================
    // 2. LIFELINE / OBJEK: Database
    // ========================================================================
    public static class Database {
        private Map<String, Siswa> masterTabelSiswa = new HashMap<>();

        public Database() {
            initSampleData();
        }

        private void initSampleData() {
            // Data siswa terdaftar di SMA Negeri 2 Padalarang
            masterTabelSiswa.put("22231001", new Siswa("22231001", "Muhammad Rizky Pratama", "XII MIPA 1", "MIPA", "Aktif"));
            masterTabelSiswa.put("22231045", new Siswa("22231045", "Siti Nurhaliza Putri", "XII MIPA 1", "MIPA", "Aktif"));
            masterTabelSiswa.put("22231088", new Siswa("22231088", "Fajar Maulana Sidik", "XII MIPA 2", "MIPA", "Aktif"));
            masterTabelSiswa.put("22231102", new Siswa("22231102", "Anindya Putri Lestari", "XII IPS 1", "IPS", "Aktif"));
            masterTabelSiswa.put("22231120", new Siswa("22231120", "Ahmad Fauzi Hidayat", "X MIPA 2", "MIPA", "Aktif"));
        }

        /**
         * Langkah 2 Sequence: UI Data Siswa -> Database : "getDaftarSiswa()"
         * Langkah 3 Sequence: Database --> UI Data Siswa : "Daftarsiswa"
         */
        public List<Siswa> getDaftarSiswa() {
            System.out.println("[Database] -> Mengeksekusi SQL: SELECT * FROM tb_siswa ORDER BY kelas ASC, nama_siswa ASC");
            List<Siswa> daftarSiswa = new ArrayList<>(masterTabelSiswa.values());
            System.out.println("[Database] <-- Mengembalikan return: 'Daftarsiswa' (" + daftarSiswa.size() + " siswa ditemukan).");
            return daftarSiswa;
        }
    }

    // ========================================================================
    // 3. LIFELINE / OBJEK: UI Data Siswa (Boundary / View)
    // ========================================================================
    public static class UIDataSiswa {
        private Database database;

        public UIDataSiswa(Database database) {
            this.database = database;
        }

        public void bukaFormDatasiswa() {
            System.out.println("===========================================================");
            System.out.println("[UI Data Siswa] Aksi Kurikulum: 'bukaFormDatasiswa'");
            System.out.println("===========================================================");

            // Langkah 2: UI Data Siswa -> Database : getDaftarSiswa()
            System.out.println("[UI Data Siswa] -> Memanggil method getDaftarSiswa() pada objek Database...");
            List<Siswa> daftarSiswa = database.getDaftarSiswa();

            tampilkandaftarSiswa(daftarSiswa);
        }

        public void tampilkandaftarSiswa(List<Siswa> daftarSiswa) {
            System.out.println("\n[UI Data Siswa] <-- Return ke Aktor Kurikulum: 'Tampilkandaftar siswa'");
            System.out.println("=========================================================================");
            System.out.println("     DAFTAR MASTER DATA SISWA - SMA NEGERI 2 PADALARANG (TA 2026/2027)    ");
            System.out.println("=========================================================================");
            System.out.printf("%-10s | %-25s | %-12s | %-10s | %-8s\n", "NIS", "Nama Lengkap", "Kelas", "Jurusan", "Status");
            System.out.println("-------------------------------------------------------------------------");
            
            for (Siswa s : daftarSiswa) {
                System.out.println(s);
            }
            
            System.out.println("-------------------------------------------------------------------------");
            System.out.println("Total Siswa Terdaftar: " + daftarSiswa.size() + " siswa.");
            System.out.println("STATUS KELUARAN: [Tampilkandaftar siswa berhasil disajikan di layar]");
            System.out.println("=========================================================================\n");
        }
    }

    public static class Kurikulum {
        private String nip;
        private String nama;
        private String jabatan;

        public Kurikulum(String nip, String nama, String jabatan) {
            this.nip = nip;
            this.nama = nama;
            this.jabatan = jabatan;
        }

        public void aksiBukaFormDatasiswa(UIDataSiswa ui) {
            System.out.println("[Aktor Kurikulum] " + nama + " (" + jabatan + ") membuka form master data siswa.");
            ui.bukaFormDatasiswa();
        }

        public String getNama() { return nama; }
    }

    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK & LMS - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Sequence Diagram: Aktor Kurikulum (Buka Form Siswa)");
        System.out.println("=================================================================");

        Database database = new Database();
        UIDataSiswa uiDataSiswa = new UIDataSiswa(database);

        Kurikulum stafKurikulum = new Kurikulum("197805122005012003", "Dra. Hj. Nurjanah, M.Pd.", "Wakasek Kurikulum");
        stafKurikulum.aksiBukaFormDatasiswa(uiDataSiswa);
    }
}