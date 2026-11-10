package app

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

func TestNotifikasiTugasKelasTarget(t *testing.T) {
	_ = godotenv.Load("../../.env")
	cfg := config.LoadConfig()
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "test-secret-key-12345"
	}

	db, _ := repository.InitDB(cfg)
	if db == nil {
		t.Skip("Database tidak tersedia, lewati tes integrasi notifikasi tugas")
	}

	app := SetupRouter(cfg)

	kelasA := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Kelas Test Tugas A",
		Tingkat:   11,
		Jurusan:   "RPL",
	}
	db.Create(&kelasA)
	defer db.Delete(&kelasA)

	kelasB := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Kelas Test Tugas B",
		Tingkat:   11,
		Jurusan:   "TKJ",
	}
	db.Create(&kelasB)
	defer db.Delete(&kelasB)

	userGuru := model.User{
		ID:           uuid.New(),
		Username:     "guru_tugas_test_" + uuid.New().String()[:8],
		Email:        "guru_tugas_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Pak Guru Pengajar",
		Role:         model.RoleGuru,
		PasswordHash: "dummy",
	}
	db.Create(&userGuru)
	defer db.Delete(&userGuru)

	mapel := model.MataPelajaran{
		ID:        uuid.New(),
		KodeMapel: "TEST-TUGAS",
		NamaMapel: "Basis Data Lanjut",
	}
	db.Create(&mapel)
	defer db.Delete(&mapel)

	guru := model.Guru{
		ID:      uuid.New(),
		UserID:  userGuru.ID,
		NIP:     fmt.Sprintf("1982%014d", time.Now().UnixNano()%100000000000000),
		MapelID: &mapel.ID,
		Gelar:   "M.T.",
	}
	db.Create(&guru)
	defer db.Delete(&guru)

	jadwalA := model.JadwalPelajaran{
		ID:         uuid.New(),
		KelasID:    kelasA.ID,
		GuruID:     guru.ID,
		MapelID:    mapel.ID,
		Hari:       "Selasa",
		JamMulai:   "08:00",
		JamSelesai: "10:00",
	}
	db.Create(&jadwalA)
	defer db.Delete(&jadwalA)

	userSiswaA := model.User{
		ID:           uuid.New(),
		Username:     "siswa_tugas_a_" + uuid.New().String()[:8],
		Email:        "siswa_tugas_a_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Siswa Tugas Kelas A",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswaA)
	defer db.Delete(&userSiswaA)

	siswaA := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswaA.ID,
		NIS:          fmt.Sprintf("33%06d", time.Now().UnixNano()%1000000),
		NISN:         fmt.Sprintf("0033%06d", time.Now().UnixNano()%1000000),
		KelasID:      &kelasA.ID,
		JenisKelamin: "Laki-laki",
	}
	db.Create(&siswaA)
	defer db.Delete(&siswaA)

	userSiswaB := model.User{
		ID:           uuid.New(),
		Username:     "siswa_tugas_b_" + uuid.New().String()[:8],
		Email:        "siswa_tugas_b_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Siswa Tugas Kelas B",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswaB)
	defer db.Delete(&userSiswaB)

	siswaB := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswaB.ID,
		NIS:          fmt.Sprintf("44%06d", (time.Now().UnixNano()+1)%1000000),
		NISN:         fmt.Sprintf("0044%06d", (time.Now().UnixNano()+1)%1000000),
		KelasID:      &kelasB.ID,
		JenisKelamin: "Perempuan",
	}
	db.Create(&siswaB)
	defer db.Delete(&siswaB)

	createToken := func(userID uuid.UUID, role model.UserRole, username string) string {
		claims := jwt.MapClaims{
			"user_id":  userID.String(),
			"role":     string(role),
			"username": username,
			"exp":      time.Now().Add(1 * time.Hour).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := token.SignedString([]byte(cfg.JWTSecret))
		return tokenString
	}

	tokenGuru := createToken(userGuru.ID, model.RoleGuru, userGuru.Username)
	tokenSiswaA := createToken(userSiswaA.ID, model.RoleSiswa, userSiswaA.Username)
	tokenSiswaB := createToken(userSiswaB.ID, model.RoleSiswa, userSiswaB.Username)

	deadlineFuture := time.Now().Add(7 * 24 * time.Hour)
	reqBody := model.CreateTugasRequest{
		MapelID:    mapel.ID.String(),
		KelasID:    kelasA.ID.String(),
		Judul:      "Tugas Perancangan ERD Database",
		Deskripsi:  "Buat rancangan ERD untuk sistem rental mobil",
		Deadline:   deadlineFuture.Format("2006-01-02 15:04:05"),
		FormatFile: "pdf, docx",
	}
	bodyBytes, _ := json.Marshal(reqBody)

	reqUpload := httptest.NewRequest(http.MethodPost, "/api/v1/guru/tugas", bytes.NewReader(bodyBytes))
	reqUpload.Header.Set("Authorization", "Bearer "+tokenGuru)
	reqUpload.Header.Set("Content-Type", "application/json")

	respUpload, err := app.Test(reqUpload, 10000)
	if err != nil {
		t.Fatalf("Gagal eksekusi endpoint terbitkan tugas: %v", err)
	}
	if respUpload.StatusCode != http.StatusCreated {
		t.Fatalf("Status code terbitkan tugas diharapkan 201, didapat: %d", respUpload.StatusCode)
	}

	defer func() {
		db.Where("judul = ?", "Tugas Perancangan ERD Database").Delete(&model.Tugas{})
		db.Where("user_id = ? OR user_id = ?", userSiswaA.ID, userSiswaB.ID).Delete(&model.Notifikasi{})
	}()

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
		t.Fatalf("Siswa A seharusnya menerima 1 notifikasi tugas, didapat: %d", len(jsonNotifA.Data.Items))
	}
	if jsonNotifA.Data.UnreadCount != 1 {
		t.Fatalf("Unread count Siswa A seharusnya 1, didapat: %d", jsonNotifA.Data.UnreadCount)
	}

	notifItem := jsonNotifA.Data.Items[0]
	if notifItem.Judul != "Tugas Baru: Tugas Perancangan ERD Database" {
		t.Errorf("Judul notifikasi tugas tidak sesuai: %s", notifItem.Judul)
	}
	if notifItem.Tipe != "tugas" {
		t.Errorf("Tipe notifikasi diharapkan 'tugas', didapat: %s", notifItem.Tipe)
	}
	if notifItem.Tautan != "/siswa/tugas" {
		t.Errorf("Tautan notifikasi diharapkan '/siswa/tugas', didapat: %s", notifItem.Tautan)
	}
	if !strings.Contains(notifItem.Pesan, "Pak Guru Pengajar, M.T.") {
		t.Errorf("Pesan notifikasi harus memuat nama guru beserta gelar 'Pak Guru Pengajar, M.T.'. Pesan: %s", notifItem.Pesan)
	}
	if !strings.Contains(notifItem.Pesan, "Basis Data Lanjut") {
		t.Errorf("Pesan notifikasi harus memuat nama mapel 'Basis Data Lanjut'. Pesan: %s", notifItem.Pesan)
	}
	if !strings.Contains(notifItem.Pesan, "Tenggat waktu:") {
		t.Errorf("Pesan notifikasi harus memuat info tenggat waktu. Pesan: %s", notifItem.Pesan)
	}

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
		t.Fatalf("ISOLASI KELAS BOCOR! Siswa B menerima %d notifikasi yang bukan untuk kelasnya!", len(jsonNotifB.Data.Items))
	}

	notifID := jsonNotifA.Data.Items[0].ID
	reqRead := httptest.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/notifikasi/%s/read", notifID.String()), nil)
	reqRead.Header.Set("Authorization", "Bearer "+tokenSiswaA)
	respRead, _ := app.Test(reqRead, 5000)
	if respRead.StatusCode != http.StatusOK {
		t.Fatalf("Status code mark as read diharapkan 200, didapat: %d", respRead.StatusCode)
	}

	reqNotifA2 := httptest.NewRequest(http.MethodGet, "/api/v1/notifikasi", nil)
	reqNotifA2.Header.Set("Authorization", "Bearer "+tokenSiswaA)
	respNotifA2, _ := app.Test(reqNotifA2, 5000)
	var jsonNotifA2 struct {
		Data struct {
			UnreadCount int64 `json:"unread_count"`
		} `json:"data"`
	}
	_ = json.NewDecoder(respNotifA2.Body).Decode(&jsonNotifA2)
	if jsonNotifA2.Data.UnreadCount != 0 {
		t.Errorf("Setelah dibaca, unread count diharapkan 0, didapat: %d", jsonNotifA2.Data.UnreadCount)
	}
}
