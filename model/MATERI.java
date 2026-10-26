package model;

import java.io.File;
import java.util.Date;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: MATERI (Entitas Bahan Ajar Pembelajaran)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class MATERI {

    // Atribut sesuai Class Diagram (+ public)
    public String id_materi;
    public String judul;
    public String deskripsi;
    public File file_materi;
    public Date tanggal_unggah;
    public String nip;

    // Counter download untuk getJumlahDiUnduh()
    private int jumlahDiUnduh = 0;

    // Default Constructor
    public MATERI() {
    }

    // Parameterized Constructor
    public MATERI(String id_materi, String judul, String deskripsi, File file_materi, Date tanggal_unggah, String nip) {
        this.id_materi = id_materi;
        this.judul = judul;
        this.deskripsi = deskripsi;
        this.file_materi = file_materi;
        this.tanggal_unggah = tanggal_unggah;
        this.nip = nip;
    }

    // Constructor overload dengan path string untuk File
    public MATERI(String id_materi, String judul, String deskripsi, String pathFile, Date tanggal_unggah, String nip) {
        this(id_materi, judul, deskripsi, pathFile != null ? new File(pathFile) : null, tanggal_unggah, nip);
    }

    // Method + LihatMateri()
    public void LihatMateri() {
        System.out.println("==================== DETAIL MATERI BELAJAR ====================");
        System.out.println("ID Materi      : " + this.id_materi);
        System.out.println("Judul          : " + this.judul);
        System.out.println("Deskripsi      : " + this.deskripsi);
        System.out.println("File Berkas    : " + (this.file_materi != null ? this.file_materi.getName() : "-"));
        System.out.println("Tanggal Unggah : " + this.tanggal_unggah);
        System.out.println("NIP Pengunggah : " + this.nip);
        System.out.println("===============================================================");
    }

    // Method + UnduhMateri()
    public File UnduhMateri() {
        this.jumlahDiUnduh++;
        System.out.println("[MATERI] File materi '" + this.judul + "' berhasil diunduh. Total unduhan: " + this.jumlahDiUnduh);
        return this.file_materi;
    }

    // Method + UpdateMateri()
    public void UpdateMateri() {
        System.out.println("[MATERI] Materi ID " + this.id_materi + " ('" + this.judul + "') berhasil diperbarui oleh guru NIP: " + this.nip);
    }

    // Method + HapusMateri()
    public void HapusMateri() {
        System.out.println("[MATERI] Materi ID " + this.id_materi + " telah dihapus dari sistem.");
    }

    // Method + InputMateri()
    public void InputMateri() {
        this.tanggal_unggah = new Date();
        System.out.println("[MATERI] Materi baru '" + this.judul + "' berhasil diinput ke dalam sistem LMS.");
    }

    // Method + getMateri()
    public MATERI getMateri() {
        return this;
    }

    // Method + getJumlahDiUnduh()
    public int getJumlahDiUnduh() {
        return this.jumlahDiUnduh;
    }

    // Method + formTambahMateri()
    public void formTambahMateri() {
        System.out.println("[MATERI] Menampilkan form input materi baru (Judul, Deskripsi, Upload File).");
    }

    // Getter & Setter
    public String getId_materi() { return id_materi; }
    public void setId_materi(String id_materi) { this.id_materi = id_materi; }

    public String getJudul() { return judul; }
    public void setJudul(String judul) { this.judul = judul; }

    public String getDeskripsi() { return deskripsi; }
    public void setDeskripsi(String deskripsi) { this.deskripsi = deskripsi; }

    public File getFile_materi() { return file_materi; }
    public void setFile_materi(File file_materi) { this.file_materi = file_materi; }

    public Date getTanggal_unggah() { return tanggal_unggah; }
    public void setTanggal_unggah(Date tanggal_unggah) { this.tanggal_unggah = tanggal_unggah; }

    public String getNip() { return nip; }
    public void setNip(String nip) { this.nip = nip; }
}
