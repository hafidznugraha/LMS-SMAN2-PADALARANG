package model;

import java.io.File;
import java.util.Date;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: TUGAS_KUIS (Entitas Evaluasi Penugasan & Kuis)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class TUGAS_KUIS {

    // Atribut sesuai Class Diagram (+ public)
    public String id_tugas_kuis;
    public String judul;
    public String jenis; // "Tugas" atau "Kuis"
    public Date tenggat_waktu;
    public Date waktu_upload;
    public String deskripsi;
    public File file_pendukung;
    public String nip;

    // Counter unduhan berkas soal
    private int jumlahDiUnduh = 0;

    // Default Constructor
    public TUGAS_KUIS() {
    }

    // Parameterized Constructor
    public TUGAS_KUIS(String id_tugas_kuis, String judul, String jenis, Date tenggat_waktu, Date waktu_upload, String deskripsi, File file_pendukung, String nip) {
        this.id_tugas_kuis = id_tugas_kuis;
        this.judul = judul;
        this.jenis = jenis;
        this.tenggat_waktu = tenggat_waktu;
        this.waktu_upload = waktu_upload;
        this.deskripsi = deskripsi;
        this.file_pendukung = file_pendukung;
        this.nip = nip;
    }

    // Constructor overload dengan path string untuk File
    public TUGAS_KUIS(String id_tugas_kuis, String judul, String jenis, Date tenggat_waktu, Date waktu_upload, String deskripsi, String pathFile, String nip) {
        this(id_tugas_kuis, judul, jenis, tenggat_waktu, waktu_upload, deskripsi, pathFile != null ? new File(pathFile) : null, nip);
    }

    // Method + LihatTugasKuis()
    public void LihatTugasKuis() {
        System.out.println("==================== DETAIL TUGAS / KUIS ====================");
        System.out.println("ID               : " + this.id_tugas_kuis);
        System.out.println("Judul            : " + this.judul);
        System.out.println("Jenis            : " + this.jenis);
        System.out.println("Tenggat Waktu    : " + this.tenggat_waktu);
        System.out.println("Waktu Unggah     : " + this.waktu_upload);
        System.out.println("Deskripsi/Soal   : " + this.deskripsi);
        System.out.println("File Lampiran    : " + (this.file_pendukung != null ? this.file_pendukung.getName() : "-"));
        System.out.println("NIP Guru Pembuat : " + this.nip);
        System.out.println("=============================================================");
    }

    // Method + DapatDiunduh()
    public boolean DapatDiunduh() {
        boolean bisa = (this.file_pendukung != null);
        if (bisa) {
            this.jumlahDiUnduh++;
            System.out.println("[TUGAS_KUIS] Berkas penugasan '" + this.judul + "' dapat diunduh. Total unduhan: " + this.jumlahDiUnduh);
        } else {
            System.out.println("[TUGAS_KUIS] Tidak ada berkas lampiran untuk diunduh.");
        }
        return bisa;
    }

    // Method + UpdateTugasKuis()
    public void UpdateTugasKuis() {
        System.out.println("[TUGAS_KUIS] Tugas/Kuis ID " + this.id_tugas_kuis + " ('" + this.judul + "') berhasil diperbarui.");
    }

    // Method + HapusTugasKuis()
    public void HapusTugasKuis() {
        System.out.println("[TUGAS_KUIS] Tugas/Kuis ID " + this.id_tugas_kuis + " berhasil dihapus dari sistem.");
    }

    // Method + InputTugasKuis()
    public void InputTugasKuis() {
        this.waktu_upload = new Date();
        System.out.println("[TUGAS_KUIS] Tugas/Kuis baru '" + this.judul + "' berhasil ditambahkan ke sistem.");
    }

    // Method + getTugasKuis()
    public TUGAS_KUIS getTugasKuis() {
        return this;
    }

    // Method + getJumlahDiUnduh()
    public int getJumlahDiUnduh() {
        return this.jumlahDiUnduh;
    }

    // Method + FormTambah()
    public void FormTambah() {
        System.out.println("[TUGAS_KUIS] Menampilkan Form Tambah Tugas/Kuis (Judul, Jenis, Deadline, Lampiran).");
    }

    // Method + GETdaftarTugasKuis()
    public void GETdaftarTugasKuis() {
        System.out.println("[TUGAS_KUIS] Mengambil seluruh daftar tugas dan kuis aktif.");
    }

    // Method + getdetailTugasKuis()
    public void getdetailTugasKuis() {
        LihatTugasKuis();
    }

    // Getter & Setter
    public String getId_tugas_kuis() { return id_tugas_kuis; }
    public void setId_tugas_kuis(String id_tugas_kuis) { this.id_tugas_kuis = id_tugas_kuis; }

    public String getJudul() { return judul; }
    public void setJudul(String judul) { this.judul = judul; }

    public String getJenis() { return jenis; }
    public void setJenis(String jenis) { this.jenis = jenis; }

    public Date getTenggat_waktu() { return tenggat_waktu; }
    public void setTenggat_waktu(Date tenggat_waktu) { this.tenggat_waktu = tenggat_waktu; }

    public Date getWaktu_upload() { return waktu_upload; }
    public void setWaktu_upload(Date waktu_upload) { this.waktu_upload = waktu_upload; }

    public String getDeskripsi() { return deskripsi; }
    public void setDeskripsi(String deskripsi) { this.deskripsi = deskripsi; }

    public File getFile_pendukung() { return file_pendukung; }
    public void setFile_pendukung(File file_pendukung) { this.file_pendukung = file_pendukung; }

    public String getNip() { return nip; }
    public void setNip(String nip) { this.nip = nip; }
}
