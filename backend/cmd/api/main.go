package main

import (
	"log"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/app"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

func main() {
	// 1. Muat konfigurasi
	cfg := config.LoadConfig()

	// 2. Inisialisasi koneksi database (Supabase PostgreSQL)
	_, _ = repository.InitDB(cfg)

	// 3. Konfigurasi router Fiber
	server := app.SetupRouter(cfg)

	// 4. Jalankan server HTTP
	log.Printf("[INFO] Server LMS SMAN 2 Padalarang berjalan di port :%s (Env: %s)\n", cfg.Port, cfg.Environment)
	if err := server.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("[FATAL] Gagal menjalankan server: %v\n", err)
	}
}
