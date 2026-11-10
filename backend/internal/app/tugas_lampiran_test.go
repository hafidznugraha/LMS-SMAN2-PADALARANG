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

func TestTugasFileLampiranDanUpload(t *testing.T) {
	_ = godotenv.Load("../../.env")
	cfg := config.LoadConfig()
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "test-secret-key-12345"
	}

	db, _ := repository.InitDB(cfg)
	if db == nil {
		t.Skip("Database tidak tersedia, lewati tes lampiran tugas")
	}

	app := SetupRouter(cfg)

	// 1. Setup Kelas
	kelas := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Kelas Lampiran Test",
		Tingkat:   10,
		Jurusan:   "RPL",
	}
	db.Create(&kelas)
	defer db.Delete(&kelas)

	// 2. Setup Guru
	userGuru := model.User{
		ID:           uuid.New(),
		Username:     "guru_lampiran_" + uuid.New().String()[:8],
		Email:        "guru_lampiran_" + uuid.New().String()[:8] + "@test.com",
		NamaLengkap:  "Ibu Pengajar Lampiran",
		Role:         model.RoleGuru,
		PasswordHash: "dummy",
	}
	db.Create(&userGuru)
	defer db.Delete(&userGuru)

	mapel := model.MataPelajaran{
		ID:        uuid.New(),
		KodeMapel: "TEST-LAMPIRAN",
		NamaMapel: "Pemrograman Web",
	}
	db.Create(&mapel)
	defer db.Delete(&mapel)

	guru := model.Guru{
		ID:      uuid.New(),
		UserID:  userGuru.ID,
		NIP:     fmt.Sprintf("1985%014d", time.Now().UnixNano()%100000000000000),
		MapelID: &mapel.ID,
		Gelar:   "S.Kom.",
	}
	db.Create(&guru)
	defer db.Delete(&guru)

	jadwal := model.JadwalPelajaran{
		ID:        uuid.New(),
		GuruID:    guru.ID,
		MapelID:   mapel.ID,
		KelasID:   kelas.ID,
		Hari:      "Senin",
		JamMulai:  "07:00",
		JamSelesai: "08:30",
	}
	db.Create(&jadwal)
	defer db.Delete(&jadwal)

	tokenGuru := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      userGuru.ID.String(),
		"user_id":  userGuru.ID.String(),
		"role":     string(model.RoleGuru),
		"guru_id":  guru.ID.String(),
		"mapel_id": mapel.ID.String(),
		"exp":      time.Now().Add(2 * time.Hour).Unix(),
	})
	guruJWT, err := tokenGuru.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		t.Fatalf("Gagal buat token JWT guru: %v", err)
	}

	// 3. Test POST /api/v1/guru/tugas/upload
	bodyBuf := &bytes.Buffer{}
	mpWriter := multipart.NewWriter(bodyBuf)
	part, err := mpWriter.CreateFormFile("file", "modul_referensi.pdf")
	if err != nil {
		t.Fatalf("Gagal buat form file: %v", err)
	}
	part.Write([]byte("%PDF-1.4 dummy file content for testing lampiran tugas"))
	mpWriter.Close()

	reqUpload := httptest.NewRequest(http.MethodPost, "/api/v1/guru/tugas/upload", bodyBuf)
	reqUpload.Header.Set("Authorization", "Bearer "+guruJWT)
	reqUpload.Header.Set("Content-Type", mpWriter.FormDataContentType())

	respUpload, err := app.Test(reqUpload)
	if err != nil {
		t.Fatalf("Gagal eksekusi upload lampiran: %v", err)
	}
	if respUpload.StatusCode != http.StatusOK {
		t.Fatalf("Status upload lampiran diharapkan 200, didapat: %d", respUpload.StatusCode)
	}

	var resUpload struct {
		Success bool `json:"success"`
		Data    struct {
			FileURL  string `json:"file_url"`
			FileName string `json:"file_name"`
		} `json:"data"`
	}
	_ = json.NewDecoder(respUpload.Body).Decode(&resUpload)
	if !resUpload.Success || resUpload.Data.FileURL == "" {
		t.Fatalf("Respon upload lampiran tidak valid: %+v", resUpload)
	}

	// 4. Test Create Tugas dengan file_lampiran JSON (Drive, YouTube, File, Link)
	lampiranList := []map[string]string{
		{
			"type": "drive",
			"name": "Lembar Kerja Siswa",
			"url":  "https://drive.google.com/file/d/12345/view",
		},
		{
			"type": "youtube",
			"name": "Video Pembahasan Aljabar",
			"url":  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		},
		{
			"type": "file",
			"name": resUpload.Data.FileName,
			"url":  resUpload.Data.FileURL,
		},
		{
			"type": "link",
			"name": "Dokumentasi MDN",
			"url":  "https://developer.mozilla.org",
		},
	}
	lampiranJSON, _ := json.Marshal(lampiranList)

	deadline := time.Now().Add(48 * time.Hour).Format("2006-01-02 15:04:05")
	tugasPayload := map[string]interface{}{
		"guru_id":       guru.ID.String(),
		"mapel_id":      mapel.ID.String(),
		"kelas_id":      kelas.ID.String(),
		"judul":         "Tugas Praktikum Web dengan Lampiran Lengkap",
		"deskripsi":     "Pelajari lampiran Drive, YouTube, dan Berkas yang tersedia.",
		"deadline":      deadline,
		"format_file":   "pdf, docx",
		"file_lampiran": string(lampiranJSON),
	}
	tugasJSON, _ := json.Marshal(tugasPayload)

	reqCreate := httptest.NewRequest(http.MethodPost, "/api/v1/guru/tugas", bytes.NewReader(tugasJSON))
	reqCreate.Header.Set("Authorization", "Bearer "+guruJWT)
	reqCreate.Header.Set("Content-Type", "application/json")

	respCreate, err := app.Test(reqCreate)
	if err != nil {
		t.Fatalf("Gagal create tugas: %v", err)
	}
	if respCreate.StatusCode != http.StatusCreated {
		t.Fatalf("Status create tugas diharapkan 201, didapat: %d", respCreate.StatusCode)
	}

	var resCreate struct {
		Success bool                      `json:"success"`
		Data    model.TugasDetailResponse `json:"data"`
	}
	_ = json.NewDecoder(respCreate.Body).Decode(&resCreate)
	if !resCreate.Success {
		t.Fatalf("Gagal create tugas: %+v", resCreate)
	}
	defer db.Delete(&model.Tugas{}, "id = ?", resCreate.Data.ID)

	// 5. Verifikasi tersimpan di Database
	var dbTugas model.Tugas
	if err := db.Where("id = ?", resCreate.Data.ID).First(&dbTugas).Error; err != nil {
		t.Fatalf("Tugas tidak ditemukan di database: %v", err)
	}

	if dbTugas.FileLampiran != string(lampiranJSON) {
		t.Errorf("FileLampiran di database tidak cocok. Diharapkan: %s, Didapat: %s", string(lampiranJSON), dbTugas.FileLampiran)
	}

	// 6. Verifikasi GET /api/v1/guru/tugas mengembalikan file_lampiran
	reqGet := httptest.NewRequest(http.MethodGet, "/api/v1/guru/tugas?kelas_id="+kelas.ID.String(), nil)
	reqGet.Header.Set("Authorization", "Bearer "+guruJWT)

	respGet, err := app.Test(reqGet)
	if err != nil {
		t.Fatalf("Gagal GET tugas: %v", err)
	}
	if respGet.StatusCode != http.StatusOK {
		t.Fatalf("Status GET tugas diharapkan 200, didapat: %d", respGet.StatusCode)
	}

	var resGet struct {
		Success bool                        `json:"success"`
		Data    []model.TugasDetailResponse `json:"data"`
	}
	_ = json.NewDecoder(respGet.Body).Decode(&resGet)

	var found bool
	for _, item := range resGet.Data {
		if item.ID == resCreate.Data.ID {
			found = true
			if item.FileLampiran != string(lampiranJSON) {
				t.Errorf("FileLampiran di GET response tidak cocok: %s", item.FileLampiran)
			}
			break
		}
	}
	if !found {
		t.Fatalf("Tugas baru tidak ditemukan di daftar GET tugas")
	}
}
