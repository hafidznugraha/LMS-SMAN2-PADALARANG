package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

func TestNotifikasiMateriKelasTarget(t *testing.T) {
	_ = godotenv.Load("../../.env")
	cfg := config.LoadConfig()
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "test-secret-key-12345"
	}

	db, _ := repository.InitDB(cfg)
	if db == nil {
		t.Skip("Database tidak tersedia, lewati tes integrasi notifikasi")
	}

	app := SetupRouter(cfg)

	// 1. Setup Kelas A & Kelas B
	kelasA := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Kelas Test Notif A",
		Tingkat:   10,
		Jurusan:   "RPL",
	}
	db.Create(&kelasA)
	defer db.Delete(&kelasA)

	kelasB := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Kelas Test Notif B",
		Tingkat:   10,
		Jurusan:   "TKJ",
	}
	db.Create(&kelasB)
	defer db.Delete(&kelasB)

	// 2. Setup Guru
	userGuru := model.User{
		ID:           uuid.New(),
		Username:     "guru_notif_test_" + uuid.New().String()[:8],
		Email:        "guru_notif_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Ibu Guru Notifikasi",
		Role:         model.RoleGuru,
		PasswordHash: "dummy",
	}
	db.Create(&userGuru)
	defer db.Delete(&userGuru)

	mapel := model.MataPelajaran{
		ID:        uuid.New(),
		KodeMapel: "TEST-NOTIF",
		NamaMapel: "Pemrograman Web Lanjut",
	}
	db.Create(&mapel)
	defer db.Delete(&mapel)

	guru := model.Guru{
		ID:      uuid.New(),
		UserID:  userGuru.ID,
		NIP:     fmt.Sprintf("1980%014d", time.Now().UnixNano()%100000000000000),
		MapelID: &mapel.ID,
		Gelar:   "M.Kom.",
	}
	db.Create(&guru)
	defer db.Delete(&guru)

	// Jadwal pelajaran untuk kelas A agar guru berhak mengajar
	jadwalA := model.JadwalPelajaran{
		ID:         uuid.New(),
		KelasID:    kelasA.ID,
		GuruID:     guru.ID,
		MapelID:    mapel.ID,
		Hari:       "Senin",
		JamMulai:   "08:00",
		JamSelesai: "10:00",
	}
	db.Create(&jadwalA)
	defer db.Delete(&jadwalA)

	// 3. Setup Siswa A (di Kelas A) & Siswa B (di Kelas B)
	userSiswaA := model.User{
		ID:           uuid.New(),
		Username:     "siswa_a_" + uuid.New().String()[:8],
		Email:        "siswa_a_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Siswa Kelas A",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswaA)
	defer db.Delete(&userSiswaA)

	siswaA := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswaA.ID,
		NIS:          fmt.Sprintf("11%06d", time.Now().UnixNano()%1000000),
		NISN:         fmt.Sprintf("0011%06d", time.Now().UnixNano()%1000000),
		KelasID:      &kelasA.ID,
		JenisKelamin: "Laki-laki",
	}
	db.Create(&siswaA)
	defer db.Delete(&siswaA)

	userSiswaB := model.User{
		ID:           uuid.New(),
		Username:     "siswa_b_" + uuid.New().String()[:8],
		Email:        "siswa_b_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Siswa Kelas B",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswaB)
	defer db.Delete(&userSiswaB)

	siswaB := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswaB.ID,
		NIS:          fmt.Sprintf("22%06d", (time.Now().UnixNano()+1)%1000000),
		NISN:         fmt.Sprintf("0022%06d", (time.Now().UnixNano()+1)%1000000),
		KelasID:      &kelasB.ID,
		JenisKelamin: "Perempuan",
	}
	db.Create(&siswaB)
	defer db.Delete(&siswaB)

	// Buat token autentikasi guru, siswa A, dan siswa B
	createToken := func(userID uuid.UUID, role model.UserRole, username string) string {
		claims := jwt.MapClaims{
			"user_id":  userID.String(),
			"role":     string(role),
			"username": username,
			"exp":      time.Now().Add(1 * time.Hour).Unix(),
		}
		tok := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		s, _ := tok.SignedString([]byte(cfg.JWTSecret))
		return s
	}

	tokenGuru := createToken(userGuru.ID, model.RoleGuru, userGuru.Username)
	tokenSiswaA := createToken(userSiswaA.ID, model.RoleSiswa, userSiswaA.Username)
	tokenSiswaB := createToken(userSiswaB.ID, model.RoleSiswa, userSiswaB.Username)

	// 4. Guru upload materi baru untuk Kelas A
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	_ = writer.WriteField("judul", "Materi Algoritma Pemrograman Kelas A")
	_ = writer.WriteField("deskripsi", "Pelajari bab 1 dan latihan di akhir modul")
	_ = writer.WriteField("kelas_id", kelasA.ID.String())
	_ = writer.WriteField("guru_id", guru.ID.String())
	_ = writer.WriteField("mapel_id", mapel.ID.String())
	_ = writer.WriteField("tipe_file", "PDF")
	_ = writer.Close()

	reqUpload := httptest.NewRequest(http.MethodPost, "/api/v1/guru/materi", body)
	reqUpload.Header.Set("Authorization", "Bearer "+tokenGuru)
	reqUpload.Header.Set("Content-Type", writer.FormDataContentType())

	respUpload, err := app.Test(reqUpload, 5000)
	if err != nil {
		t.Fatalf("Gagal eksekusi request upload materi: %v", err)
	}
	if respUpload.StatusCode != http.StatusCreated {
		t.Fatalf("Status code upload materi diharapkan 201, didapat: %d", respUpload.StatusCode)
	}

	defer func() {
		// Bersihkan materi dan notifikasi yang terbuat
		db.Where("judul = ?", "Materi Algoritma Pemrograman Kelas A").Delete(&model.Materi{})
		db.Where("user_id = ? OR user_id = ?", userSiswaA.ID, userSiswaB.ID).Delete(&model.Notifikasi{})
	}()

	// 5. Verifikasi: Siswa A (Kelas A) HARUS menerima notifikasi
	reqNotifA := httptest.NewRequest(http.MethodGet, "/api/v1/notifikasi", nil)
	reqNotifA.Header.Set("Authorization", "Bearer "+tokenSiswaA)
	respNotifA, err := app.Test(reqNotifA, 5000)
	if err != nil {
		t.Fatalf("Gagal ambil notifikasi Siswa A: %v", err)
	}
	if respNotifA.StatusCode != http.StatusOK {
		t.Fatalf("Status code notifikasi Siswa A diharapkan 200, didapat: %d", respNotifA.StatusCode)
	}

	var jsonNotifA struct {
		Success bool `json:"success"`
		Data    struct {
			Items       []model.Notifikasi `json:"items"`
			UnreadCount int64              `json:"unread_count"`
		} `json:"data"`
	}
	_ = json.NewDecoder(respNotifA.Body).Decode(&jsonNotifA)

	if len(jsonNotifA.Data.Items) != 1 {
		t.Fatalf("Siswa A seharusnya menerima 1 notifikasi, didapat: %d", len(jsonNotifA.Data.Items))
	}
	if jsonNotifA.Data.UnreadCount != 1 {
		t.Fatalf("Unread count Siswa A seharusnya 1, didapat: %d", jsonNotifA.Data.UnreadCount)
	}
	if jsonNotifA.Data.Items[0].Judul != "Materi Baru: Materi Algoritma Pemrograman Kelas A" {
		t.Errorf("Judul notifikasi tidak sesuai: %s", jsonNotifA.Data.Items[0].Judul)
	}
	expectedPesan := "Ibu Guru Notifikasi, M.Kom. mengunggah materi baru untuk mata pelajaran Pemrograman Web Lanjut."
	if jsonNotifA.Data.Items[0].Pesan != expectedPesan {
		t.Errorf("Pesan notifikasi harus memuat nama guru beserta gelar. Diharapkan: '%s', Didapat: '%s'", expectedPesan, jsonNotifA.Data.Items[0].Pesan)
	}

	// 6. Verifikasi KETAT: Siswa B (Kelas B) TIDAK BOLEH menerima notifikasi tersebut
	reqNotifB := httptest.NewRequest(http.MethodGet, "/api/v1/notifikasi", nil)
	reqNotifB.Header.Set("Authorization", "Bearer "+tokenSiswaB)
	respNotifB, err := app.Test(reqNotifB, 5000)
	if err != nil {
		t.Fatalf("Gagal ambil notifikasi Siswa B: %v", err)
	}
	if respNotifB.StatusCode != http.StatusOK {
		t.Fatalf("Status code notifikasi Siswa B diharapkan 200, didapat: %d", respNotifB.StatusCode)
	}

	var jsonNotifB struct {
		Success bool `json:"success"`
		Data    struct {
			Items       []model.Notifikasi `json:"items"`
			UnreadCount int64              `json:"unread_count"`
		} `json:"data"`
	}
	_ = json.NewDecoder(respNotifB.Body).Decode(&jsonNotifB)

	if len(jsonNotifB.Data.Items) != 0 {
		t.Fatalf("Siswa B (kelas berbeda) TIDAK BOLEH menerima notifikasi, tetapi mendapatkan: %d notifikasi", len(jsonNotifB.Data.Items))
	}
	if jsonNotifB.Data.UnreadCount != 0 {
		t.Fatalf("Unread count Siswa B seharusnya 0, didapat: %d", jsonNotifB.Data.UnreadCount)
	}

	// 7. Verifikasi aksi Tandai Sudah Dibaca (Mark As Read)
	notifID := jsonNotifA.Data.Items[0].ID
	reqMarkRead := httptest.NewRequest(http.MethodPut, "/api/v1/notifikasi/"+notifID.String()+"/read", nil)
	reqMarkRead.Header.Set("Authorization", "Bearer "+tokenSiswaA)
	respMarkRead, err := app.Test(reqMarkRead, 5000)
	if err != nil {
		t.Fatalf("Gagal mark as read: %v", err)
	}
	if respMarkRead.StatusCode != http.StatusOK {
		t.Fatalf("Status mark as read diharapkan 200, didapat: %d", respMarkRead.StatusCode)
	}

	// Cek ulang unread count Siswa A harus menjadi 0
	reqNotifA2 := httptest.NewRequest(http.MethodGet, "/api/v1/notifikasi", nil)
	reqNotifA2.Header.Set("Authorization", "Bearer "+tokenSiswaA)
	respNotifA2, _ := app.Test(reqNotifA2, 5000)
	var jsonNotifA2 struct {
		Data struct {
			Items       []model.Notifikasi `json:"items"`
			UnreadCount int64              `json:"unread_count"`
		} `json:"data"`
	}
	_ = json.NewDecoder(respNotifA2.Body).Decode(&jsonNotifA2)
	if jsonNotifA2.Data.UnreadCount != 0 {
		t.Errorf("Setelah mark read, unread count Siswa A seharusnya 0, didapat: %d", jsonNotifA2.Data.UnreadCount)
	}
	if !jsonNotifA2.Data.Items[0].IsRead {
		t.Errorf("Setelah mark read, is_read harus true")
	}
}
