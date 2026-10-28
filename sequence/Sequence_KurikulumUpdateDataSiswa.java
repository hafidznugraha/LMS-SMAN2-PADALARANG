/**
 * ============================================================================
 * PROYEK KELOMPOK LMS SMA NEGERI 2 PADALARANG
 * DIAGRAM SEQUENCE: AKTOR KURIKULUM -> UPDATE DATA SISWA
 * ============================================================================
 * Nama File: Sequence_KurikulumUpdateDataSiswa.java
 * ============================================================================
 */

import java.util.HashMap;
import java.util.Map;

public class Sequence_KurikulumUpdateDataSiswa {

    // ========================================================================
    // 1. MODEL ENTITAS: DataSiswa (Mewakili DetailSiswa & DataBaru)
    // ========================================================================
    public static class DataSiswa {
        private String id; // NIS Siswa
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

        public void setKelas(String kelas) { this.kelas = kelas; }
        public void setNoHp(String noHp) { this.noHp = noHp; }
        public void setAlamat(String alamat) { this.alamat = alamat; }

        @Override
        public String toString() {
            return "ID/NIS: " + id + " | Nama: " + namaSiswa + " | Kelas: " + kelas + " | No.HP: " + noHp + " | Alamat: " + alamat;
        }
    }

    // ========================================================================
    // 2. LIFELINE / OBJEK: Database
    // ========================================================================
    public static class Database {
        private Map<String, DataSiswa> tabelSiswa = new HashMap<>();

        public Database() {
            initSampleData();
        }

        private void initSampleData() {
            // Data siswa terdaftar SMA Negeri 2 Padalarang
            tabelSiswa.put("22231001", new DataSiswa("22231001", "Muhammad Rizky Pratama", "XI MIPA 1", "MIPA", "081234567890", "Jl. Rancabali No. 12, Padalarang"));
            tabelSiswa.put("22231045", new DataSiswa("22231045", "Siti Nurhaliza Putri", "XII MIPA 1", "MIPA", "081987654321", "Jl. Raya Tagog No. 88, Padalarang"));
        }

        /**
         * Langkah 2 Sequence: UI Data Siswa -> Database : "GetSiswaById(Id)"
         * Langkah 3 Sequence: Database --> UI Data Siswa : "DetailSiswa"
         */
        public DataSiswa GetSiswaById(String id) {
            System.out.println("[Database] -> Mengeksekusi SQL: SELECT * FROM tb_siswa WHERE nis = '" + id + "'");
            DataSiswa detailSiswa = tabelSiswa.get(id);
            System.out.println("[Database] <-- Mengembalikan return: 'DetailSiswa' (" + (detailSiswa != null ? detailSiswa.getNamaSiswa() : "Tidak Ditemukan") + ")");
            return detailSiswa;
        }

