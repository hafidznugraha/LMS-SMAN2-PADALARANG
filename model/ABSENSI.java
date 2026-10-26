package model;

import java.util.Date;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: ABSENSI (Entitas Pengelolaan Presensi Siswa)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class ABSENSI {

    // Atribut sesuai Class Diagram (+ public, - private)
    public String id_absensi;
    public String NISN;
    public Date tanggal_pertemuan;
    public String status_kehadiran; // "Hadir", "Sakit", "Izin", "Alfa"
    private String keterangan;
    private String NIP;

    // Default Constructor
    public ABSENSI() {
    }

    // Parameterized Constructor
    public ABSENSI(String id_absensi, String NISN, Date tanggal_pertemuan, String status_kehadiran, String keterangan, String NIP) {
        this.id_absensi = id_absensi;
        this.NISN = NISN;
        this.tanggal_pertemuan = tanggal_pertemuan;
        this.status_kehadiran = status_kehadiran;
        this.keterangan = keterangan;
        this.NIP = NIP;
    }

    // Method + validasiStatusKehadiran()
    public boolean validasiStatusKehadiran() {
        if (this.status_kehadiran == null) return false;
        String s = this.status_kehadiran.trim().toLowerCase();
        boolean valid = s.equals("hadir") || s.equals("sakit") || s.equals("izin") || s.equals("alfa");
        System.out.println("[ABSENSI] Validasi status kehadiran ('" + this.status_kehadiran + "'): " + (valid ? "VALID" : "INVALID"));
        return valid;
    }

    // Method - simpanStatusKehadiran() (private pada diagram)
    private void simpanStatusKehadiran() {
        System.out.println("[ABSENSI] Menyimpan status kehadiran siswa (NISN: " + this.NISN + ") ke basis data.");
    }

    // Helper publik untuk memanggil simpanStatusKehadiran()
    public void eksekusiSimpanStatus() {
        if (validasiStatusKehadiran()) {
            simpanStatusKehadiran();
        }
    }

    // Method + LihatAbsensi()
    public void LihatAbsensi() {
        System.out.println("[ABSENSI] Melihat data absensi [ID: " + this.id_absensi + ", NISN: " + this.NISN + ", Status: " + this.status_kehadiran + "]");
    }

    // Method + UpdateAbsensi()
    public void UpdateAbsensi() {
        System.out.println("[ABSENSI] Memperbarui record absensi ID: " + this.id_absensi + " menjadi status: " + this.status_kehadiran);
    }

    // Method + absenHadir()
    public void absenHadir() {
        this.status_kehadiran = "Hadir";
        this.tanggal_pertemuan = new Date();
        System.out.println("[ABSENSI] Siswa dengan NISN " + this.NISN + " berhasil melakukan absen Hadir.");
    }

    // Getter & Setter
    public String getId_absensi() { return id_absensi; }
    public void setId_absensi(String id_absensi) { this.id_absensi = id_absensi; }

    public String getNISN() { return NISN; }
    public void setNISN(String NISN) { this.NISN = NISN; }

    public Date getTanggal_pertemuan() { return tanggal_pertemuan; }
    public void setTanggal_pertemuan(Date tanggal_pertemuan) { this.tanggal_pertemuan = tanggal_pertemuan; }

    public String getStatus_kehadiran() { return status_kehadiran; }
    public void setStatus_kehadiran(String status_kehadiran) { this.status_kehadiran = status_kehadiran; }

    public String getKeterangan() { return keterangan; }
    public void setKeterangan(String keterangan) { this.keterangan = keterangan; }

    public String getNIP() { return NIP; }
    public void setNIP(String NIP) { this.NIP = NIP; }
}
