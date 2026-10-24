
import java.util.HashMap;
import java.util.Map;

public class MelihatTugas {

    // Atribut
    private String idTugasKuis;
    private String judul;
    private String jenis;
    private String deskripsi;
    private String tenggatWaktu;

    // Simulasi database tugas/kuis
    private static final Map<String, MelihatTugas> databaseTugas =
            new HashMap<>();

    // Constructor
    public MelihatTugas(String idTugasKuis, String judul,
                        String jenis, String deskripsi,
                        String tenggatWaktu) {

        this.idTugasKuis = idTugasKuis;
        this.judul = judul;
        this.jenis = jenis;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
    }

    // Menambahkan tugas ke database simulasi
    public void simpanTugas() {
        databaseTugas.put(idTugasKuis, this);
    }

    // Membuka menu tugas
    public void bukaMenuTugas() {
        System.out.println("Membuka menu Tugas");
    }

    // Mengambil daftar tugas dari database
    public void lihatTugas() {

        System.out.println("Mengambil daftar tugas dari database");

        if (databaseTugas.isEmpty()) {
            System.out.println("Tugas belum tersedia");
            return;
        }

        System.out.println("\n=== DAFTAR TUGAS ===");

        for (MelihatTugas tugas : databaseTugas.values()) {
            System.out.println(
                    "ID: " + tugas.idTugasKuis +
                    " | Judul: " + tugas.judul);
        }
    }

    // Memilih tugas dan mengambil detailnya
    public void getDetailTugas(String idTugasKuis) {

        System.out.println("Mengambil detail tugas");

        MelihatTugas tugas = databaseTugas.get(idTugasKuis);

        if (tugas == null) {
            System.out.println("Tugas tidak ditemukan");
            return;
        }

        System.out.println("\n=== DETAIL TUGAS ===");
        System.out.println("ID Tugas       : " + tugas.idTugasKuis);
        System.out.println("Judul          : " + tugas.judul);
        System.out.println("Jenis          : " + tugas.jenis);
        System.out.println("Deskripsi      : " + tugas.deskripsi);
        System.out.println("Tenggat Waktu  : " + tugas.tenggatWaktu);
    }

    // Menjalankan alur Sequence 3
    public void prosesMelihatTugas(String idTugasKuis) {

        bukaMenuTugas();
        lihatTugas();

        if (!databaseTugas.isEmpty()) {
            getDetailTugas(idTugasKuis);
        }
    }
}
