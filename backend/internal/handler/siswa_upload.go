package handler

import (
	"bytes"
	"path/filepath"
	"regexp"
	"strings"
)

const maxSubmissionBytes = 10 * 1024 * 1024 // 10 MB

var unsafeNameChars = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

// sanitizeFilename membuat nama file aman untuk path penyimpanan.
func sanitizeFilename(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, `\`, "/"))
	ext := strings.ToLower(filepath.Ext(name))
	base := strings.TrimSuffix(name, filepath.Ext(name))
	base = unsafeNameChars.ReplaceAllString(base, "_")
	base = strings.Trim(base, "._-")
	if base == "" {
		base = "jawaban"
	}
	if len(base) > 80 {
		base = base[:80]
	}
	return base + ext
}

// detectContentType memeriksa ekstensi yang diizinkan dan mencocokkannya
// dengan magic bytes isi file. Mengembalikan content-type bila cocok.
func detectContentType(ext string, head []byte) (string, bool) {
	switch strings.ToLower(ext) {
	case ".pdf":
		return "application/pdf", bytes.HasPrefix(head, []byte("%PDF-"))
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			bytes.HasPrefix(head, []byte("PK\x03\x04"))
	case ".zip":
		return "application/zip", bytes.HasPrefix(head, []byte("PK\x03\x04"))
	case ".jpg", ".jpeg":
		return "image/jpeg", bytes.HasPrefix(head, []byte{0xFF, 0xD8, 0xFF})
	case ".png":
		return "image/png", bytes.HasPrefix(head, []byte("\x89PNG\r\n\x1a\n"))
	}
	return "", false
}

var timestampPrefix = regexp.MustCompile(`^\d{9,}_`)

// displayFileName mengambil nama file dari file_url dan membuang awalan timestamp.
func displayFileName(fileURL string) string {
	i := strings.LastIndex(fileURL, "/")
	name := fileURL[i+1:]
	return timestampPrefix.ReplaceAllString(name, "")
}
