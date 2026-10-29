package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

// Config menyimpan konfigurasi runtime aplikasi
type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	JWTRefresh   string
	AllowedOrigins string
	Environment  string
}

// LoadConfig membaca environment variables dari file .env atau sistem
func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] File .env tidak ditemukan, menggunakan environment variable sistem")
	}

	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		DatabaseURL:    getEnv("DATABASE_URL", ""),
		JWTSecret:      getEnv("JWT_SECRET", "super-secret-jwt-key-lms-sman2"),
		JWTRefresh:     getEnv("JWT_REFRESH_SECRET", "super-secret-jwt-refresh-key-lms-sman2"),
		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		Environment:    getEnv("APP_ENV", "development"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
