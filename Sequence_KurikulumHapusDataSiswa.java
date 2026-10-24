/**
 * ============================================================================
 * PROYEK KELOMPOK SISTEM INFORMASI AKADEMIK & LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE 08: AKTOR KURIKULUM -> MENGHAPUS DATA SISWA
 * ============================================================================
 * Rekomendasi Nama File : Sequence_KurikulumHapusDataSiswa.java
 *
 * PEMETAAN LIFELINE & ROLE OBJECT:
 * 1. Actor               : Kurikulum (Staf / Tim Pengembang Kurikulum SMAN 2 Padalarang)
 * 2. UI Data Siswa       : Boundary / Antarmuka Pengelolaan Siswa
 * 3. Siswa               : Controller / Business Logic Service
 * 4. Database            : Database Storage (DAO / Repository tb_siswa)
 *
 * PEMETAAN 8 ALUR PESAN (SEQUENCE MESSAGES):
 * [Langkah 1] Kurikulum -> UI Data Siswa   : PilihSiswaUntukHapus
 * [Langkah 2] UI Data Siswa --> Kurikulum  : TampilkanKonfirmasi
 * [Langkah 3] Kurikulum -> UI Data Siswa   : KonfirmasiYa
 * [Langkah 4] UI Data Siswa -> Siswa       : HapusSiswa()
 * [Langkah 5] Siswa -> Database            : DeleteDataSiswa()
 * [Langkah 6] Database --> Siswa           : succes
 * [Langkah 7] Siswa --> UI Data Siswa      : NotifikasiHapus
 * [Langkah 8] UI Data Siswa --> Kurikulum  : tampilkanStatus("Data siswa berhasil dihapus")
 * ============================================================================
 */

import java.util.HashMap;
import java.util.Map;

public class Sequence_KurikulumHapusDataSiswa {

    // ========================================================================
    // 1. MODEL ENTITY: DataSiswa
    // ========================================================================
    public static class DataSiswa {
        private String id; // NIS
        private String namaSiswa;
        private String kelas;
        private String jurusan;
        private String noHp;
        private String alamat;

        public DataSiswa(String id, String namaSiswa, String kelas, String jurusan, String noHp, String alamat) {
            this.id = id;
            this.namaSiswa = namaSiswa;
            this.kelas = kelas;
            this.jurusan = jurusan;
            this.noHp = noHp;
            this.alamat = alamat;
        }

        public String getId() { return id; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getKelas() { return kelas; }
        public String getJurusan() { return jurusan; }
        public String getNoHp() { return noHp; }
        public String getAlamat() { return alamat; }

        @Override
        public String toString() {
            return "[NIS: " + id + " | Nama: " + namaSiswa + " | Kelas: " + kelas + " | HP: " + noHp + "]";
        }
    }

    // ========================================================================
    // 2. LIFELINE / OBJEK: Database
    // ========================================================================
    public static class Database {
        private Map<String, DataSiswa> tabelSiswa = new HashMap<>();

        public Database() {
            // Data Master Siswa SMAN 2 Padalarang
            tabelSiswa.put("22231001", new DataSiswa(
                "22231001", "Muhammad Rizky Pratama", "XII MIPA 1", "MIPA", 
                "081234567890", "Jl. Rancabali No. 45, Padalarang"
            ));

            tabelSiswa.put("22231045", new DataSiswa(
                "22231045", "Siti Nurhaliza Putri", "XII MIPA 1", "MIPA", 
                "081987654321", "Jl. Kertajaya No. 12, KBB"
            ));

            tabelSiswa.put("22231088", new DataSiswa(
                "22231088", "Fajar Maulana Sidik", "XII IPS 2", "IPS", 
                "082122334455", "Jl. Ciburuy Raya No. 88, Padalarang"
            ));
        }

        /**
         * Langkah 5 Sequence: Siswa -> Database : DeleteDataSiswa()
         * Langkah 6 Sequence: Database --> Siswa : succes
         */
        public boolean DeleteDataSiswa(String nis) {
            System.out.println("[Database] -> Mengeksekusi SQL: DELETE FROM tb_siswa WHERE nis = '" + nis + "'");
            
            if (tabelSiswa.containsKey(nis)) {
                DataSiswa dihapus = tabelSiswa.remove(nis);
                System.out.println("[Database] Record berhasil dihapus: " + dihapus.getNamaSiswa() + " (" + nis + ")");
                System.out.println("[Database] <-- Mengembalikan return: 'succes'");
                return true;
            } else {
                System.out.println("[Database] Record dengan NIS " + nis + " tidak ditemukan!");
                return false;
            }
        }

