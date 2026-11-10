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

func TestPengaturanAndAbsensiEndpointsAuth(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		JWTSecret:      "test-secret-key-12345",
		AllowedOrigins: "http://localhost:3000",
	}

	app := SetupRouter(cfg)

	kurikulumToken := generateTestToken(uuid.New(), model.RoleKurikulum, cfg.JWTSecret)
	siswaToken := generateTestToken(uuid.New(), model.RoleSiswa, cfg.JWTSecret)

	t.Run("Get pengaturan tanpa token harus 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/pengaturan", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Harusnya status 401, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Update pengaturan oleh siswa harus ditolak 403", func(t *testing.T) {
		payload, _ := json.Marshal(model.UpdatePengaturanRequest{
			TahunAjaranAktif: "2026/2027",
			SemesterAktif:    "Genap",
		})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/pengaturan", bytes.NewReader(payload))
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

	t.Run("Sinkron dapodik oleh siswa harus ditolak 403", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/pengaturan/sinkron-dapodik", nil)
		req.Header.Set("Authorization", "Bearer "+siswaToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Harusnya status 403 Forbidden, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Get rekap absensi tanpa token harus 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/absensi/rekap", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Harusnya status 401, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Get peringatan absensi tanpa token harus 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/absensi/peringatan", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Harusnya status 401, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Get export CSV absensi tanpa token harus 401", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/absensi/export-csv", nil)
		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Harusnya status 401, didapat %d", resp.StatusCode)
		}
	})

	t.Run("Kurikulum token memiliki izin akses pengaturan", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/pengaturan", nil)
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			t.Errorf("Kurikulum tidak boleh ditolak 401/403, status: %d", resp.StatusCode)
		}
	})

	t.Run("Update konfigurasi penilaian dengan total bobot tidak 100 persen harus ditolak 400", func(t *testing.T) {
		bTugas := 40.0
		bUH := 20.0
		bUTS := 20.0
		bUAS := 10.0
		payload, _ := json.Marshal(model.UpdatePengaturanRequest{
			BobotTugas: &bTugas,
			BobotUH:    &bUH,
			BobotUTS:   &bUTS,
			BobotUAS:   &bUAS,
		})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/pengaturan", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("Harusnya status 400 Bad Request atau 503 (tanpa DB), didapat: %d", resp.StatusCode)
		}
	})

	t.Run("Update konfigurasi penilaian dengan ambang batas predikat tidak menurun harus ditolak 400", func(t *testing.T) {
		bA := 70.0
		bB := 80.0
		bC := 60.0
		payload, _ := json.Marshal(model.UpdatePengaturanRequest{
			BatasPredikatA: &bA,
			BatasPredikatB: &bB,
			BatasPredikatC: &bC,
		})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/pengaturan", bytes.NewReader(payload))
		req.Header.Set("Authorization", "Bearer "+kurikulumToken)
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Gagal request: %v", err)
		}
		if resp.StatusCode != http.StatusBadRequest && resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("Harusnya status 400 Bad Request atau 503 (tanpa DB), didapat: %d", resp.StatusCode)
		}
	})
}
