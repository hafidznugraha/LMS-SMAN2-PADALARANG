
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class MengupdateTugas {

    // Atribut tugas
    private String idTugasKuis;
    private String judul;
    private String deskripsi;
    private LocalDateTime tenggatWaktu;
    private String fileTugas;

    // Simulasi database tugas
    private static final Map<String, MengupdateTugas>
            databaseTugas = new HashMap<>();

    // Constructor
    public MengupdateTugas(
            String idTugasKuis,
            String judul,
            String deskripsi,
            LocalDateTime tenggatWaktu,
            String fileTugas) {

        this.idTugasKuis = idTugasKuis;
        this.judul = judul;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
        this.fileTugas = fileTugas;
    }

    // Menyimpan data awal ke database simulasi
    public void simpanTugas() {
        databaseTugas.put(idTugasKuis, this);
        System.out.println("Data tugas berhasil disimpan");
    }

    // Siswa membuka menu tugas
    public void bukaMenuTugas() {
        System.out.println("Membuka menu Tugas");
    }

    // UI meminta daftar tugas
    public void getDaftarTugas() {

        System.out.println("Mengambil daftar tugas dari database");

        if (databaseTugas.isEmpty()) {
            System.out.println("Tugas belum tersedia");
            return;
        }

        System.out.println("\n=== DAFTAR TUGAS ===");

        for (MengupdateTugas tugas : databaseTugas.values()) {
            System.out.println(
                    "ID: " + tugas.idTugasKuis +
                    " | Judul: " + tugas.judul);
        }
    }

    // Mengambil tugas yang akan diperbarui
    public MengupdateTugas getDetailTugas(String id) {

        MengupdateTugas tugas = databaseTugas.get(id);

        if (tugas == null) {
            System.out.println("Tugas tidak ditemukan");
            return null;
        }

        System.out.println("\n=== DETAIL TUGAS ===");
        System.out.println("ID       : " + tugas.idTugasKuis);
        System.out.println("Judul    : " + tugas.judul);
        System.out.println("Deskripsi: " + tugas.deskripsi);
        System.out.println("Deadline : " + tugas.tenggatWaktu);
        System.out.println("File     : " + tugas.fileTugas);

        return tugas;
    }

    // Memeriksa tenggat waktu
    public boolean cekTenggatWaktu() {

        System.out.println("Memeriksa tenggat waktu tugas");

        if (LocalDateTime.now().isAfter(tenggatWaktu)) {
            System.out.println("Tenggat waktu sudah lewat");
            return false;
        }

        System.out.println("Tenggat waktu masih berlaku");
        return true;
    }

    // Memperbarui file tugas
    public boolean updateTugas(String fileBaru) {

        if (!cekTenggatWaktu()) {
            System.out.println(
                    "Update ditolak karena tenggat waktu sudah lewat");
            return false;
        }

        if (fileBaru == null || fileBaru.isBlank()) {
            System.out.println("File baru tidak boleh kosong");
            return false;
        }

        // Memperbarui file tugas
        this.fileTugas = fileBaru;

        // Menyimpan perubahan ke database
        databaseTugas.put(idTugasKuis, this);

        System.out.println("Database: file tugas diperbarui");
        System.out.println("Update berhasil");

        return true;
    }

    // Proses utama Sequence 5
    public void prosesMengupdateTugas(
            String idTugas,
            String fileBaru) {

        // Siswa membuka menu
        bukaMenuTugas();

        // Mengambil daftar tugas
        getDaftarTugas();

        // Siswa memilih tugas
        MengupdateTugas tugas = getDetailTugas(idTugas);

        if (tugas == null) {
            return;
        }

        // Siswa menekan tombol update
        System.out.println("\nMengirim file tugas baru");

        boolean berhasil = tugas.updateTugas(fileBaru);

        // ALT - Hasil update
        if (berhasil) {
            System.out.println(
                    "Notifikasi: Tugas berhasil diperbarui");
        } else {
            System.out.println(
                    "Notifikasi: Tugas gagal diperbarui");
        }
    }

    // Getter
    public String getIdTugasKuis() {
        return idTugasKuis;
    }

    public String getFileTugas() {
        return fileTugas;
    }

    public LocalDateTime getTenggatWaktu() {
        return tenggatWaktu;
    }
}
