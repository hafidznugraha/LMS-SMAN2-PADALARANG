package app_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/app"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

func TestAuthEndpoints(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		AllowedOrigins: "http://localhost:3000",
		JWTSecret:      "test-jwt-secret-key-1234567890",
		JWTRefresh:     "test-jwt-refresh-secret-1234567890",
		Environment:    "test",
	}

	fiberApp := app.SetupRouter(cfg)

	t.Run("Login dengan body kosong harus return 400", func(t *testing.T) {
		payload := []byte(`{"identifier":"", "password":""}`)
		req := httptest.NewRequest("POST", "/api/v1/auth/login", bytes.NewBuffer(payload))
		req.Header.Set("Content-Type", "application/json")

		resp, err := fiberApp.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != 400 {
			t.Errorf("Expected status 400, got %d", resp.StatusCode)
		}
	})

	t.Run("Logout harus berhasil dan mengembalikan 200", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/auth/logout", nil)
		resp, err := fiberApp.Test(req)
		if err != nil {
			t.Fatalf("Gagal request logout: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}
	})

	t.Run("Akses rute terproteksi tanpa token harus return 401", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/kurikulum/jadwal", nil)
		resp, err := fiberApp.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != 401 {
			t.Errorf("Expected status 401, got %d", resp.StatusCode)
		}
	})

	t.Run("Akses rute kurikulum dengan token peran Siswa harus return 403", func(t *testing.T) {
		claims := jwt.MapClaims{
			"user_id":      uuid.New().String(),
			"username":     "siswa_test",
			"email":        "siswa@test.com",
			"nama_lengkap": "Siswa Uji Coba",
			"role":         string(model.RoleSiswa),
			"exp":          time.Now().Add(15 * time.Minute).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signedToken, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			t.Fatalf("Gagal membuat token: %v", err)
		}

		req := httptest.NewRequest("GET", "/api/v1/kurikulum/jadwal", nil)
		req.Header.Set("Authorization", "Bearer "+signedToken)

		resp, err := fiberApp.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != 403 {
			t.Errorf("Expected status 403 Forbidden, got %d", resp.StatusCode)
		}
	})

	t.Run("Akses rute kurikulum dengan token peran Kurikulum harus return 200", func(t *testing.T) {
		claims := jwt.MapClaims{
			"user_id":      uuid.New().String(),
			"username":     "kurikulum_test",
			"email":        "kurikulum@test.com",
			"nama_lengkap": "Drs. Herman",
			"role":         string(model.RoleKurikulum),
			"exp":          time.Now().Add(15 * time.Minute).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		signedToken, err := token.SignedString([]byte(cfg.JWTSecret))
		if err != nil {
			t.Fatalf("Gagal membuat token: %v", err)
		}

		req := httptest.NewRequest("GET", "/api/v1/kurikulum/jadwal", nil)
		req.Header.Set("Authorization", "Bearer "+signedToken)

		resp, err := fiberApp.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != 200 {
			t.Errorf("Expected status 200, got %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res model.APIResponse
		_ = json.Unmarshal(body, &res)
		if !res.Success {
			t.Errorf("Expected success response, got false")
		}
	})
}
