
import java.util.HashMap;
import java.util.Map;

public class User {

    // Atribut sesuai Class Diagram
    private String idUser;
    private String email;
    private String password;
    private String namaLengkap;
    private String role;
    private boolean aktif;

    // Simulasi penyimpanan data pengguna
    private static final Map<String, User> databaseUser =
            new HashMap<>();

    // Constructor
    public User(String idUser, String email,
                String password, String namaLengkap,
                String role, boolean aktif) {

        this.idUser = idUser;
        this.email = email;
        this.password = password;
        this.namaLengkap = namaLengkap;
        this.role = role;
        this.aktif = aktif;

        databaseUser.put(email, this);
    }

    // SEQUENCE 1 - LOGIN
    public static boolean logIn(String email,
                                String password) {

        System.out.println("Menampilkan form login");
        System.out.println("Menerima email dan password");

        // Query data user ke database
        User user = databaseUser.get(email);

        if (user == null) {
            System.out.println("Akun tidak ditemukan");
            return false;
        }

        // Verifikasi kredensial
        if (!user.verifikasi(password)) {
            System.out.println("Email atau password salah");
            return false;
        }

        // ALT - Login tidak aktif
        if (!user.aktif) {
            System.out.println("Akun tidak aktif");
            return false;
        }

        // ALT - Login berhasil
        System.out.println("Login berhasil");
        System.out.println("Selamat datang, "
                + user.namaLengkap);
        System.out.println("Menampilkan dashboard "
                + user.role);

        return true;
    }

    // Verifikasi password
    public boolean verifikasi(String inputPassword) {
        return password.equals(inputPassword);
    }

    // Logout
    public void logOut() {
        System.out.println("Logout berhasil");
        System.out.println("Kembali ke halaman login");
    }
}
