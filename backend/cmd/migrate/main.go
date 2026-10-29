package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/joho/godotenv"
)

func main() {
	// Muat .env
	_ = godotenv.Load()

	rawURL := os.Getenv("DATABASE_URL")
	if rawURL == "" {
		log.Fatal("DATABASE_URL kosong di file .env")
	}

	fmt.Println("Memeriksa format URL koneksi database...")

	// Candidates for connection string:
	// 1. As is in .env
	// 2. Without brackets around password
	// 3. Port 5432 session pooler vs 6543 transaction pooler vs direct connection
	candidates := []string{
		rawURL,
	}

	// If contains [something], also try without [ and ]
	if strings.Contains(rawURL, ":[") && strings.Contains(rawURL, "]@") {
		cleaned := strings.Replace(rawURL, ":[", ":", 1)
		cleaned = strings.Replace(cleaned, "]@", "@", 1)
		candidates = append([]string{cleaned}, candidates...) // prioritize cleaned
	}

	// Also generate port 5432 candidates (Session pooler is much better for DDL / migrations)
	var allCandidates []string
	for _, c := range candidates {
		allCandidates = append(allCandidates, c)
		if strings.Contains(c, ":6543") {
			allCandidates = append(allCandidates, strings.Replace(c, ":6543", ":5432", 1))
		}
	}

	var conn *pgx.Conn
	var successfulURL string
	var lastErr error

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	for _, cand := range allCandidates {
		// Mask password in log
		masked := maskURL(cand)
		fmt.Printf("Mencoba koneksi ke: %s ...\n", masked)

		cfg, err := pgx.ParseConfig(cand)
		if err != nil {
			lastErr = err
			fmt.Printf("  -> Gagal parse URL: %v\n", err)
			continue
		}

		c, err := pgx.ConnectConfig(ctx, cfg)
		if err == nil {
			err = c.Ping(ctx)
			if err == nil {
				conn = c
				successfulURL = cand
				fmt.Println("  -> [BERHASIL] Terhubung ke Supabase PostgreSQL!")
				break
			}
			c.Close(ctx)
		}
		lastErr = err
		fmt.Printf("  -> Gagal: %v\n", err)
	}

	if conn == nil {
		log.Fatalf("Semua percobaan koneksi gagal. Error terakhir: %v\n", lastErr)
	}
	defer conn.Close(ctx)

	// Update .env if the successful URL was cleaned/fixed
	if successfulURL != rawURL {
		fmt.Println("Memperbarui DATABASE_URL di .env dengan URL yang valid...")
		updateEnvDatabaseURL(successfulURL)
	}

	// Read migration file
	migrationPath := "migrations/000001_init_schema.up.sql"
	sqlBytes, err := os.ReadFile(migrationPath)
	if err != nil {
		// Try backend/migrations/...
		migrationPath = "backend/migrations/000001_init_schema.up.sql"
		sqlBytes, err = os.ReadFile(migrationPath)
		if err != nil {
			log.Fatalf("Gagal membaca file migrasi: %v", err)
		}
	}

	fmt.Printf("Menjalankan migrasi DDL dari %s...\n", migrationPath)
	_, err = conn.Exec(ctx, string(sqlBytes))
	if err != nil {
		log.Fatalf("Gagal menjalankan migrasi DDL: %v", err)
	}
	fmt.Println("✅ Migrasi DDL berhasil dieksekusi!")

	// Jalankan seeds
	seedsPath := "seeds/seeds.sql"
	seedsBytes, err := os.ReadFile(seedsPath)
	if err != nil {
		seedsPath = "backend/seeds/seeds.sql"
		seedsBytes, _ = os.ReadFile(seedsPath)
	}
	if len(seedsBytes) > 0 {
		fmt.Printf("Menjalankan data awal (seed) dari %s...\n", seedsPath)
		_, err = conn.Exec(ctx, string(seedsBytes))
		if err != nil {
			fmt.Printf("⚠️ Catatan Seed: %v\n", err)
		} else {
			fmt.Println("✅ Data seed awal berhasil dimasukkan!")
		}
	}

	// Verifikasi tabel-tabel yang berhasil dibuat
	fmt.Println("\nMemeriksa tabel-tabel di skema public:")
	rows, err := conn.Query(ctx, `
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		ORDER BY table_name;
	`)
	if err != nil {
		log.Fatalf("Gagal memeriksa tabel: %v", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tName string
		if err := rows.Scan(&tName); err == nil {
			tables = append(tables, tName)
			fmt.Printf(" - %s\n", tName)
		}
	}
	fmt.Printf("\nTotal tabel terverifikasi di Supabase: %d tabel.\n", len(tables))
}

func maskURL(u string) string {
	parts := strings.Split(u, "@")
	if len(parts) < 2 {
		return u
	}
	prefix := parts[0]
	colonIdx := strings.LastIndex(prefix, ":")
	if colonIdx != -1 {
		prefix = prefix[:colonIdx+1] + "*****"
	}
	return prefix + "@" + parts[1]
}

func updateEnvDatabaseURL(newURL string) {
	envPaths := []string{".env", "backend/.env"}
	for _, p := range envPaths {
		content, err := os.ReadFile(p)
		if err != nil {
			continue
		}
		lines := strings.Split(string(content), "\n")
		for i, line := range lines {
			if strings.HasPrefix(line, "DATABASE_URL=") {
				lines[i] = "DATABASE_URL=" + newURL
			}
		}
		_ = os.WriteFile(p, []byte(strings.Join(lines, "\n")), 0644)
	}
}
