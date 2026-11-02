package app

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

func generateTestToken(userID uuid.UUID, role model.UserRole, secret string) string {
	claims := jwt.MapClaims{
		"user_id":      userID.String(),
		"username":     "testuser",
		"email":        "test@sman2padalarang.sch.id",
		"nama_lengkap": "Test User",
		"role":         string(role),
		"exp":          time.Now().Add(1 * time.Hour).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := t.SignedString([]byte(secret))
	return tokenString
}

func TestMasterAndJadwalEndpoints(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		JWTSecret:      "test-secret-key-12345",
		AllowedOrigins: "http://localhost:3000",
	}

	app := SetupRouter(cfg)

	kurikulumToken := generateTestToken(uuid.New(), model.RoleKurikulum, cfg.JWTSecret)
	siswaToken := generateTestToken(uuid.New(), model.RoleSiswa, cfg.JWTSecret)

	t.Run("Master kelas tanpa auth harus return 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/master/kelas", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected 401, got %d", resp.StatusCode)
		}
	})

	t.Run("Users CRUD dengan role siswa harus return 403 Forbidden", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
		req.Header.Set("Authorization", "Bearer "+siswaToken)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403, got %d", resp.StatusCode)
		}
	})

	t.Run("Create jadwal oleh siswa harus return 403 Forbidden", func(t *testing.T) {
		payload := model.CreateJadwalRequest{
			KelasID:    uuid.New().String(),
			GuruID:     uuid.New().String(),
			MapelID:    uuid.New().String(),
			Hari:       "Senin",
			JamMulai:   "07:00",
			JamSelesai: "09:00",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jadwal", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+siswaToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403, got %d", resp.StatusCode)
		}
	})

	t.Run("Create jadwal dengan jam mulai lebih besar dari selesai harus return 400 Bad Request", func(t *testing.T) {
		payload := model.CreateJadwalRequest{
			KelasID:    uuid.New().String(),
			GuruID:     uuid.New().String(),
			MapelID:    uuid.New().String(),
			Hari:       "Senin",
			JamMulai:   "10:00",
			JamSelesai: "08:00",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jadwal", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400, got %d", resp.StatusCode)
		}
	})

	t.Run("Create jadwal dengan UUID tidak valid harus return 400 Bad Request", func(t *testing.T) {
		payload := model.CreateJadwalRequest{
			KelasID:    "invalid-uuid",
			GuruID:     uuid.New().String(),
			MapelID:    uuid.New().String(),
			Hari:       "Senin",
			JamMulai:   "07:00",
			JamSelesai: "09:00",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/jadwal", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400, got %d", resp.StatusCode)
		}
	})

	t.Run("Create mapel oleh siswa harus return 403 Forbidden", func(t *testing.T) {
		payload := model.CreateMapelRequest{
			KodeMapel: "INF-X",
			NamaMapel: "Informatika",
			Kategori:  "Umum",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/master/mapel", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+siswaToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403, got %d", resp.StatusCode)
		}
	})

	t.Run("Create mapel dengan field kosong harus return 400 Bad Request", func(t *testing.T) {
		payload := model.CreateMapelRequest{
			KodeMapel: "",
			NamaMapel: "",
		}
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/master/mapel", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400, got %d", resp.StatusCode)
		}
	})

	t.Run("Delete mapel dengan invalid UUID harus return 400 Bad Request", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodDelete, "/api/v1/master/mapel/bukan-uuid", nil)
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400, got %d", resp.StatusCode)
		}
	})
}
