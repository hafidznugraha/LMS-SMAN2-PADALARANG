package main

import (
	"log"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/app"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

func main() {
	cfg := config.LoadConfig()

	_, _ = repository.InitDB(cfg)

	server := app.SetupRouter(cfg)

	log.Printf("[INFO] Server LMS SMAN 2 Padalarang berjalan di port :%s (Env: %s)\n", cfg.Port, cfg.Environment)
	if err := server.Listen(":" + cfg.Port); err != nil {
		log.Fatalf("[FATAL] Gagal menjalankan server: %v\n", err)
	}
}
