import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class Sequence_KurikulumInputDataSiswa {

    public static class DataSiswa {
        private String nis;
        private String namaSiswa;
        private String kelas;
        private String jurusan;
        private String jenisKelamin;
        private String tahunAjaran;

        public DataSiswa(String nis, String namaSiswa, String kelas, String jurusan, 
                         String jenisKelamin, String tahunAjaran) {
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.kelas = kelas;
            this.jurusan = jurusan;
            this.jenisKelamin = jenisKelamin;
            this.tahunAjaran = tahunAjaran;
        }

        public String getNis() { return nis; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getKelas() { return kelas; }
        public String getJurusan() { return jurusan; }
        public String getJenisKelamin() { return jenisKelamin; }
        public String getTahunAjaran() { return tahunAjaran; }

        @Override
        public String toString() {
            return "NIS: " + nis + " | Nama: " + namaSiswa + " | Kelas: " + kelas + " (" + jurusan + ")";
        }
    }

    public static class Database {
        private Map<String, DataSiswa> tabelSiswa = new HashMap<>();

        public Database() {
            tabelSiswa.put("22231001", new DataSiswa("22231001", "Muhammad Rizky Pratama", "XII MIPA 1", "MIPA", "Laki-laki", "2024/2025"));
            tabelSiswa.put("22231045", new DataSiswa("22231045", "Siti Nurhaliza Putri", "XII MIPA 1", "MIPA", "Perempuan", "2024/2025"));
        }

        public boolean insertDataSiswa(DataSiswa data) {
            System.out.println("[Database] -> Mengeksekusi SQL: INSERT INTO tb_siswa (nis, nama_siswa, kelas, jurusan, jenis_kelamin, tahun_ajaran) "
                    + "VALUES ('" + data.getNis() + "', '" + data.getNamaSiswa() + "', '" + data.getKelas() + "', '" 
                    + data.getJurusan() + "', '" + data.getJenisKelamin() + "', '" + data.getTahunAjaran() + "')");
            
            tabelSiswa.put(data.getNis(), data);

            System.out.println("[Database] <-- Mengembalikan return: 'succes'");
            return true;
        }

        public List<DataSiswa> getAllSiswa() {
            return new ArrayList<>(tabelSiswa.values());
        }
    }

    public static class Siswa {
        private Database database;

        public Siswa(Database database) {
            this.database = database;
        }

        public boolean tambahdatasiswa(DataSiswa data) {
            System.out.println("[Siswa (Controller)] Method tambahdatasiswa(data) dipanggil.");
            System.out.println("[Siswa (Controller)] Memvalidasi data: " + data.getNamaSiswa() + " (NIS: " + data.getNis() + ")");

            System.out.println("[Siswa (Controller)] -> Mengirim pesan 'insertDataSiswa' ke Database...");
            boolean isSuccess = database.insertDataSiswa(data);

            if (isSuccess) {
                System.out.println("[Siswa (Controller)] <-- Menerima 'succes' dari Database.");
                System.out.println("[Siswa (Controller)] <-- Mengembalikan return: 'notifikasiBerhasil' ke UI Data Siswa.");
                return true;
            }
            return false;
        }
    }

    public static class UIDataSiswa {
        private Siswa controllerSiswa;

        public UIDataSiswa(Siswa controllerSiswa) {
            this.controllerSiswa = controllerSiswa;
        }

        public void bukaFormInput() {
            System.out.println("\n-----------------------------------------------------------");
            System.out.println("[UI Data Siswa] Menerima request: 'bukaFormInput' dari Kurikulum");
            System.out.println("-----------------------------------------------------------");
            tampilkanFormInput();
        }

        public void tampilkanFormInput() {
            System.out.println("[UI Data Siswa] <-- Return: tampilkanFormInput()");
            System.out.println("[UI Data Siswa] Form input data siswa SMA Negeri 2 Padalarang siap menerima input.");
            System.out.println("-----------------------------------------------------------\n");
        }

        public void InputDataSiswa(DataSiswa data) {
            System.out.println("===========================================================");
            System.out.println("[UI Data Siswa] Aksi Kurikulum: 'InputDataSiswa'");
            System.out.println("[UI Data Siswa] Menerima input: " + data);
            System.out.println("===========================================================");

            System.out.println("[UI Data Siswa] -> Memanggil tambahdatasiswa(data) pada objek Siswa...");
            boolean statusBerhasil = controllerSiswa.tambahdatasiswa(data);

            if (statusBerhasil) {
                System.out.println("[UI Data Siswa] <-- Menerima 'notifikasiBerhasil' dari objek Siswa.");
                tampilkanPesan("Data Siswa ditambahkan");
            }
        }

        public void tampilkanPesan(String pesan) {
            System.out.println("\n***********************************************************");
            System.out.println("[UI Data Siswa] <-- Return ke Aktor Kurikulum:");
            System.out.println(">>> NOTIFIKASI DIALOG: tampilkanPesan(\"" + pesan + "\") <<<");
            System.out.println("Pesan Sistem: Selamat, data siswa baru berhasil disimpan ke database LMS SMA Negeri 2 Padalarang!");
            System.out.println("***********************************************************\n");
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

        public void aksiBukaFormInput(UIDataSiswa ui) {
            System.out.println("[Kurikulum] " + nama + " (" + jabatan + ") meminta buka form input.");
            ui.bukaFormInput();
        }

        public void aksiInputDataSiswa(UIDataSiswa ui, DataSiswa data) {
            System.out.println("[Kurikulum] " + nama + " mengisi formulir dan mengirim data siswa baru: " + data.getNamaSiswa());
            ui.InputDataSiswa(data);
        }

        public String getNama() { return nama; }
    }

    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK & LMS - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Sequence Diagram: Aktor Kurikulum (Input Data Siswa)");
        System.out.println("=================================================================");

        Database database = new Database();
        Siswa controllerSiswa = new Siswa(database);
        UIDataSiswa uiDataSiswa = new UIDataSiswa(controllerSiswa);

        Kurikulum stafKurikulum = new Kurikulum("197805122005012003", "Dra. Hj. Nurjanah, M.Pd.", "Wakasek Kurikulum");

        System.out.println(">>> TAHAP 1: Membuka Form Input Siswa");
        stafKurikulum.aksiBukaFormInput(uiDataSiswa);

        DataSiswa siswaBaru = new DataSiswa(
            "22231120", 
            "Ahmad Fauzi Hidayat", 
            "X MIPA 2", 
            "MIPA", 
            "Laki-laki", 
            "2026/2027"
        );

        System.out.println(">>> TAHAP 2: Mengisi dan Menyimpan Data Siswa");
        stafKurikulum.aksiInputDataSiswa(uiDataSiswa, siswaBaru);

        System.out.println(">>> VERIFIKASI AKHIR DATABASE SISWA SMA NEGERI 2 PADALARANG:");
        System.out.println("-----------------------------------------------------------------");
        System.out.printf("%-10s | %-25s | %-12s | %-10s\n", "NIS", "Nama Siswa", "Kelas", "Jurusan");
        System.out.println("-----------------------------------------------------------------");
        for (DataSiswa s : database.getAllSiswa()) {
            System.out.printf("%-10s | %-25s | %-12s | %-10s\n", s.getNis(), s.getNamaSiswa(), s.getKelas(), s.getJurusan());
        }
        System.out.println("-----------------------------------------------------------------");
    }
}