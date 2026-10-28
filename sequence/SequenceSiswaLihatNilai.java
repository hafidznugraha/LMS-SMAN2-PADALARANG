import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SequenceSiswaLihatNilai {

    public static class ItemDaftarNilai {
        private String idNilai;
        private String mataPelajaran;
        private String guruPengampu;
        private boolean sudahDiinput;

        public ItemDaftarNilai(String idNilai, String mataPelajaran, String guruPengampu, boolean sudahDiinput) {
            this.idNilai = idNilai;
            this.mataPelajaran = mataPelajaran;
            this.guruPengampu = guruPengampu;
            this.sudahDiinput = sudahDiinput;
        }

        public String getIdNilai() { return idNilai; }
        public String getMataPelajaran() { return mataPelajaran; }
        public String getGuruPengampu() { return guruPengampu; }
        public boolean isSudahDiinput() { return sudahDiinput; }
    }

    public static class DetailNilaiSiswa {
        private String idNilai;
        private String nis;
        private String namaSiswa;
        private String mataPelajaran;
        private String guruPengampu;
        private boolean sudahDiinput;
        private Double nilaiTugas;
        private Double nilaiUts;
        private Double nilaiUas;
        private Double nilaiAkhir;
        private String grade;
        private String komentarGuru;

        public DetailNilaiSiswa(String idNilai, String nis, String namaSiswa, String mataPelajaran,
                                String guruPengampu, double nilaiTugas, double nilaiUts, double nilaiUas, 
                                String komentarGuru) {
            this.idNilai = idNilai;
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.mataPelajaran = mataPelajaran;
            this.guruPengampu = guruPengampu;
            this.sudahDiinput = true;
            this.nilaiTugas = nilaiTugas;
            this.nilaiUts = nilaiUts;
            this.nilaiUas = nilaiUas;
            this.komentarGuru = komentarGuru;
            hitungNilaiAkhir();
        }

        public DetailNilaiSiswa(String idNilai, String nis, String namaSiswa, String mataPelajaran,
                                String guruPengampu) {
            this.idNilai = idNilai;
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.mataPelajaran = mataPelajaran;
            this.guruPengampu = guruPengampu;
            this.sudahDiinput = false;
            this.nilaiTugas = null;
            this.nilaiUts = null;
            this.nilaiUas = null;
            this.nilaiAkhir = null;
            this.grade = "-";
            this.komentarGuru = null;
        }

        private void hitungNilaiAkhir() {
            if (this.nilaiTugas != null && this.nilaiUts != null && this.nilaiUas != null) {
                this.nilaiAkhir = (this.nilaiTugas * 0.3) + (this.nilaiUts * 0.3) + (this.nilaiUas * 0.4);
                if (this.nilaiAkhir >= 88) this.grade = "A";
                else if (this.nilaiAkhir >= 78) this.grade = "B";
                else if (this.nilaiAkhir >= 65) this.grade = "C";
                else if (this.nilaiAkhir >= 50) this.grade = "D";
                else this.grade = "E";
            }
        }

        public String getIdNilai() { return idNilai; }
        public String getNis() { return nis; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getMataPelajaran() { return mataPelajaran; }
        public String getGuruPengampu() { return guruPengampu; }
        public boolean isSudahDiinput() { return sudahDiinput; }
        public Double getNilaiTugas() { return nilaiTugas; }
        public Double getNilaiUts() { return nilaiUts; }
        public Double getNilaiUas() { return nilaiUas; }
        public Double getNilaiAkhir() { return nilaiAkhir; }
        public String getGrade() { return grade; }
        public String getKomentarGuru() { return komentarGuru; }
    }

    public static class Database {
        private Map<String, DetailNilaiSiswa> databaseDetail = new HashMap<>();
        private List<ItemDaftarNilai> databaseDaftar = new ArrayList<>();

        public Database() {
            initSampleData();
        }

        private void initSampleData() {
            databaseDaftar.add(new ItemDaftarNilai("NIL-MAT-01", "Matematika Peminatan", "Drs. Budi Santoso, M.Pd.", true));
            databaseDetail.put("NIL-MAT-01", new DetailNilaiSiswa(
                "NIL-MAT-01", "22231001", "Muhammad Rizky Pratama", "Matematika Peminatan",
                "Drs. Budi Santoso, M.Pd.", 88.0, 85.0, 90.0,
                "Sangat Baik. Terus tingkatkan kemampuan kalkulus dan pemecahan masalah!"
            ));

            databaseDaftar.add(new ItemDaftarNilai("NIL-FIS-02", "Fisika", "Ibu Ratna Dewi, S.Pd.", true));
            databaseDetail.put("NIL-FIS-02", new DetailNilaiSiswa(
                "NIL-FIS-02", "22231001", "Muhammad Rizky Pratama", "Fisika",
                "Ibu Ratna Dewi, S.Pd.", 92.0, 90.0, 94.0,
                "Luar Biasa. Nilai praktikum gelombang optik sangat memuaskan."
            ));

            databaseDaftar.add(new ItemDaftarNilai("NIL-KIM-03", "Kimia", "Dra. Hj. Nurjanah", false));
            databaseDetail.put("NIL-KIM-03", new DetailNilaiSiswa(
                "NIL-KIM-03", "22231001", "Muhammad Rizky Pratama", "Kimia", "Dra. Hj. Nurjanah"
            ));
        }

        public List<ItemDaftarNilai> queryDaftarNilaiSiswa(String nis) {
            System.out.println("[Database] -> Eksekusi: SELECT * FROM tb_nilai WHERE nis = '" + nis + "'");
            System.out.println("[Database] <-- Mengembalikan return: 'Daftar nilai' (" + databaseDaftar.size() + " mata pelajaran).");
            return databaseDaftar;
        }

        public DetailNilaiSiswa ambilDetailNilai(String idNilai) {
            System.out.println("[Database] -> Eksekusi: SELECT * FROM tb_detail_nilai WHERE id_nilai = '" + idNilai + "'");
            DetailNilaiSiswa data = databaseDetail.get(idNilai);
            System.out.println("[Database] <-- Mengembalikan return: 'Detail Nilai'.");
            return data;
        }
    }

    public static class Nilai {
        private Database database;

        public Nilai(Database database) {
            this.database = database;
        }

        public List<ItemDaftarNilai> requesDaftarNilai(String nis) {
            System.out.println("[Nilai] Method requesDaftarNilai() dipanggil untuk NIS: " + nis);
            System.out.println("[Nilai] -> Mengirim pesan 'Query daftar nilai siswa' ke Database...");
            List<ItemDaftarNilai> daftar = database.queryDaftarNilaiSiswa(nis);
            System.out.println("[Nilai] <-- Menerima 'Daftar nilai' dari Database dan mengembalikannya ke Ui Nilai.");
            return daftar;
        }

        public DetailNilaiSiswa LihatNilai(String idNilai) {
            System.out.println("[Nilai] Method LihatNilai() dipanggil untuk ID: " + idNilai);
            System.out.println("[Nilai] -> Mengirim pesan 'Ambil detail nilai' ke Database...");
            DetailNilaiSiswa detail = database.ambilDetailNilai(idNilai);
            System.out.println("[Nilai] <-- Menerima 'Detail Nilai' dari Database dan mengembalikannya ke Ui Nilai.");
            return detail;
        }
    }

    public static class UiNilai {
        private Nilai controllerNilai;

        public UiNilai(Nilai controllerNilai) {
            this.controllerNilai = controllerNilai;
        }

        public void membukaMenuNilai(String nisSiswa) {
            System.out.println("\n===========================================================");
            System.out.println("[Ui Nilai] Aksi Siswa: 'Membuka menu nilai'");
            System.out.println("===========================================================");
            
            System.out.println("[Ui Nilai] -> Memanggil requesDaftarNilai() pada kelas Nilai...");
            List<ItemDaftarNilai> daftarNilai = controllerNilai.requesDaftarNilai(nisSiswa);

            tampilkanDaftarNilai(daftarNilai);
        }

        public void tampilkanDaftarNilai(List<ItemDaftarNilai> daftar) {
            System.out.println("\n[Ui Nilai] <-- TAMPILKAN DAFTAR NILAI KEPADA SISWA");
            System.out.println("-----------------------------------------------------------");
            System.out.println("No | ID Nilai     | Mata Pelajaran          | Status Input");
            System.out.println("-----------------------------------------------------------");
            int no = 1;
            for (ItemDaftarNilai item : daftar) {
                String status = item.isSudahDiinput() ? "[Sudah Diinput]" : "[Belum Diinput]";
                System.out.printf("%-2d | %-12s | %-23s | %s\n", no++, item.getIdNilai(), item.getMataPelajaran(), status);
            }
            System.out.println("-----------------------------------------------------------\n");
        }

        public void pilihSalahSatuNilai(String idNilai) {
            System.out.println("===========================================================");
            System.out.println("[Ui Nilai] Aksi Siswa: 'Pilih salah satu nilai' (ID: " + idNilai + ")");
            System.out.println("===========================================================");

            System.out.println("[Ui Nilai] -> Memanggil LihatNilai() pada kelas Nilai...");
            DetailNilaiSiswa detail = controllerNilai.LihatNilai(idNilai);

            tampilkanDetailNilai(detail);
        }

        public void tampilkanDetailNilai(DetailNilaiSiswa detail) {
            System.out.println("\n[Ui Nilai] <-- TAMPILKAN DETAIL NILAI:");
            
            if (detail == null) {
                System.out.println("Data nilai tidak ditemukan!");
                return;
            }

            if (detail.isSudahDiinput()) {

                System.out.println(">>> BLOK ALT: [NILAI SUDAH DIINPUT] <<<");
                System.out.println("-----------------------------------------------------------");
                System.out.println("Mata Pelajaran : " + detail.getMataPelajaran());
                System.out.println("Guru Pengampu  : " + detail.getGuruPengampu());
                System.out.println("Nilai Tugas    : " + detail.getNilaiTugas());
                System.out.println("Nilai UTS      : " + detail.getNilaiUts());
                System.out.println("Nilai UAS      : " + detail.getNilaiUas());
                System.out.println("Nilai Akhir    : " + String.format("%.2f", detail.getNilaiAkhir()) + " (" + detail.getGrade() + ")");
                System.out.println("Komentar Guru  : \"" + detail.getKomentarGuru() + "\"");
                System.out.println("STATUS KELUARAN: [Nilai tampil]");
                System.out.println("-----------------------------------------------------------\n");
            } else {
                System.out.println(">>> BLOK ALT: [NILAI BELUM DIINPUT] <<<");
                System.out.println("-----------------------------------------------------------");
                System.out.println("Mata Pelajaran : " + detail.getMataPelajaran());
                System.out.println("Guru Pengampu  : " + detail.getGuruPengampu());
                System.out.println("STATUS         : Status \"Belum dinilai\"");
                System.out.println("PESAN KELUARAN : Tampilkan pesan \"Belum dinilai\"");
                System.out.println("Keterangan     : Guru pengampu mata pelajaran ini belum memasukkan nilai evaluasi.");
                System.out.println("-----------------------------------------------------------\n");
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

        public void aksiBukaMenuNilai(UiNilai ui) {
            System.out.println("[Siswa] " + nama + " (" + nis + " - " + kelas + ") membuka menu nilai.");
            ui.membukaMenuNilai(this.nis);
        }

        public void aksiPilihSalahSatuNilai(UiNilai ui, String idNilai) {
            System.out.println("[Siswa] " + nama + " memilih nilai: " + idNilai);
            ui.pilihSalahSatuNilai(idNilai);
        }
    }

    public static void main(String[] args) {
        System.out.println("=================================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK LMS - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Sequence Diagram: Aktor Siswa (Lihat Nilai & ALT)");
        System.out.println("=================================================================");

        Database database = new Database();
        Nilai nilaiController = new Nilai(database);
        UiNilai uiNilai = new UiNilai(nilaiController);

        Siswa siswa = new Siswa("22231001", "Muhammad Rizky Pratama", "XII MIPA 1");

        siswa.aksiBukaMenuNilai(uiNilai);

        System.out.println(">>> TEST CASE 1: Memilih Nilai yang SUDAH DIINPUT");
        siswa.aksiPilihSalahSatuNilai(uiNilai, "NIL-MAT-01");

        System.out.println(">>> TEST CASE 2: Memilih Nilai yang BELUM DIINPUT");
        siswa.aksiPilihSalahSatuNilai(uiNilai, "NIL-KIM-03");
    }
}