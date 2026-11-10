package app

import (
	"encoding/json"
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

func TestMateriDownloadTracking(t *testing.T) {
	_ = godotenv.Load("../../.env")
	cfg := config.LoadConfig()
	if cfg.JWTSecret == "" {
		cfg.JWTSecret = "test-secret-key-12345"
	}

	db, _ := repository.InitDB(cfg)
	if db == nil {
		t.Skip("Database tidak tersedia, lewati tes integrasi")
	}

	app := SetupRouter(cfg)

	kelas := model.Kelas{
		ID:        uuid.New(),
		NamaKelas: "Test Kelas Unduhan",
		Tingkat:   10,
		Jurusan:   "Umum",
	}
	db.Create(&kelas)
	defer db.Delete(&kelas)

	userGuru := model.User{
		ID:           uuid.New(),
		Username:     "guru_unduhan_test",
		Email:        "guru_unduhan@test.com",
		NamaLengkap:  "Guru Unduhan Test",
		Role:         model.RoleGuru,
		PasswordHash: "dummy",
	}
	db.Create(&userGuru)
	defer db.Delete(&userGuru)

	guru := model.Guru{
		ID:     uuid.New(),
		UserID: userGuru.ID,
		NIP:    "999888777",
	}
	db.Create(&guru)
	defer db.Delete(&guru)

	userSiswa1 := model.User{
		ID:           uuid.New(),
		Username:     "siswa_unduhan_1",
		Email:        "siswa1@test.com",
		NamaLengkap:  "Siswa Unduhan 1",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswa1)
	defer db.Delete(&userSiswa1)

	siswa1 := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswa1.ID,
		NIS:          "11111",
		NISN:         "1111111111",
		KelasID:      &kelas.ID,
		JenisKelamin: "Laki-laki",
	}
	db.Create(&siswa1)
	defer db.Delete(&siswa1)

	userSiswa2 := model.User{
		ID:           uuid.New(),
		Username:     "siswa_unduhan_2",
		Email:        "siswa2@test.com",
		NamaLengkap:  "Siswa Unduhan 2",
		Role:         model.RoleSiswa,
		PasswordHash: "dummy",
	}
	db.Create(&userSiswa2)
	defer db.Delete(&userSiswa2)

	siswa2 := model.Siswa{
		ID:           uuid.New(),
		UserID:       userSiswa2.ID,
		NIS:          "22222",
		NISN:         "2222222222",
		KelasID:      &kelas.ID,
		JenisKelamin: "Perempuan",
	}
	db.Create(&siswa2)
	defer db.Delete(&siswa2)

	mapel := model.MataPelajaran{
		ID:        uuid.New(),
		KodeMapel: "TEST-UNDUH",
		NamaMapel: "Mata Pelajaran Test Unduh",
	}
	db.Create(&mapel)
	defer db.Delete(&mapel)

	materi := model.Materi{
		ID:            uuid.New(),
		GuruID:        guru.ID,
		MapelID:       mapel.ID,
		KelasID:       kelas.ID,
		Judul:         "Materi Uji Unduhan Idempoten",
		Deskripsi:     "Deskripsi uji unduhan",
		FileURL:       "https://storage.sman2padalarang.sch.id/materi/test.pdf",
		TipeFile:      "PDF",
		JumlahMelihat: 0,
		CreatedAt:     time.Now(),
	}
	db.Create(&materi)
	defer db.Delete(&materi)
	defer db.Where("materi_id = ?", materi.ID).Delete(&model.MateriUnduhanSiswa{})

	genToken := func(userID uuid.UUID, role model.UserRole) string {
		claims := jwt.MapClaims{
			"user_id":      userID.String(),
			"username":     "user",
			"email":        "user@test.com",
			"nama_lengkap": "User",
			"role":         string(role),
			"exp":          time.Now().Add(1 * time.Hour).Unix(),
		}
		t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, _ := t.SignedString([]byte(cfg.JWTSecret))
		return tokenString
	}

	tokenGuru := genToken(userGuru.ID, model.RoleGuru)
	tokenSiswa1 := genToken(userSiswa1.ID, model.RoleSiswa)
	tokenSiswa2 := genToken(userSiswa2.ID, model.RoleSiswa)

	t.Run("Guru mengunduh materi tidak boleh menambah counter unduhan", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/materi/"+materi.ID.String()+"/download", nil)
		req.Header.Set("Authorization", "Bearer "+tokenGuru)
		resp, err := app.Test(req, 10000)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200, got %d", resp.StatusCode)
		}

		var refreshed model.Materi
		db.First(&refreshed, materi.ID)
		if refreshed.JumlahMelihat != 0 {
			t.Errorf("Counter unduhan harus tetap 0 saat guru mengunduh, didapat: %d", refreshed.JumlahMelihat)
		}
	})

	t.Run("Siswa 1 mengunduh pertama kali harus menghitung 1", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/siswa/materi/"+materi.ID.String()+"/download", nil)
		req.Header.Set("Authorization", "Bearer "+tokenSiswa1)
		resp, err := app.Test(req, 10000)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200, got %d", resp.StatusCode)
		}

		var refreshed model.Materi
		db.First(&refreshed, materi.ID)
		if refreshed.JumlahMelihat != 1 {
			t.Errorf("Counter unduhan harus menjadi 1, didapat: %d", refreshed.JumlahMelihat)
		}
	})

	t.Run("Siswa 1 mengunduh berulang kali harus tetap terhitung 1 (idempoten)", func(t *testing.T) {
		for i := 0; i < 3; i++ {
			req := httptest.NewRequest(http.MethodGet, "/api/v1/siswa/materi/"+materi.ID.String()+"/download", nil)
			req.Header.Set("Authorization", "Bearer "+tokenSiswa1)
			resp, _ := app.Test(req, 10000)
			if resp.StatusCode != http.StatusOK {
				t.Errorf("Expected 200, got %d", resp.StatusCode)
			}
		}

		var refreshed model.Materi
		db.First(&refreshed, materi.ID)
		if refreshed.JumlahMelihat != 1 {
			t.Errorf("Counter unduhan harus TETAP 1 meskipun siswa 1 mengunduh berulang kali, didapat: %d", refreshed.JumlahMelihat)
		}
	})

	t.Run("Siswa 2 mengunduh materi harus menambah counter menjadi 2", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/siswa/materi/"+materi.ID.String()+"/download", nil)
		req.Header.Set("Authorization", "Bearer "+tokenSiswa2)
		resp, err := app.Test(req, 10000)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200, got %d", resp.StatusCode)
		}

		var refreshed model.Materi
		db.First(&refreshed, materi.ID)
		if refreshed.JumlahMelihat != 2 {
			t.Errorf("Counter unduhan harus menjadi 2 setelah siswa berbeda mengunduh, didapat: %d", refreshed.JumlahMelihat)
		}
	})

	t.Run("GetMateriList guru mengembalikan unduhan_count siswa yang benar", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/guru/materi", nil)
		req.Header.Set("Authorization", "Bearer "+tokenGuru)
		resp, err := app.Test(req, 10000)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}

		var res struct {
			Success bool `json:"success"`
			Data    []struct {
				ID           string `json:"id"`
				UnduhanCount int    `json:"unduhan_count"`
			} `json:"data"`
		}
		_ = json.NewDecoder(resp.Body).Decode(&res)

		var foundCount *int
		for _, m := range res.Data {
			if m.ID == materi.ID.String() {
				c := m.UnduhanCount
				foundCount = &c
				break
			}
		}

		if foundCount == nil || *foundCount != 2 {
			t.Errorf("unduhan_count pada response daftar materi harus 2, didapat: %v", foundCount)
		}
	})
}
