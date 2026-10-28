
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class PengumpulanTugasKuis {

    // Atribut sesuai Class Diagram
    private String idPengumpulan;
    private String idTugasKuis;
    private String nis;
    private String status;
    private String fileTugas;
    private LocalDateTime tanggalKumpul;

    // Simulasi database pengumpulan tugas
    private static final Map<String, PengumpulanTugasKuis>
            databasePengumpulan = new HashMap<>();

    // Simulasi daftar tugas/kuis
    private static final Map<String, String>
            daftarTugasKuis = new HashMap<>();

    // Constructor
    public PengumpulanTugasKuis(
            String idPengumpulan,
            String idTugasKuis,
            String nis,
            String fileTugas) {

        this.idPengumpulan = idPengumpulan;
        this.idTugasKuis = idTugasKuis;
        this.nis = nis;
        this.fileTugas = fileTugas;
        this.status = "Belum Dikumpulkan";
    }

    // Menambahkan data tugas/kuis untuk simulasi
    public static void tambahTugasKuis(
            String idTugasKuis, String judul) {

        daftarTugasKuis.put(idTugasKuis, judul);
    }

    // Membuka form tugas/kuis
    public void bukaFormTugasKuis() {
        System.out.println("Membuka form Tugas/Kuis");
    }

    // Mengambil daftar tugas/kuis
    public void getDaftarTugasKuis() {

        System.out.println("Mengambil daftar tugas/kuis");

        if (daftarTugasKuis.isEmpty()) {
            System.out.println("Tugas/Kuis belum tersedia");
            return;
        }

        for (Map.Entry<String, String> tugas
                : daftarTugasKuis.entrySet()) {

            System.out.println(
                    tugas.getKey() + " - " + tugas.getValue());
        }
    }

    // Memilih dan melihat detail tugas/kuis
    public boolean getDetailTugasKuis() {

        System.out.println("Mengambil detail tugas/kuis");

        String judul = daftarTugasKuis.get(idTugasKuis);

        if (judul == null) {
            System.out.println("Tugas/Kuis tidak ditemukan");
            return false;
        }

        System.out.println("ID Tugas : " + idTugasKuis);
        System.out.println("Judul    : " + judul);

        return true;
    }

    // SEQUENCE 2 - PENGUMPULAN TUGAS/KUIS
    public boolean simpanPengumpulanTugasKuis() {

        bukaFormTugasKuis();
        getDaftarTugasKuis();

        // Memeriksa tugas/kuis yang dipilih
        if (!getDetailTugasKuis()) {
            return false;
        }

        System.out.println("Memproses pengumpulan tugas");

        // Validasi file
        if (fileTugas == null || fileTugas.isBlank()) {
            System.out.println("File tugas tidak boleh kosong");
            return false;
        }

        // Memeriksa apakah sudah dikumpulkan
        if (databasePengumpulan.containsKey(idPengumpulan)) {
            System.out.println(
                    "Data pengumpulan sudah tersedia");
            return false;
        }

        // Menyimpan pengumpulan ke database
        tanggalKumpul = LocalDateTime.now();
        status = "Dikumpulkan";

        databasePengumpulan.put(idPengumpulan, this);

        System.out.println(
                "Pengumpulan berhasil disimpan");

        System.out.println(
                "Notifikasi: Tugas berhasil dikumpulkan");

        return true;
    }

    // Mengambil data pengumpulan
    public PengumpulanTugasKuis getJumlahPengumpulan() {

        return databasePengumpulan.get(idPengumpulan);
    }

    // Getter
    public String getIdPengumpulan() {
        return idPengumpulan;
    }

    public String getIdTugasKuis() {
        return idTugasKuis;
    }

    public String getNis() {
        return nis;
    }

    public String getStatus() {
        return status;
    }

    public String getFileTugas() {
        return fileTugas;
    }

    public LocalDateTime getTanggalKumpul() {
        return tanggalKumpul;
    }
}
