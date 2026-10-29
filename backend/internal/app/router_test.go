package app_test

import (
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/app"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

func TestHealthCheck(t *testing.T) {
	cfg := &config.Config{
		Port:           "8080",
		AllowedOrigins: "http://localhost:3000",
		JWTSecret:      "test-secret",
		Environment:    "test",
	}

	fiberApp := app.SetupRouter(cfg)

	req := httptest.NewRequest("GET", "/api/v1/health", nil)
	resp, err := fiberApp.Test(req)
	if err != nil {
		t.Fatalf("Gagal mengirim request test: %v", err)
	}

	if resp.StatusCode != 200 {
		t.Errorf("Expected status 200, got %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatalf("Gagal membaca body response: %v", err)
	}

	var res model.APIResponse
	if err := json.Unmarshal(body, &res); err != nil {
		t.Fatalf("Gagal unmarshal response JSON: %v", err)
	}

	if !res.Success {
		t.Errorf("Expected res.Success to be true, got false")
	}
}
