
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class MenghapusTugas {

    // Atribut tugas
    private String idTugasKuis;
    private String judul;
    private String deskripsi;
    private LocalDateTime tenggatWaktu;

    // Simulasi database tugas
    private static final Map<String, MenghapusTugas>
            databaseTugas = new HashMap<>();

    // Constructor
    public MenghapusTugas(
            String idTugasKuis,
            String judul,
            String deskripsi,
            LocalDateTime tenggatWaktu) {

        this.idTugasKuis = idTugasKuis;
        this.judul = judul;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
    }

    // Menyimpan tugas ke database simulasi
    public void simpanTugas() {
        databaseTugas.put(idTugasKuis, this);
    }

    // Membuka menu tugas
    public void bukaMenuTugas() {
        System.out.println("Membuka menu Tugas");
    }

    // Mengambil daftar tugas dari database
    public void getDaftarTugas() {

        System.out.println(
                "Mengambil daftar tugas dari database");

        if (databaseTugas.isEmpty()) {
            System.out.println("Tugas belum tersedia");
            return;
        }

        System.out.println("\n=== DAFTAR TUGAS ===");

        for (MenghapusTugas tugas : databaseTugas.values()) {

            System.out.println(
                    "ID: " + tugas.idTugasKuis +
                    " | Judul: " + tugas.judul);
        }
    }

    // Mengambil detail tugas
    public MenghapusTugas getDetailTugas(String id) {

        System.out.println("Mencari tugas: " + id);

        MenghapusTugas tugas = databaseTugas.get(id);

        if (tugas == null) {
            System.out.println("Tugas tidak ditemukan");
        }

        return tugas;
    }

    // Menghapus tugas dari database
    public boolean hapusTugas(String id) {

        MenghapusTugas tugas = databaseTugas.get(id);

        if (tugas == null) {
            System.out.println("Tugas tidak ditemukan");
            return false;
        }

        // ALT - Tenggat waktu sudah lewat
        if (LocalDateTime.now().isAfter(tugas.tenggatWaktu)) {

            System.out.println(
                    "Tugas tidak dapat dihapus karena " +
                    "tenggat waktu sudah lewat");

            return false;
        }

        // ALT - Tenggat waktu belum lewat
        databaseTugas.remove(id);

        System.out.println(
                "Database: tugas berhasil dihapus");

        return true;
    }

    // Proses utama Sequence 4
    public void prosesMenghapusTugas(String id) {

        // Siswa membuka menu tugas
        bukaMenuTugas();

        // UI meminta daftar tugas
        getDaftarTugas();

        // Siswa memilih tugas yang akan dihapus
        MenghapusTugas tugas = getDetailTugas(id);

        if (tugas == null) {
            return;
        }

        // Menampilkan tugas terpilih
        System.out.println("\n=== DETAIL TUGAS ===");
        System.out.println("ID Tugas : " + tugas.idTugasKuis);
        System.out.println("Judul    : " + tugas.judul);
        System.out.println("Deskripsi: " + tugas.deskripsi);
        System.out.println("Deadline : " + tugas.tenggatWaktu);

        // Memproses penghapusan
        System.out.println("\nMemproses penghapusan tugas");

        boolean berhasil = hapusTugas(id);

        if (berhasil) {
            System.out.println(
                    "Notifikasi: Tugas berhasil dihapus");
        } else {
            System.out.println(
                    "Notifikasi: Penghapusan tugas gagal");
        }
    }
}
