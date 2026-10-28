import java.util.HashMap;
import java.util.Map;

public class HapusTugasKuis {

    private String idTugasKuis;
    private String nama;
    private String deskripsi;
    private String tenggatWaktu;

    private static final Map<String, HapusTugasKuis> databaseTugasKuis = new HashMap<>();

    public HapusTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        this.idTugasKuis = idTugasKuis;
        this.nama = nama;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
    }

    public String getIdTugasKuis() { return idTugasKuis; }
    public String getNama() { return nama; }
    public String getDeskripsi() { return deskripsi; }
    public String getTenggatWaktu() { return tenggatWaktu; }

    public static void simpanTugasAwal(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu) {
        databaseTugasKuis.put(idTugasKuis, new HapusTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu));
    }

    public void membukaMenuTugasDanKuis() {
        System.out.println("\n[Aksi Guru] Guru membuka menu Tugas dan Kuis.");
        requestDaftarTugasKuis();
    }

    public void requestDaftarTugasKuis() {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: requestDaftarTugasKuis()");
        queryDaftarTugasDanKuis();
    }

    public void queryDaftarTugasDanKuis() {
        System.out.println("[Sistem] -> [Database]: 'Query daftar tugas dan kuis' (SELECT * FROM tb_tugas_kuis)");
        System.out.println("[Database] <-- [Sistem]: Mengembalikan return 'Daftar tugas dan kuis' (" + databaseTugasKuis.size() + " data)");
        tampilkanDaftar();
    }

    public void tampilkanDaftar() {
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan 'Tampilkan daftar'");
        System.out.println("\n====================== DAFTAR TUGAS DAN KUIS ======================");
        if (databaseTugasKuis.isEmpty()) {
            System.out.println("| (Daftar tugas dan kuis kosong / tidak ada data)                |");
        } else {
            for (HapusTugasKuis tk : databaseTugasKuis.values()) {
                System.out.println("| ID: " + tk.getIdTugasKuis() + " | Nama: " + tk.getNama() + " | Tenggat: " + tk.getTenggatWaktu());
            }
        }
        System.out.println("===================================================================");
    }

    public void pilihTugasDanKlikHapus(String idTugasKuis) {
        System.out.println("\n[Aksi Guru] Guru memilih tugas dengan ID '" + idTugasKuis + "' dan mengklik tombol Hapus.");
        hapusTugasKuis(idTugasKuis);
    }

    public void hapusTugasKuis(String idTugasKuis) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: HapusTugasKuis('" + idTugasKuis + "')");
        cekTugasKuisByID(idTugasKuis);
    }

    public void cekTugasKuisByID(String idTugasKuis) {
        System.out.println("[Sistem] -> [Database]: cekTugasKuisByID('" + idTugasKuis + "')");

        HapusTugasKuis data = databaseTugasKuis.get(idTugasKuis);

        if (data != null) {
            System.out.println("[Database] <-- [Sistem]: Return 'Data ditemukan'");

            prosesAltDataDitemukan(idTugasKuis);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'null'");

            prosesAltDataTidakDitemukan();
        }
    }

    private void prosesAltDataDitemukan(String idTugasKuis) {
        System.out.println(">> Masuk BLOK ALT: [DATA DITEMUKAN]");

        System.out.println("[Sistem] -> [Database]: 'Delete tugas / kuis' (DELETE FROM tb_tugas_kuis WHERE id='" + idTugasKuis + "')");
        databaseTugasKuis.remove(idTugasKuis);

        System.out.println("[Database] <-- [Sistem]: Return 'Success'");

        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan pesan 'Tugas / kuis berhasil dihapus'");

        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [SUKSES] Menampilkan notifikasi 'Tugas / kuis berhasil dihapus!'");
    }

    private void prosesAltDataTidakDitemukan() {
        System.out.println(">> Masuk BLOK ALT: [DATA TIDAK TEMUKAN]");

        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan pesan 'Data tidak ditemukan'");

        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Data tugas / kuis tidak ditemukan!'");
    }

    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 27: GURU MENGHAPUS TUGAS / KUIS");
        System.out.println("========================================================================");

        HapusTugasKuis.simpanTugasAwal("TGS-101", "Tugas Kimia Larutan Asam Basa", "Kerjakan soal 1-10", "2026-11-01");
        HapusTugasKuis.simpanTugasAwal("TGS-102", "Kuis Sejarah Perang Dunia 2", "Pilihan ganda 15 soal", "2026-11-03");

        HapusTugasKuis app = new HapusTugasKuis("", "", "", "");

        app.membukaMenuTugasDanKuis();

        System.out.println("\n>>> [UJI COBA 1: DATA DITEMUKAN -> BERHASIL DIHAPUS] <<<");
        app.pilihTugasDanKlikHapus("TGS-101");

        app.tampilkanDaftar();

        System.out.println("\n>>> [UJI COBA 2: DATA TIDAK DITEMUKAN -> PESAN ERROR] <<<");
        app.pilihTugasDanKlikHapus("TGS-999-SALAH");

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 27 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
