package model;

import java.io.File;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: ClassDiagramDemo
 * Demonstrasi implementasi 11 kelas dari Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class ClassDiagramDemo {

    public static void main(String[] args) {
        System.out.println("========================================================================");
        System.out.println("  DEMONSTRASI IMPLEMENTASI LENGKAP CLASS DIAGRAM LMS SMAN 2 PADALARANG  ");
        System.out.println("========================================================================\n");

        // 1. Inisialisasi User & Subclass-nya (Inheritance)
        System.out.println("--- 1. PENGUJIAN HIERARKI USER & ROLE ---");
        USER userUmum = new USER("USR-001", "admin@sman2padalarang.sch.id", "secret123", "Administrator LMS", "Admin");
        userUmum.logIn();
        userUmum.verifikasi();

        GURU guru = new GURU("USR-G01", "guru.fisika@sman2padalarang.sch.id", "guru123", "Budi Santoso, M.Pd.", "198501012010011002", "Fisika");
        System.out.println("Guru extends USER? " + (guru instanceof USER));
        guru.logIn();
        guru.inputMateri();
        guru.inputTugasKuis();
        guru.inputNilai();

        SISWA siswa = new SISWA("USR-S01", "rizky.pratama@sman2padalarang.sch.id", "siswa123", "Muhammad Rizky Pratama", "22231001", "XII MIPA 1", "WK-01");
        System.out.println("Siswa extends USER? " + (siswa instanceof USER));
        siswa.logIn();
        siswa.melihatMateriPembelajaran();
        siswa.melakukanAbsensi();

        WALIKELAS wali = new WALIKELAS("USR-W01", "wali.mipa1@sman2padalarang.sch.id", "wali123", "Dra. Hj. Siti Aminah", "XII MIPA 1");
        System.out.println("Wali Kelas extends USER? " + (wali instanceof USER));
        wali.melihatLaporanAkademik();

        KURIKULUM kurikulum = new KURIKULUM("USR-K01", "kurikulum@sman2padalarang.sch.id", "kur123", "Drs. H. Ahmad Fauzi");
        System.out.println("Kurikulum extends USER? " + (kurikulum instanceof USER));
        kurikulum.tampilkanDaftarSiswa();
        kurikulum.rekapAbsensi();

        // 2. Pengujian MATERI
        System.out.println("\n--- 2. PENGUJIAN KELAS MATERI ---");
        MATERI materi = new MATERI(
                "MAT-01",
                "Hukum Newton tentang Gerak",
                "Pembahasan Hukum I, II, dan III Newton beserta contoh soal",
                new File("modul_hukum_newton.pdf"),
                new Date(),
                guru.getNip()
        );
        materi.InputMateri();
        materi.LihatMateri();
        materi.UnduhMateri();
        System.out.println("Total diunduh: " + materi.getJumlahDiUnduh());

        // 3. Pengujian TUGAS_KUIS
        System.out.println("\n--- 3. PENGUJIAN KELAS TUGAS_KUIS ---");
        TUGAS_KUIS tugas = new TUGAS_KUIS(
                "TGS-01",
                "Latihan Dinamika Partikel",
                "Tugas",
                new Date(System.currentTimeMillis() + 86400000L * 3), // +3 hari
                new Date(),
                "Kerjakan 5 soal perhitungan di lembar kertas bergaris",
                new File("soal_dinamika.pdf"),
                guru.getNip()
        );
        tugas.InputTugasKuis();
        tugas.LihatTugasKuis();
        tugas.DapatDiunduh();

        // 4. Pengujian PENGUMPULAN_TUGAS_KUIS
        System.out.println("\n--- 4. PENGUJIAN KELAS PENGUMPULAN_TUGAS_KUIS ---");
        PENGUMPULAN_TUGAS_KUIS pengumpulan = new PENGUMPULAN_TUGAS_KUIS(
                "SUB-01",
                tugas.getId_tugas_kuis(),
                siswa.getNisn(),
                "Diserahkan",
                new File("jawaban_rizky_fisika.pdf"),
                LocalDateTime.now()
        );
        pengumpulan.DapatDilihat();
        pengumpulan.DapatDiunduh();
        pengumpulan.DapatDiUpdate();

        // 5. Pengujian NILAI
        System.out.println("\n--- 5. PENGUJIAN KELAS NILAI ---");
        NILAI nilai = new NILAI(
                "NIL-01",
                pengumpulan.getId_pengumpulan(),
                siswa.getNisn(),
                92.5f,
                "Pengerjaan sangat rapi dan langkah matematis tepat.",
                guru.getNip()
        );
        nilai.inputNilai();
        nilai.LihatNilai();
        System.out.println("Skor Angka didapat: " + nilai.GetNilai());

        // 6. Pengujian ABSENSI
        System.out.println("\n--- 6. PENGUJIAN KELAS ABSENSI ---");
        ABSENSI absensi = new ABSENSI(
                "ABS-01",
                siswa.getNisn(),
                new Date(),
                "Hadir",
                "Tepat waktu di kelas laboratorium Fisika",
                guru.getNip()
        );
        absensi.validasiStatusKehadiran();
        absensi.eksekusiSimpanStatus();
        absensi.LihatAbsensi();

        // 7. Pengujian LAPORAN_AKADEMIK
        System.out.println("\n--- 7. PENGUJIAN KELAS LAPORAN_AKADEMIK ---");
        LAPORAN_AKADEMIK laporan = new LAPORAN_AKADEMIK(
                "LAP-SMT1-2026",
                "Ganjil 2026/2027",
                guru.getNip()
        );
        laporan.LihatLaporan();

        System.out.println("\n========================================================================");
        System.out.println("  SELURUH 11 KELAS DARI CLASS DIAGRAM BERHASIL DIUJI TANPA ERROR!        ");
        System.out.println("========================================================================");
    }
}