        public DataSiswa getSiswa(String nis) {
            return tabelSiswa.get(nis);
        }

        public void cetakDaftarSiswa() {
            System.out.println("-----------------------------------------------------------------");
            System.out.println("TOTAL DATA DI DATABASE TB_SISWA (" + tabelSiswa.size() + " siswa):");
            for (DataSiswa s : tabelSiswa.values()) {
                System.out.println("  • " + s);
            }
            System.out.println("-----------------------------------------------------------------");
        }
    }

    // ========================================================================
    // 3. LIFELINE / OBJEK: Siswa (Controller / Logic Service)
    // ========================================================================
    public static class Siswa {
        private Database database;

        public Siswa(Database database) {
            this.database = database;
        }

        /**
         * Langkah 4 Sequence: UI Data Siswa -> Siswa : HapusSiswa()
         * Langkah 5: Siswa -> Database : DeleteDataSiswa()
         * Langkah 7: Siswa --> UI Data Siswa : NotifikasiHapus
         */
        public boolean HapusSiswa(String nis) {
            System.out.println("[Siswa (Controller)] Method HapusSiswa() dipanggil untuk NIS: " + nis);
            
            // Langkah 5: Siswa -> Database : DeleteDataSiswa()
            System.out.println("[Siswa (Controller)] -> Mengirim pesan 'DeleteDataSiswa()' ke Database...");
            boolean isSuccess = database.DeleteDataSiswa(nis);

            // Langkah 6 & 7: Menerima 'succes' dan mengembalikan 'NotifikasiHapus'
            if (isSuccess) {
                System.out.println("[Siswa (Controller)] <-- Menerima return 'succes' dari Database.");
                System.out.println("[Siswa (Controller)] <-- Mengembalikan return: 'NotifikasiHapus' ke UI Data Siswa.");
                return true;
            }
            return false;
        }
    }

    // ========================================================================
    // 4. LIFELINE / OBJEK: UI Data Siswa (Boundary / View)
    // ========================================================================
    public static class UIDataSiswa {
        private Siswa controllerSiswa;
        private Database database;

        public UIDataSiswa(Database database, Siswa controllerSiswa) {
            this.database = database;
            this.controllerSiswa = controllerSiswa;
        }

        /**
         * Langkah 1 Sequence: Kurikulum -> UI Data Siswa : PilihSiswaUntukHapus
         * Langkah 2 Sequence: UI Data Siswa --> Kurikulum : TampilkanKonfirmasi
         */
        public void PilihSiswaUntukHapus(String nis) {
            System.out.println("\n-----------------------------------------------------------");
            System.out.println("[UI Data Siswa] Aksi Kurikulum: 'PilihSiswaUntukHapus'");
            System.out.println("[UI Data Siswa] Siswa yang dipilih untuk dihapus: NIS " + nis);
            System.out.println("-----------------------------------------------------------");

            DataSiswa target = database.getSiswa(nis);
            String namaTarget = (target != null) ? target.getNamaSiswa() : "Tidak Diketahui";

            // Langkah 2: UI Data Siswa --> Kurikulum : TampilkanKonfirmasi
            TampilkanKonfirmasi(nis, namaTarget);
        }

        /**
         * Langkah 2 Sequence: TampilkanKonfirmasi
         */
        public void TampilkanKonfirmasi(String nis, String namaTarget) {
            System.out.println("[UI Data Siswa] <-- Return ke Aktor Kurikulum: 'TampilkanKonfirmasi'");
            System.out.println("┌────────────────────────────────────────────────────────┐");
            System.out.println("│              DIALOG KONFIRMASI PENGHAPUSAN             │");
            System.out.println("├────────────────────────────────────────────────────────┤");
            System.out.println("│ Apakah Anda yakin ingin menghapus data siswa berikut?  │");
            System.out.println("│ NIS  : " + String.format("%-46s", nis) + " │");
            System.out.println("│ Nama : " + String.format("%-46s", namaTarget) + " │");
            System.out.println("│                                                        │");
            System.out.println("│ [1. KonfirmasiYa]            [2. Batal]                │");
            System.out.println("└────────────────────────────────────────────────────────┘");
        }

