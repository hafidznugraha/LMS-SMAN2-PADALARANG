// Package storage menyimpan berkas unggahan siswa, baik ke Supabase Storage
// maupun ke disk lokal (untuk pengembangan tanpa Supabase).
package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Store menyimpan dan menghapus berkas. Save mengembalikan referensi
// (URL atau path) yang disimpan di kolom file_url.
type Store interface {
	Save(ctx context.Context, objectPath string, data []byte, contentType string) (string, error)
	Remove(ctx context.Context, ref string) error
}

// ---------- Supabase Storage ----------

type Supabase struct {
	baseURL string
	key     string
	bucket  string
	client  *http.Client
}

func NewSupabase(baseURL, secretKey, bucket string) *Supabase {
	return &Supabase{
		baseURL: strings.TrimRight(baseURL, "/"),
		key:     secretKey,
		bucket:  bucket,
		client:  &http.Client{Timeout: 60 * time.Second},
	}
}

func escapePath(p string) string {
	parts := strings.Split(p, "/")
	for i, s := range parts {
		parts[i] = url.PathEscape(s)
	}
	return strings.Join(parts, "/")
}

func (s *Supabase) objectURL(objectPath string) string {
	return fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, escapePath(objectPath))
}

func (s *Supabase) Save(ctx context.Context, objectPath string, data []byte, contentType string) (string, error) {
	target := s.objectURL(objectPath)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, target, bytes.NewReader(data))
	if err != nil {
		return "", err
	}
	req.Header.Set("Authorization", "Bearer "+s.key)
	req.Header.Set("apikey", s.key)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "false")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 512))
		return "", fmt.Errorf("supabase storage menolak unggahan (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return target, nil
}

func (s *Supabase) Remove(ctx context.Context, ref string) error {
	prefix := fmt.Sprintf("%s/storage/v1/object/%s/", s.baseURL, s.bucket)
	if !strings.HasPrefix(ref, prefix) {
		return nil // bukan milik bucket ini
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, ref, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+s.key)
	req.Header.Set("apikey", s.key)
	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}

// ---------- Disk lokal ----------

type Local struct {
	dir string // mis. "uploads/pengumpulan-tugas"
}

func NewLocal(dir string) *Local { return &Local{dir: dir} }

func (l *Local) Save(_ context.Context, objectPath string, data []byte, _ string) (string, error) {
	clean := filepath.Clean(filepath.FromSlash(objectPath))
	if clean == "." || filepath.IsAbs(clean) || strings.HasPrefix(clean, "..") {
		return "", fmt.Errorf("path penyimpanan tidak valid")
	}
	full := filepath.Join(l.dir, clean)
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(full, data, 0o644); err != nil {
		return "", err
	}
	return filepath.ToSlash(full), nil
}

func (l *Local) Remove(_ context.Context, ref string) error {
	root := filepath.ToSlash(filepath.Clean(l.dir)) + "/"
	if !strings.HasPrefix(filepath.ToSlash(ref), root) {
		return nil
	}
	err := os.Remove(filepath.FromSlash(ref))
	if os.IsNotExist(err) {
		return nil
	}
	return err
}
