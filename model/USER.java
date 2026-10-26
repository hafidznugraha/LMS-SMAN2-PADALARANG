package model;

import java.util.HashMap;
import java.util.Map;

/**
 * ============================================================================
 * PROYEK LMS SMA NEGERI 2 PADALARANG
 * CLASS: USER (Superclass Entitas Pengguna Sistem)
 * Berdasarkan Class Diagram SDD Halaman 50
 * ============================================================================
 */
public class USER {

    // Atribut sesuai Class Diagram (+ public, # protected, - private)
    public String ID_user;
    protected String email;
    private String password;
    public String nama_lengkap;
    public String role;

    // Database simulasi pengguna
    protected static final Map<String, USER> databaseUser = new HashMap<>();

    // Default Constructor
    public USER() {
    }

    // Parameterized Constructor
    public USER(String ID_user, String email, String password, String nama_lengkap, String role) {
        this.ID_user = ID_user;
        this.email = email;
        this.password = password;
        this.nama_lengkap = nama_lengkap;
        this.role = role;
        databaseUser.put(email, this);
    }

    // Method + logIn()
    public boolean logIn() {
        System.out.println("[USER] Memproses logIn untuk: " + this.email + " (Role: " + this.role + ")");
        return true;
    }

    // Method overload logIn dengan email & password
    public static boolean logIn(String email, String password) {
        System.out.println("[USER] Memproses logIn untuk email: " + email);
        USER user = databaseUser.get(email);
        if (user != null && user.verifikasi(password)) {
            System.out.println("[USER] Login berhasil! Selamat datang, " + user.nama_lengkap);
            return true;
        }
        System.out.println("[USER] Login gagal: Email atau password salah.");
        return false;
    }

    // Method + verifikasi()
    public boolean verifikasi() {
        System.out.println("[USER] Verifikasi status kredensial user: " + this.nama_lengkap);
        return this.password != null && !this.password.isEmpty();
    }

    // Method overload verifikasi dengan password
    public boolean verifikasi(String passwordInput) {
        return this.password != null && this.password.equals(passwordInput);
    }

    // Method + logOut
    public void logOut() {
        System.out.println("[USER] Pengguna " + this.nama_lengkap + " (" + this.role + ") telah berhasil logOut.");
    }

    // Getter & Setter
    public String getID_user() { return ID_user; }
    public void setID_user(String ID_user) { this.ID_user = ID_user; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNama_lengkap() { return nama_lengkap; }
    public void setNama_lengkap(String nama_lengkap) { this.nama_lengkap = nama_lengkap; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
