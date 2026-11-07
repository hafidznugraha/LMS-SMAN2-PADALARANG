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
	EnableAltcha        bool
}

func LoadConfig() *Config {
	// Coba muat file .env dan hilangkan karakter BOM (Byte Order Mark) jika ada
	envFiles := []string{".env", "backend/.env", "../.env"}
	loaded := false
	for _, file := range envFiles {
		if data, err := os.ReadFile(file); err == nil {
			if len(data) >= 3 && data[0] == 0xef && data[1] == 0xbb && data[2] == 0xbf {
				data = data[3:]
			}
			if envMap, err := godotenv.Unmarshal(string(data)); err == nil {
				for k, v := range envMap {
					if os.Getenv(k) == "" {
						_ = os.Setenv(k, v)
					}
				}
				loaded = true
				break
			}
		}
	}

	if !loaded {
		_ = godotenv.Load()
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
		EnableAltcha:        getEnv("ENABLE_ALTCHA", "false") == "true",
	}

	if cfg.DatabaseURL == "" {
		log.Println("[WARN] DATABASE_URL kosong! Pastikan file .env terbaca dengan benar.")
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