        /**
         * Langkah 7 Sequence: Siswa -> Database : "UpdateDataSiswa(Id, DataBaru)"
         * Langkah 8 Sequence: Database --> Siswa : "Succes"
         */
        public boolean UpdateDataSiswa(String id, DataSiswa dataBaru) {
            System.out.println("[Database] -> Mengeksekusi SQL: UPDATE tb_siswa SET nama_siswa = '" + dataBaru.getNamaSiswa() 
                    + "', kelas = '" + dataBaru.getKelas() + "', jurusan = '" + dataBaru.getJurusan() 
                    + "', no_hp = '" + dataBaru.getNoHp() + "', alamat = '" + dataBaru.getAlamat() 
                    + "' WHERE nis = '" + id + "'");
            
            if (tabelSiswa.containsKey(id)) {
                tabelSiswa.put(id, dataBaru);
                System.out.println("[Database] <-- Mengembalikan return: 'Succes'");
                return true;
            }
            return false;
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
         * Langkah 6 Sequence: UI Data Siswa -> Siswa : "UpdateSiswa(Id, DataBaru)"
         * Langkah 7: Siswa -> Database : "UpdateDataSiswa(Id, DataBaru)"
         * Langkah 9: Siswa --> UI Data Siswa : "NotifikasiUpdate()"
         */
        public boolean UpdateSiswa(String id, DataSiswa dataBaru) {
            System.out.println("[Siswa (Controller)] Method UpdateSiswa(Id, DataBaru) dipanggil untuk NIS: " + id);
            
            // Langkah 7: Panggil UpdateDataSiswa ke Database
            System.out.println("[Siswa (Controller)] -> Mengirim pesan 'UpdateDataSiswa(Id, DataBaru)' ke Database...");
            boolean isSuccess = database.UpdateDataSiswa(id, dataBaru);

            // Langkah 9: NotifikasiUpdate() return ke UI Data Siswa
            if (isSuccess) {
                System.out.println("[Siswa (Controller)] <-- Menerima 'Succes' dari Database.");
                System.out.println("[Siswa (Controller)] <-- Mengembalikan return: 'NotifikasiUpdate()' ke UI Data Siswa.");
                return true;
            }
            return false;
        }
    }

    // ========================================================================
    // 4. LIFELINE / OBJEK: UI Data Siswa (Boundary / View)
    // ========================================================================
    public static class UIDataSiswa {
        private Database database;
        private Siswa controllerSiswa;

        public UIDataSiswa(Database database, Siswa controllerSiswa) {
            this.database = database;
            this.controllerSiswa = controllerSiswa;
        }

        /**
         * Langkah 1 Sequence: Kurikulum -> UI Data Siswa : "PilihSiswa"
         */
        public void PilihSiswa(String id) {
            System.out.println("\n-----------------------------------------------------------");
            System.out.println("[UI Data Siswa] Aksi Kurikulum: 'PilihSiswa' (NIS: " + id + ")");
            System.out.println("-----------------------------------------------------------");

            // Langkah 2: UI Data Siswa -> Database : GetSiswaById(Id)
            System.out.println("[UI Data Siswa] -> Memanggil GetSiswaById(Id) pada objek Database...");
            DataSiswa detail = database.GetSiswaById(id);

            // Langkah 4: UI Data Siswa --> Kurikulum : TampilkanFormEdit
            if (detail != null) {
                TampilkanFormEdit(detail);
            } else {
                System.out.println("[UI Data Siswa] Data siswa tidak ditemukan.");
            }
        }

        /**
         * Langkah 4 Sequence: UI Data Siswa --> Kurikulum : "TampilkanFormEdit"
         */
        public void TampilkanFormEdit(DataSiswa detail) {
            System.out.println("\n[UI Data Siswa] <-- Return: 'TampilkanFormEdit'");
            System.out.println("Form Edit Siswa (LMS SMA 2 Padalarang) ditampilkan dengan data saat ini:");
            System.out.println("  • NIS/ID       : " + detail.getId());
            System.out.println("  • Nama Lengkap : " + detail.getNamaSiswa());
            System.out.println("  • Kelas        : " + detail.getKelas());
            System.out.println("  • No. HP       : " + detail.getNoHp());
            System.out.println("  • Alamat       : " + detail.getAlamat());
            System.out.println("-----------------------------------------------------------\n");
        }

        /**
         * Langkah 5 Sequence: Kurikulum -> UI Data Siswa : "InputUpdate"
         */
        public void InputUpdate(String id, DataSiswa dataBaru) {
            System.out.println("===========================================================");
            System.out.println("[UI Data Siswa] Aksi Kurikulum: 'InputUpdate'");
            System.out.println("[UI Data Siswa] Data Pembaruan Baru: " + dataBaru);
            System.out.println("===========================================================");

            // Langkah 6: UI Data Siswa -> Siswa : UpdateSiswa(Id, DataBaru)
            System.out.println("[UI Data Siswa] -> Memanggil UpdateSiswa(Id, DataBaru) pada objek Siswa...");
            boolean hasilUpdate = controllerSiswa.UpdateSiswa(id, dataBaru);

            // Langkah 10: Tampilkan dialog konfirmasi akhir
            if (hasilUpdate) {
                System.out.println("[UI Data Siswa] <-- Menerima 'NotifikasiUpdate()' dari controller Siswa.");
                tampilkanStatus("Data siswa berhasil diupdate");
            }
        }

