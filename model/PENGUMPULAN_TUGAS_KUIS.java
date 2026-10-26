package model;

import java.io.File;
import java.time.LocalDateTime;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: PENGUMPULAN_TUGAS_KUIS (Entitas Submisi Tugas dan Kuis Siswa)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class PENGUMPULAN_TUGAS_KUIS {

    // Atribut sesuai Class Diagram (+ public)
    public String id_pengumpulan;
    public String id_tugas_kuis;
    public String NISN;
    public String status; // "Diserahkan", "Terlambat", "Dinilai"
    public File file_tugas;
    public LocalDateTime tanggal_kumpul;

    // Counter analitik
    private int jumlahDilihat = 0;
    private int jumlahDiUnduh = 0;
    private static int totalJumlahPengumpulan = 0;

    // Default Constructor
    public PENGUMPULAN_TUGAS_KUIS() {
        totalJumlahPengumpulan++;
    }

    // Parameterized Constructor
    public PENGUMPULAN_TUGAS_KUIS(String id_pengumpulan, String id_tugas_kuis, String NISN, String status, File file_tugas, LocalDateTime tanggal_kumpul) {
        this.id_pengumpulan = id_pengumpulan;
        this.id_tugas_kuis = id_tugas_kuis;
        this.NISN = NISN;
        this.status = status;
        this.file_tugas = file_tugas;
        this.tanggal_kumpul = tanggal_kumpul;
        totalJumlahPengumpulan++;
    }

    // Constructor overload dengan path String
    public PENGUMPULAN_TUGAS_KUIS(String id_pengumpulan, String id_tugas_kuis, String NISN, String status, String pathFile, LocalDateTime tanggal_kumpul) {
        this(id_pengumpulan, id_tugas_kuis, NISN, status, pathFile != null ? new File(pathFile) : null, tanggal_kumpul);
    }

    // Method + DapatDilihat()
    public boolean DapatDilihat() {
        this.jumlahDilihat++;
        System.out.println("[PENGUMPULAN] Berkas submisi tugas (ID: " + this.id_pengumpulan + ") dapat dilihat oleh guru/siswa.");
        return true;
    }

    // Method + DapatDiunduh()
    public boolean DapatDiunduh() {
        boolean bisa = (this.file_tugas != null);
        if (bisa) {
            this.jumlahDiUnduh++;
            System.out.println("[PENGUMPULAN] Berkas submisi siswa dapat diunduh. Total unduhan: " + this.jumlahDiUnduh);
        }
        return bisa;
    }

    // Method + DapatDiUpdate()
    public boolean DapatDiUpdate() {
        // Dapat diupdate jika status belum dinilai final
        boolean bisa = (this.status == null || !this.status.equalsIgnoreCase("Dinilai"));
        System.out.println("[PENGUMPULAN] Cek apakah submisi dapat diperbarui: " + (bisa ? "BISA" : "TERKUNCI/SUDAH DINILAI"));
        return bisa;
    }

    // Method + DapatDiHapus()
    public boolean DapatDiHapus() {
        boolean bisa = (this.status == null || !this.status.equalsIgnoreCase("Dinilai"));
        System.out.println("[PENGUMPULAN] Cek apakah submisi dapat dibatalkan/dihapus: " + (bisa ? "BISA" : "TIDAK BISA"));
        return bisa;
    }

    // Method + DapatInput()
    public boolean DapatInput() {
        System.out.println("[PENGUMPULAN] Formulir pengumpulan tugas terbuka untuk menerima input berkas.");
        return true;
    }

    // Method + getJumlahDilihat()
    public int getJumlahDilihat() {
        return this.jumlahDilihat;
    }

    // Method + getJumlahDiUnduh()
    public int getJumlahDiUnduh() {
        return this.jumlahDiUnduh;
    }

    // Method + getJumlahPengumpulan()
    public int getJumlahPengumpulan() {
        return totalJumlahPengumpulan;
    }

    // Getter & Setter
    public String getId_pengumpulan() { return id_pengumpulan; }
    public void setId_pengumpulan(String id_pengumpulan) { this.id_pengumpulan = id_pengumpulan; }

    public String getId_tugas_kuis() { return id_tugas_kuis; }
    public void setId_tugas_kuis(String id_tugas_kuis) { this.id_tugas_kuis = id_tugas_kuis; }

    public String getNISN() { return NISN; }
    public void setNISN(String NISN) { this.NISN = NISN; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public File getFile_tugas() { return file_tugas; }
    public void setFile_tugas(File file_tugas) { this.file_tugas = file_tugas; }

    public LocalDateTime getTanggal_kumpul() { return tanggal_kumpul; }
    public void setTanggal_kumpul(LocalDateTime tanggal_kumpul) { this.tanggal_kumpul = tanggal_kumpul; }
}
