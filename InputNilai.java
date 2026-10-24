
import java.util.HashMap;
import java.util.Map;

public class InputNilai {

    // Atribut nilai
    private String idNilai;
    private String nis;
    private String idTugasKuis;
    private double skor;
    private String komentar;

    // Simulasi database nilai
    private static final Map<String, InputNilai>
            databaseNilai = new HashMap<>();

    // Simulasi data pengumpulan tugas siswa
    private static final Map<String, String>
            databasePengumpulan = new HashMap<>();

    // Constructor
    public InputNilai(
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

    // Menambahkan contoh data pengumpulan tugas
    public static void tambahPengumpulan(
            String nis,
            String idTugasKuis) {

        databasePengumpulan.put(
                nis + "_" + idTugasKuis,
                "Dikumpulkan");
    }

    // Guru membuka menu nilai
    public void bukaMenuNilai() {

        System.out.println("Membuka menu Nilai");
    }

    // Mengambil daftar pengumpulan tugas
    public void getDaftarPengumpulan() {

        System.out.println(
                "Mengambil data pengumpulan tugas dari database");

        if (databasePengumpulan.isEmpty()) {

            System.out.println(
                    "Belum ada tugas yang dikumpulkan");

            return;
        }

        System.out.println("\n=== DAFTAR PENGUMPULAN ===");

        for (Map.Entry<String, String> data
                : databasePengumpulan.entrySet()) {

            System.out.println(
                    "Data: " + data.getKey() +
                    " | Status: " + data.getValue());
        }
    }

    // Memeriksa apakah siswa sudah mengumpulkan tugas
    public boolean cekPengumpulan() {

        String key = nis + "_" + idTugasKuis;

        if (!databasePengumpulan.containsKey(key)) {

            System.out.println(
                    "Siswa belum mengumpulkan tugas");

            return false;
        }

        System.out.println(
                "Data pengumpulan tugas ditemukan");

        return true;
    }

    // Validasi skor
    public boolean validasiNilai() {

        System.out.println("Memvalidasi nilai siswa");

        if (Double.isNaN(skor)
                || Double.isInfinite(skor)
                || skor < 0
                || skor > 100) {

            System.out.println(
                    "Nilai tidak valid. Skor harus 0 sampai 100");

            return false;
        }

        return true;
    }

    // Menyimpan nilai ke database
    public boolean simpanNilai() {

        // ALT - Tugas belum dikumpulkan
        if (!cekPengumpulan()) {

            System.out.println(
                    "Input nilai ditolak");

            return false;
        }

        // ALT - Nilai tidak valid
        if (!validasiNilai()) {

            System.out.println(
                    "Input nilai gagal");

            return false;
        }

        // Memeriksa nilai duplikat
        if (databaseNilai.containsKey(idNilai)) {

            System.out.println(
                    "ID nilai sudah terdaftar");

            return false;
        }

        // ALT - Nilai valid
        databaseNilai.put(idNilai, this);

        System.out.println(
                "Database: nilai berhasil disimpan");

        return true;
    }

    // Proses utama Sequence 8
    public void prosesInputNilai() {

        // Guru membuka menu nilai
        bukaMenuNilai();

        // UI mengambil data pengumpulan tugas
        getDaftarPengumpulan();

        // Guru memilih siswa dan tugas
        System.out.println("\n=== INPUT NILAI ===");

        System.out.println("NIS      : " + nis);
        System.out.println("ID Tugas : " + idTugasKuis);

        // Guru memasukkan skor dan komentar
        System.out.println("Skor     : " + skor);
        System.out.println("Komentar : " + komentar);

        // Sistem menyimpan nilai
        boolean berhasil = simpanNilai();

        // Menampilkan hasil
        if (berhasil) {

            System.out.println(
                    "Notifikasi: Nilai berhasil ditambahkan");

        } else {

            System.out.println(
                    "Notifikasi: Nilai gagal ditambahkan");
        }
    }

    // Mengambil detail nilai
    public InputNilai getDetailNilai(String idNilai) {

        return databaseNilai.get(idNilai);
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
