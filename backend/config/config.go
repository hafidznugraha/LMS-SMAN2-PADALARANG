package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port                string
	DatabaseURL         string
	SupabaseURL         string
	SupabaseProjectRef  string
	SupabasePublishable string
	SupabaseSecretKey   string
	JWTSecret           string
	JWTRefresh          string
	AllowedOrigins      string
	Environment         string
}

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] File .env tidak ditemukan, menggunakan environment variable sistem")
	}

	cfg := &Config{
		Port:                getEnv("PORT", "8080"),
		DatabaseURL:         getEnv("DATABASE_URL", ""),
		SupabaseURL:         getEnv("SUPABASE_URL", "https://pjzpcgdpdqchstmuuzki.supabase.co"),
		SupabaseProjectRef:  getEnv("SUPABASE_PROJECT_REF", "pjzpcgdpdqchstmuuzki"),
		SupabasePublishable: getEnv("SUPABASE_PUBLISHABLE_KEY", ""),
		SupabaseSecretKey:   getEnv("SUPABASE_SECRET_KEY", ""),
		JWTSecret:           getEnv("JWT_SECRET", "super-secret-jwt-key-lms-sman2"),
		JWTRefresh:          getEnv("JWT_REFRESH_SECRET", "super-secret-jwt-refresh-key-lms-sman2"),
		AllowedOrigins:      getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),
		Environment:         getEnv("APP_ENV", "development"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