        /**
         * Langkah 10 Sequence: UI Data Siswa --> Kurikulum : tampilkanStatus("Data siswa berhasil diupdate")
         */
        public void tampilkanStatus(String pesan) {
            System.out.println("\n***********************************************************");
            System.out.println("[UI Data Siswa] <-- Return ke Aktor Kurikulum:");
            System.out.println(">>> DIALOG STATUS: tampilkanStatus(\"" + pesan + "\") <<<");
            System.out.println("Pemberitahuan Sistem: Perubahan data siswa telah tersimpan permanen di database LMS SMA 2 Padalarang.");
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

        public void aksiPilihSiswa(UIDataSiswa ui, String id) {
            System.out.println("[Aktor Kurikulum] " + nama + " (" + jabatan + ") memilih siswa NIS: " + id);
            ui.PilihSiswa(id);
        }

        public void aksiInputUpdate(UIDataSiswa ui, String id, DataSiswa dataBaru) {
            System.out.println("[Aktor Kurikulum] " + nama + " mengirimkan formulir pembaruan data siswa.");
            ui.InputUpdate(id, dataBaru);
        }

        public String getNama() { return nama; }
    }

    // ========================================================================
    // MAIN METHOD: Menjalankan Seluruh Alur Sequence Diagram
    // ========================================================================
    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK & LMS - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Sequence Diagram: Aktor Kurikulum (Update Data Siswa)");
        System.out.println("=================================================================");

        // Inisialisasi Objek / Lifeline
        Database database = new Database();
        Siswa controllerSiswa = new Siswa(database);
        UIDataSiswa uiDataSiswa = new UIDataSiswa(database, controllerSiswa);

        // Aktor Kurikulum SMA Negeri 2 Padalarang
        Kurikulum stafKurikulum = new Kurikulum("197805122005012003", "Dra. Hj. Nurjanah, M.Pd.", "Wakasek Kurikulum");

        // FASE 1: Langkah 1 s/d 4 (PilihSiswa -> GetSiswaById -> DetailSiswa -> TampilkanFormEdit)
        System.out.println(">>> [FASE 1] Memilih Siswa & Menampilkan Form Edit");
        stafKurikulum.aksiPilihSiswa(uiDataSiswa, "22231001");

        // FASE 2: Langkah 5 s/d 10 (InputUpdate -> UpdateSiswa -> UpdateDataSiswa -> Succes -> NotifikasiUpdate -> tampilkanStatus)
        System.out.println(">>> [FASE 2] Memasukkan Data Perubahan Siswa");
        // Skenario pembaruan: Siswa naik ke kelas XII MIPA 1, memperbarui no telepon dan alamat domisili
        DataSiswa dataDiperbarui = new DataSiswa(
            "22231001",
            "Muhammad Rizky Pratama",
            "XII MIPA 1", // Kelas baru
            "MIPA",
            "081299887766", // No HP baru
            "Jl. Raya Cimareme No. 204, Padalarang" // Alamat baru
        );
        stafKurikulum.aksiInputUpdate(uiDataSiswa, "22231001", dataDiperbarui);

        // Verifikasi kondisi akhir data siswa di database
        System.out.println(">>> VERIFIKASI AKHIR DATABASE TB_SISWA:");
        DataSiswa hasilAkhir = database.GetSiswaById("22231001");
        System.out.println("Data Terkini: " + hasilAkhir);
    }
}