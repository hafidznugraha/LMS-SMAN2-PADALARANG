package app

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

func TestLaporanEndpointsAuthAndPermissions(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		JWTSecret:      "test-secret-key-12345",
		AllowedOrigins: "http://localhost:3000",
	}

	app := SetupRouter(cfg)

	kurikulumToken := generateTestToken(uuid.New(), model.RoleKurikulum, cfg.JWTSecret)
	siswaToken := generateTestToken(uuid.New(), model.RoleSiswa, cfg.JWTSecret)
	guruToken := generateTestToken(uuid.New(), model.RoleGuru, cfg.JWTSecret)

	t.Run("Get summary tanpa token harus return 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/laporan/summary", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Harusnya status 401, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Generate draf oleh siswa harus return 403", func(t *testing.T) {
		payload, _ := json.Marshal(model.GenerateLaporanRequest{
			KelasID:     "all",
			Semester:    "Ganjil",
			TahunAjaran: "2026/2027",
		})
		req := httptest.NewRequest(http.MethodPost, "/api/v1/laporan/generate", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+siswaToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Harusnya status 403 Forbidden, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Finalize oleh guru harus return 403", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPut, "/api/v1/laporan/"+uuid.New().String()+"/finalize", nil)
		req.Header.Set("Authorization", "Bearer "+guruToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Harusnya status 403 Forbidden, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Finalize batch oleh kurikulum dengan ID invalid", func(t *testing.T) {
		payload, _ := json.Marshal(model.FinalizeBatchRequest{
			LaporanIDs:  []string{"invalid-uuid"},
			Semester:    "Ganjil",
			TahunAjaran: "2026/2027",
		})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/laporan/finalize-batch", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("Harusnya 200 atau 503 saat db offline, didapat %d", resp.StatusCode)
		}
	})
}
