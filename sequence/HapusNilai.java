
import java.util.HashMap;
import java.util.Map;

public class HapusNilai {

    // Atribut nilai
    private String idNilai;
    private String nis;
    private String idTugasKuis;
    private double skor;
    private String komentar;

    // Simulasi database nilai
    private static final Map<String, HapusNilai>
            databaseNilai = new HashMap<>();

    // Constructor
    public HapusNilai(
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

    // Menyimpan data nilai awal
    public void simpanNilai() {
        databaseNilai.put(idNilai, this);
        System.out.println("Nilai berhasil disimpan");
    }

    // Guru membuka menu nilai
    public void bukaMenuNilai() {
        System.out.println("Membuka menu Nilai");
    }

    // Mengambil daftar nilai
    public void getDaftarNilai() {

        System.out.println(
                "Mengambil daftar nilai dari database");

        if (databaseNilai.isEmpty()) {
            System.out.println("Nilai belum tersedia");
            return;
        }

        System.out.println("\n=== DAFTAR NILAI ===");

        for (HapusNilai nilai : databaseNilai.values()) {

            System.out.println(
                    "ID Nilai: " + nilai.idNilai +
                    " | NIS: " + nilai.nis +
                    " | Skor: " + nilai.skor);
        }
    }

    // Mengambil detail nilai yang dipilih
    public HapusNilai getDetailNilai(String idNilai) {

        System.out.println("Mengambil detail nilai");

        HapusNilai nilai = databaseNilai.get(idNilai);

        if (nilai == null) {
            System.out.println("Nilai tidak ditemukan");
            return null;
        }

        System.out.println("\n=== DETAIL NILAI ===");
        System.out.println("ID Nilai    : " + nilai.idNilai);
        System.out.println("NIS         : " + nilai.nis);
        System.out.println("ID Tugas    : " + nilai.idTugasKuis);
        System.out.println("Skor        : " + nilai.skor);
        System.out.println("Komentar    : " + nilai.komentar);

        return nilai;
    }

    // Menghapus nilai dari database
    public boolean hapusNilai(
            String idNilai,
            boolean konfirmasi) {

        // ALT - Penghapusan dibatalkan
        if (!konfirmasi) {

            System.out.println(
                    "Penghapusan nilai dibatalkan");

            return false;
        }

        // Memeriksa nilai
        if (!databaseNilai.containsKey(idNilai)) {

            System.out.println("Nilai tidak ditemukan");

            return false;
        }

        // ALT - Penghapusan dikonfirmasi
        databaseNilai.remove(idNilai);

        System.out.println(
                "Database: nilai berhasil dihapus");

        return true;
    }

    // Proses utama Sequence 6
    public void prosesHapusNilai(
            String idNilai,
            boolean konfirmasi) {

        // Guru membuka menu nilai
        bukaMenuNilai();

        // UI meminta daftar nilai
        getDaftarNilai();

        // Guru memilih nilai
        HapusNilai nilai = getDetailNilai(idNilai);

        if (nilai == null) {
            System.out.println(
                    "Notifikasi: Penghapusan gagal");
            return;
        }

        // Guru menekan tombol hapus
        System.out.println("\nMeminta konfirmasi penghapusan");

        // Memproses penghapusan
        boolean berhasil = hapusNilai(
                idNilai, konfirmasi);

        // Menampilkan hasil
        if (berhasil) {
            System.out.println(
                    "Notifikasi: Nilai berhasil dihapus");
        } else {
            System.out.println(
                    "Notifikasi: Nilai tidak dihapus");
        }
    }

    // Getter
    public String getIdNilai() {
        return idNilai;
    }

    public String getNis() {
        return nis;
    }

    public double getSkor() {
        return skor;
    }

    public String getKomentar() {
        return komentar;
    }
}
