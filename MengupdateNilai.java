
import java.util.HashMap;
import java.util.Map;

public class MengupdateNilai {

    // Atribut nilai
    private String idNilai;
    private String nis;
    private String idTugasKuis;
    private double skor;
    private String komentar;

    // Simulasi database nilai
    private static final Map<String, MengupdateNilai>
            databaseNilai = new HashMap<>();

    // Constructor
    public MengupdateNilai(
            String idNilai,
            String nis,
            String idTugasKuis,
            double skor,
            String komentar) {

        this.idNilai = idNilai;
        this.nis = nis;
        this.idTugasKuis = idTugasKuis;
        this.skor = skor;
        this.komentar = komentar;
    }

    // Menyimpan nilai awal
    public void simpanNilai() {

        databaseNilai.put(idNilai, this);

        System.out.println(
                "Database: nilai berhasil disimpan");
    }

    // Guru membuka menu nilai
    public void bukaMenuNilai() {

        System.out.println("Membuka menu Nilai");
    }

    // Mengambil daftar nilai dari database
    public void getDaftarNilai() {

        System.out.println(
                "Mengambil daftar nilai dari database");

        if (databaseNilai.isEmpty()) {
            System.out.println("Nilai belum tersedia");
            return;
        }

        System.out.println("\n=== DAFTAR NILAI ===");

        for (MengupdateNilai nilai : databaseNilai.values()) {

            System.out.println(
                    "ID Nilai: " + nilai.idNilai +
                    " | NIS: " + nilai.nis +
                    " | Skor: " + nilai.skor);
        }
    }

    // Mengambil detail nilai yang dipilih
    public MengupdateNilai getDetailNilai(String idNilai) {

        System.out.println("Mengambil detail nilai");

        MengupdateNilai nilai = databaseNilai.get(idNilai);

        if (nilai == null) {
            System.out.println("Nilai tidak ditemukan");
            return null;
        }

        System.out.println("\n=== DETAIL NILAI ===");
        System.out.println("ID Nilai : " + nilai.idNilai);
        System.out.println("NIS      : " + nilai.nis);
        System.out.println("ID Tugas : " + nilai.idTugasKuis);
        System.out.println("Skor     : " + nilai.skor);
        System.out.println("Komentar : " + nilai.komentar);

        return nilai;
    }

    // Validasi nilai baru
    public boolean validasiNilai(double skorBaru) {

        System.out.println("Memvalidasi nilai baru");

        if (Double.isNaN(skorBaru)
                || Double.isInfinite(skorBaru)
                || skorBaru < 0
                || skorBaru > 100) {

            System.out.println(
                    "Nilai harus berada antara 0 sampai 100");

            return false;
        }

        return true;
    }

    // Memperbarui nilai siswa
    public boolean updateNilai(
            String idNilai,
            double skorBaru,
            String komentarBaru) {

        MengupdateNilai nilai = databaseNilai.get(idNilai);

        // ALT - Data nilai tidak ditemukan
        if (nilai == null) {

            System.out.println("Nilai tidak ditemukan");
            return false;
        }

        // ALT - Nilai baru tidak valid
        if (!validasiNilai(skorBaru)) {

            System.out.println("Pembaruan nilai ditolak");
            return false;
        }

        // ALT - Nilai baru valid
        nilai.skor = skorBaru;
        nilai.komentar = komentarBaru;

        // Menyimpan perubahan ke database
        databaseNilai.put(idNilai, nilai);

        System.out.println(
                "Database: nilai berhasil diperbarui");

        return true;
    }

    // Proses utama Sequence 7
    public void prosesMengupdateNilai(
            String idNilai,
            double skorBaru,
            String komentarBaru) {

        // Guru membuka menu nilai
        bukaMenuNilai();

        // UI meminta daftar nilai
        getDaftarNilai();

        // Guru memilih nilai
        MengupdateNilai nilai = getDetailNilai(idNilai);

        if (nilai == null) {

            System.out.println(
                    "Notifikasi: Pembaruan nilai gagal");

            return;
        }

        // Guru mengubah skor dan komentar
        System.out.println("\nMemproses perubahan nilai");

        boolean berhasil = updateNilai(
                idNilai,
                skorBaru,
                komentarBaru);

        // Menampilkan hasil
        if (berhasil) {

            System.out.println(
                    "Notifikasi: Nilai berhasil diperbarui");

            getDetailNilai(idNilai);

        } else {

            System.out.println(
                    "Notifikasi: Nilai gagal diperbarui");
        }
    }

    // Getter
    public String getIdNilai() {
        return idNilai;
    }

    public String getNis() {
        return nis;
    }

    public String getIdTugasKuis() {
        return idTugasKuis;
    }

    public double getSkor() {
        return skor;
    }

    public String getKomentar() {
        return komentar;
    }
}
