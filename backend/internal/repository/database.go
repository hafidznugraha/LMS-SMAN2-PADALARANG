package repository

import (
	"log"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB instance global database connection
var DB *gorm.DB

// InitDB menginisialisasi koneksi pool PostgreSQL Supabase
func InitDB(cfg *config.Config) (*gorm.DB, error) {
	if cfg.DatabaseURL == "" {
		log.Println("[WARN] DATABASE_URL kosong. Backend berjalan dalam mode offline (tanpa koneksi DB aktif).")
		return nil, nil
	}

	gormLogger := logger.Default.LogMode(logger.Info)
	if cfg.Environment == "production" {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	db, err := gorm.Open(postgres.Open(cfg.DatabaseURL), &gorm.Config{
		Logger: gormLogger,
	})
	if err != nil {
		log.Printf("[ERROR] Gagal menyambung ke Supabase PostgreSQL: %v\n", err)
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}

	// Connection Pool Settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)

	log.Println("[SUCCESS] Terhubung ke database Supabase PostgreSQL dengan sukses.")
	DB = db
	return db, nil
}
