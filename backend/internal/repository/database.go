package repository

import (
	"log"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) (*gorm.DB, error) {
	if cfg.DatabaseURL == "" {
		log.Println("[WARN] DATABASE_URL kosong. Backend berjalan dalam mode offline (tanpa koneksi DB aktif).")
		return nil, nil
	}

	gormLogger := logger.Default.LogMode(logger.Info)
	if cfg.Environment == "production" {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	connConfig, err := pgx.ParseConfig(cfg.DatabaseURL)
	if err != nil {
		log.Printf("[ERROR] Gagal parse DATABASE_URL: %v\n", err)
		return nil, err
	}

	connConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	connConfig.StatementCacheCapacity = 0
	connConfig.DescriptionCacheCapacity = 0

	sqlDB := stdlib.OpenDB(*connConfig)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)

	db, err := gorm.Open(postgres.New(postgres.Config{
		Conn: sqlDB,
	}), &gorm.Config{
		Logger:      gormLogger,
		PrepareStmt: false,
	})
	if err != nil {
		log.Printf("[ERROR] Gagal menyambung ke Supabase PostgreSQL: %v\n", err)
		return nil, err
	}

	log.Println("[SUCCESS] Terhubung ke database Supabase PostgreSQL dengan sukses.")
	DB = db
	return db, nil
}

func GetDB() *gorm.DB {
	return DB
}
