import java.util.HashMap;
import java.util.Map;

public class SequenceGuruLihatNilai {

    public static class DetailNilai {
        private String idNilai, nis, namaSiswa, kelas, mataPelajaran, grade, keterangan;
        private double nilaiTugas, nilaiUts, nilaiUas, nilaiAkhir;

        public DetailNilai(String idNilai, String nis, String namaSiswa, String kelas, 
                           String mataPelajaran, double nilaiTugas, double nilaiUts, 
                           double nilaiUas, String keterangan) {
            this.idNilai = idNilai;
            this.nis = nis;
            this.namaSiswa = namaSiswa;
            this.kelas = kelas;
            this.mataPelajaran = mataPelajaran;
            this.nilaiTugas = nilaiTugas;
            this.nilaiUts = nilaiUts;
            this.nilaiUas = nilaiUas;
            this.keterangan = keterangan;
            hitungNilaiAkhir();
        }

        private void hitungNilaiAkhir() {
            this.nilaiAkhir = (this.nilaiTugas * 0.3) + (this.nilaiUts * 0.3) + (this.nilaiUas * 0.4);
            if (this.nilaiAkhir >= 88) this.grade = "A";
            else if (this.nilaiAkhir >= 78) this.grade = "B";
            else if (this.nilaiAkhir >= 65) this.grade = "C";
            else if (this.nilaiAkhir >= 50) this.grade = "D";
            else this.grade = "E";
        }

        public String getIdNilai() { return idNilai; }
        public String getNis() { return nis; }
        public String getNamaSiswa() { return namaSiswa; }
        public String getKelas() { return kelas; }
        public String getMataPelajaran() { return mataPelajaran; }
        public double getNilaiTugas() { return nilaiTugas; }
        public double getNilaiUts() { return nilaiUts; }
        public double getNilaiUas() { return nilaiUas; }
        public double getNilaiAkhir() { return nilaiAkhir; }
        public String getGrade() { return grade; }
        public String getKeterangan() { return keterangan; }
    }

    public static class Database {
        private Map<String, DetailNilai> tabelNilai = new HashMap<>();

        public Database() {
            tabelNilai.put("NIL-2026-001", new DetailNilai(
                "NIL-2026-001", "22231001", "Muhammad Rizky Pratama", "XII MIPA 1",
                "Matematika Peminatan", 88.0, 85.0, 90.0,
                "Sangat Baik. Memahami materi kalkulus dan integral dengan sangat baik."
            ));
            tabelNilai.put("NIL-2026-002", new DetailNilai(
                "NIL-2026-002", "22231045", "Siti Nurhaliza Putri", "XII MIPA 1",
                "Fisika", 92.0, 90.0, 94.0,
                "Istimewa. Aktif dalam praktikum laboratorium fisika gelombang optik."
            ));
        }

        public DetailNilai ambilDetailNilai(String idNilai) {
            System.out.println("[Database] -> Menjalankan query: SELECT * FROM tb_nilai WHERE id = '" + idNilai + "'");
            DetailNilai detail = tabelNilai.get(idNilai);
            System.out.println("[Database] <-- Mengembalikan return 'Detail nilai' ke objek Nilai.");
            return detail;
        }
    }

    public static class Nilai {
        private Database database;

        public Nilai(Database database) {
            this.database = database;
        }

        public DetailNilai LihatNilai(String idNilai) {
            System.out.println("[Nilai] Method LihatNilai() dieksekusi dengan parameter: " + idNilai);
            System.out.println("[Nilai] -> Mengirim pesan 'Ambil detail nilai' ke objek Database...");
            DetailNilai detail = database.ambilDetailNilai(idNilai);
            System.out.println("[Nilai] <-- Menerima 'Detail nilai' dari Database dan mengembalikannya ke Ui Nilai.");
            return detail;
        }

        public DetailNilai LihatNilai() {
            return LihatNilai("NIL-2026-001");
        }
    }

    public static class UiNilai {
        private Nilai controllerNilai;

        public UiNilai(Nilai controllerNilai) {
            this.controllerNilai = controllerNilai;
        }

        public void pilihNilai(String idNilai) {
            System.out.println("\n-----------------------------------------------------------");
            System.out.println("[Ui Nilai] Aktor Guru melakukan aksi: 'Pilih nilai' (ID: " + idNilai + ")");
            System.out.println("[Ui Nilai] -> Memanggil LihatNilai() pada objek Nilai...");
            DetailNilai detail = controllerNilai.LihatNilai(idNilai);
            tampilkanDetailNilai(detail);
        }

        public void tampilkanDetailNilai(DetailNilai detail) {
            System.out.println("[Ui Nilai] <-- TAMPILKAN DETAIL NILAI KEPADA GURU");
            System.out.println("===========================================================");
            System.out.println("  SMA NEGERI 2 PADALARANG - DETAIL HASIL EVALUASI SISWA");
            System.out.println("===========================================================");
            if (detail != null) {
                System.out.println("  NIS / Nama   : " + detail.getNis() + " - " + detail.getNamaSiswa());
                System.out.println("  Kelas/Mapel  : " + detail.getKelas() + " | " + detail.getMataPelajaran());
                System.out.println("  Tugas (30%)  : " + detail.getNilaiTugas());
                System.out.println("  UTS (30%)    : " + detail.getNilaiUts());
                System.out.println("  UAS (40%)    : " + detail.getNilaiUas());
                System.out.println("  Nilai Akhir  : " + String.format("%.2f", detail.getNilaiAkhir()));
                System.out.println("  Predikat     : " + detail.getGrade());
                System.out.println("  Catatan Guru : " + detail.getKeterangan());
            } else {
                System.out.println("  Data nilai tidak ditemukan di sistem!");
            }
            System.out.println("===========================================================\n");
        }
    }

    public static class Guru {
        private String nip, nama;

        public Guru(String nip, String nama) {
            this.nip = nip;
            this.nama = nama;
        }

        public void pilihNilaiPadaUI(UiNilai ui, String idNilai) {
            System.out.println("[Guru] " + nama + " (NIP: " + nip + ") memilih nilai pada sistem.");
            ui.pilihNilai(idNilai);
        }
    }

    public static void main(String[] args) {
        System.out.println("=========================================================");
        System.out.println("  SISTEM INFORMASI AKADEMIK - SMA NEGERI 2 PADALARANG");
        System.out.println("  Simulasi Alur Diagram Sequence: Aktor Guru (Lihat Nilai)");
        System.out.println("=========================================================");

        Database database = new Database();
        Nilai nilaiController = new Nilai(database);
        UiNilai uiNilai = new UiNilai(nilaiController);
        Guru guru = new Guru("198204152008011004", "Drs. Budi Santoso, M.Pd.");
        
        guru.pilihNilaiPadaUI(uiNilai, "NIL-2026-001");
    }
}