        /**
         * Langkah 3 Sequence: Kurikulum -> UI Data Siswa : KonfirmasiYa
         * Langkah 4 Sequence: UI Data Siswa -> Siswa : HapusSiswa()
         * Langkah 8 Sequence: UI Data Siswa --> Kurikulum : tampilkanStatus("Data siswa berhasil dihapus")
         */
        public void KonfirmasiYa(String nis) {
            System.out.println("\n[UI Data Siswa] Aksi Kurikulum: 'KonfirmasiYa' diterima.");
            System.out.println("[UI Data Siswa] Memproses penghapusan siswa NIS: " + nis);

            // Langkah 4: UI Data Siswa -> Siswa : HapusSiswa()
            System.out.println("[UI Data Siswa] -> Memanggil method HapusSiswa() pada Controller Siswa...");
            boolean notifikasiHapus = controllerSiswa.HapusSiswa(nis);

            // Langkah 7 & 8: Menerima NotifikasiHapus dan memanggil tampilkanStatus
            if (notifikasiHapus) {
                System.out.println("[UI Data Siswa] <-- Menerima 'NotifikasiHapus' dari Controller Siswa.");
                tampilkanStatus("Data siswa berhasil dihapus");
            } else {
                tampilkanStatus("Gagal menghapus data siswa.");
            }
        }

        /**
         * Langkah 8 Sequence: UI Data Siswa --> Kurikulum : tampilkanStatus("Data siswa berhasil dihapus")
         */
        public void tampilkanStatus(String pesan) {
            System.out.println("\n***********************************************************");
            System.out.println("[UI Data Siswa] <-- Return ke Aktor Kurikulum:");
            System.out.println(">>> MODAL STATUS: tampilkanStatus(\"" + pesan + "\") <<<");
            System.out.println("Pemberitahuan Sistem: Record siswa telah terhapus permanen dari basis data.");
            System.out.println("***********************************************************\n");
        }
    }

    // ========================================================================
    // 5. AKTOR: Kurikulum
    // ========================================================================
    public static class Kurikulum {
        private String nip;
        private String nama;
        private String jabatan;

        public Kurikulum(String nip, String nama, String jabatan) {
            this.nip = nip;
            this.nama = nama;
            this.jabatan = jabatan;
        }

        public void aksiPilihSiswaUntukHapus(UIDataSiswa ui, String nis) {
            System.out.println("[Aktor Kurikulum] " + nama + " (" + jabatan + ") memilih siswa NIS: " + nis + " untuk dihapus.");
            ui.PilihSiswaUntukHapus(nis);
        }

        public void aksiKonfirmasiYa(UIDataSiswa ui, String nis) {
            System.out.println("[Aktor Kurikulum] " + nama + " mengklik tombol [KonfirmasiYa].");
            ui.KonfirmasiYa(nis);
        }

        public String getNama() { return nama; }
    }

    // ========================================================================
    // MAIN METHOD: Menjalankan Seluruh Alur Sequence Diagram
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK & LMS - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Sequence Diagram: Aktor Kurikulum (Menghapus Data Siswa)");
        System.out.println("=================================================================");

        // Inisialisasi Objek / Lifeline
        Database database = new Database();
        Siswa controllerSiswa = new Siswa(database);
        UIDataSiswa uiDataSiswa = new UIDataSiswa(database, controllerSiswa);

        // Aktor Kurikulum SMA Negeri 2 Padalarang
        Kurikulum stafKurikulum = new Kurikulum("197805122005012003", "Dra. Hj. Nurjanah, M.Pd.", "Wakasek Kurikulum");

        // Tampilkan kondisi database awal
        System.out.println("\n[KONDISI AWAL DATABASE SEBELUM DIHAPUS]");
        database.cetakDaftarSiswa();

        // 1. Langkah 1: Kurikulum -> UI Data Siswa : PilihSiswaUntukHapus
        // 2. Langkah 2: UI Data Siswa --> Kurikulum : TampilkanKonfirmasi
        String nisDihapus = "22231088"; // Fajar Maulana Sidik
        stafKurikulum.aksiPilihSiswaUntukHapus(uiDataSiswa, nisDihapus);

        // 3. Langkah 3: Kurikulum -> UI Data Siswa : KonfirmasiYa
        // 4. Langkah 4: UI Data Siswa -> Siswa : HapusSiswa()
        // 5. Langkah 5: Siswa -> Database : DeleteDataSiswa()
        // 6. Langkah 6: Database --> Siswa : succes
        // 7. Langkah 7: Siswa --> UI Data Siswa : NotifikasiHapus
        // 8. Langkah 8: UI Data Siswa --> Kurikulum : tampilkanStatus("Data siswa berhasil dihapus")
        stafKurikulum.aksiKonfirmasiYa(uiDataSiswa, nisDihapus);

        // Tampilkan kondisi database akhir setelah dihapus
        System.out.println("[KONDISI AKHIR DATABASE SETELAH PENGHAPUSAN]");
        database.cetakDaftarSiswa();
    }
}