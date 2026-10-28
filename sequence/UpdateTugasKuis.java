import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class UpdateTugasKuis {

    private String idTugasKuis;
    private String nama;
    private String deskripsi;
    private String tenggatWaktu;
    private String fileTugas;

    private static final Map<String, UpdateTugasKuis> databaseTugasKuis = new HashMap<>();

    private static final List<String> FORMAT_FILE_DIIZINKAN = Arrays.asList(".pdf", ".doc", ".docx", ".zip", ".rar");

    public UpdateTugasKuis(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu, String fileTugas) {
        this.idTugasKuis = idTugasKuis;
        this.nama = nama;
        this.deskripsi = deskripsi;
        this.tenggatWaktu = tenggatWaktu;
        this.fileTugas = fileTugas;
    }

    public String getIdTugasKuis() { return idTugasKuis; }
    public String getNama() { return nama; }
    public void setNama(String nama) { this.nama = nama; }
    public String getDeskripsi() { return deskripsi; }
    public void setDeskripsi(String deskripsi) { this.deskripsi = deskripsi; }
    public String getTenggatWaktu() { return tenggatWaktu; }
    public void setTenggatWaktu(String tenggatWaktu) { this.tenggatWaktu = tenggatWaktu; }
    public String getFileTugas() { return fileTugas; }
    public void setFileTugas(String fileTugas) { this.fileTugas = fileTugas; }

    public static void simpanTugasAwal(String idTugasKuis, String nama, String deskripsi, String tenggatWaktu, String fileTugas) {
        databaseTugasKuis.put(idTugasKuis, new UpdateTugasKuis(idTugasKuis, nama, deskripsi, tenggatWaktu, fileTugas));
    }

    public void pilihTugasDanKlikUpdate(String idTugasKuis) {
        System.out.println("\n[Aksi Guru] Guru memilih tugas/kuis dengan ID '" + idTugasKuis + "' dan mengklik tombol Update.");
        requestDetailTugasKuis(idTugasKuis);
    }

    public void requestDetailTugasKuis(String idTugasKuis) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: requestDetailTugasKuis('" + idTugasKuis + "')");
        ambilDetailTugasKuis(idTugasKuis);
    }

    public void ambilDetailTugasKuis(String idTugasKuis) {
        System.out.println("[Sistem] -> [Database]: ambilDetailTugasKuis('" + idTugasKuis + "')");

        UpdateTugasKuis tugas = databaseTugasKuis.get(idTugasKuis);
        if (tugas != null) {
            System.out.println("[Database] <-- [Sistem]: Return data 'Detail tugas / kuis' -> [" + tugas.getNama() + "]");

            formEditTugasKuis(tugas);
        } else {
            System.out.println("[Database] <-- [Sistem]: Data tugas dengan ID '" + idTugasKuis + "' tidak ditemukan.");
        }
    }

    public void formEditTugasKuis(UpdateTugasKuis tugas) {
        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirimkan 'Form edit tugas/kuis'");
        tampilkanFormEditTugasKuis(tugas);
    }

    public void tampilkanFormEditTugasKuis(UpdateTugasKuis tugas) {
        System.out.println("[UI Tugas/Kuis] <-- [Guru]: Menampilkan antarmuka Form Edit Tugas/Kuis");
        System.out.println("----------------------------------------------------------------");
        System.out.println("| ID Tugas    : " + tugas.getIdTugasKuis());
        System.out.println("| Nama Tugas  : " + tugas.getNama());
        System.out.println("| Deskripsi   : " + tugas.getDeskripsi());
        System.out.println("| Tenggat     : " + tugas.getTenggatWaktu());
        System.out.println("| File Lampiran: " + tugas.getFileTugas());
        System.out.println("----------------------------------------------------------------");
    }

    public void editDataDanSubmit(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("\n[Aksi Guru] Mengisi data perubahan: Nama='" + namaBaru + "', Tenggat='" + tenggatBaru + "', File='" + fileBaru + "'");
        updateTugasKuis(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
    }

    public void updateTugasKuis(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("[UI Tugas/Kuis] -> [Sistem]: UpdateTugasKuis()");
        cekTenggatWaktu(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
    }

    public void cekTenggatWaktu(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("[Sistem] -> [Database]: cekTenggatWaktu('" + tenggatBaru + "')");
        System.out.println("[Database] -> [Database]: check() validasi nilai tenggat waktu...");

        boolean isTenggatValid = (tenggatBaru != null && !tenggatBaru.trim().isEmpty() && !tenggatBaru.equalsIgnoreCase("invalid"));

        if (isTenggatValid) {
            System.out.println("[Database] <-- [Sistem]: Return 'Valid'");

            prosesAltTenggatValid(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'Tidak Valid'");

            prosesAltTenggatTidakValid();
        }
    }

    private void prosesAltTenggatValid(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println(">> Masuk BLOK ALT: [TENGGAT WAKTU VALID]");

        System.out.println("[Sistem] -> [Database]: cekFormatFile('" + fileBaru + "')");
        System.out.println("[Database] -> [Database]: check() validasi ekstensi format file...");

        boolean isFormatValid = false;
        if (fileBaru != null) {
            for (String ext : FORMAT_FILE_DIIZINKAN) {
                if (fileBaru.toLowerCase().endsWith(ext)) {
                    isFormatValid = true;
                    break;
                }
            }
        }

        if (isFormatValid) {
            System.out.println("[Database] <-- [Sistem]: Return 'Format Valid'");

            prosesSubAltFormatValid(idTugasKuis, namaBaru, deskripsiBaru, tenggatBaru, fileBaru);
        } else {
            System.out.println("[Database] <-- [Sistem]: Return 'Format Invalid'");

            prosesSubAltFormatTidakValid();
        }
    }

    private void prosesSubAltFormatValid(String idTugasKuis, String namaBaru, String deskripsiBaru, String tenggatBaru, String fileBaru) {
        System.out.println("   >> Masuk BLOK SUB-ALT: [FORMAT FILE VALID]");

        System.out.println("   [Sistem] -> [Database]: Update tugas / kuis (UPDATE tb_tugas_kuis SET ...)");

        UpdateTugasKuis tugas = databaseTugasKuis.get(idTugasKuis);
        if (tugas != null) {
            tugas.setNama(namaBaru);
            tugas.setDeskripsi(deskripsiBaru);
            tugas.setTenggatWaktu(tenggatBaru);
            tugas.setFileTugas(fileBaru);
        }

        System.out.println("   [Database] <-- [Sistem]: Return 'Update success'");

        System.out.println("   [Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Tugas / kuis berhasil diperbarui'");

        System.out.println("   [UI Tugas/Kuis] <-- [Guru]: [SUKSES] Menampilkan pop-up 'Notifikasi berhasil diperbarui'!");
    }

    private void prosesSubAltFormatTidakValid() {
        System.out.println("   >> Masuk BLOK SUB-ALT: [FORMAT FILE TIDAK VALID]");

        System.out.println("   [Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Format file tidak sesuai'");

        System.out.println("   [UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Format file tidak sesuai! (Gunakan .pdf, .docx, atau .zip)'");
    }

    private void prosesAltTenggatTidakValid() {
        System.out.println(">> Masuk BLOK ALT: [TENGGAT WAKTU TIDAK VALID]");

        System.out.println("[Sistem] <-- [UI Tugas/Kuis]: Mengirim pesan 'Batas waktu tidak valid'");

        System.out.println("[UI Tugas/Kuis] <-- [Guru]: [ERROR] Tampilkan pesan error: 'Batas waktu tidak valid / tidak boleh kosong!'");
    }

    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("SIMULASI SEQUENCE 25: GURU MENGUPDATE TUGAS / KUIS");
        System.out.println("========================================================================");

        UpdateTugasKuis.simpanTugasAwal(
                "TGS-001",
                "Tugas Matematika Wajib Bab 3",
                "Kerjakan soal latihan 3.1 halaman 45 nomor 1-10",
                "2026-11-01 23:59",
                "soal_latihan_bab3.pdf"
        );

        UpdateTugasKuis app = new UpdateTugasKuis("TGS-001", "", "", "", "");

        System.out.println("\n>>> [UJI COBA 1: SUKSES (TENGGAT VALID & FILE VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Wajib Bab 3 (Revisi)",
                "Kerjakan soal nomor 1-5 saja di buku tugas",
                "2026-11-05 23:59",
                "revisi_soal_bab3.pdf"
        );

        System.out.println("\n>>> [UJI COBA 2: GAGAL (FORMAT FILE TIDAK VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Bab 3",
                "Kerjakan nomor 1-5",
                "2026-11-05 23:59",
                "script_jawaban.exe"
        );

        System.out.println("\n>>> [UJI COBA 3: GAGAL (TENGGAT WAKTU TIDAK VALID)] <<<");
        app.pilihTugasDanKlikUpdate("TGS-001");
        app.editDataDanSubmit(
                "TGS-001",
                "Tugas Matematika Bab 3",
                "Kerjakan nomor 1-5",
                "",
                "dokumen_tugas.pdf"
        );

        System.out.println("\n========================================================================");
        System.out.println("SIMULASI SEQUENCE 25 SELESAI DENGAN SUKSES");
        System.out.println("========================================================================");
    }
}
