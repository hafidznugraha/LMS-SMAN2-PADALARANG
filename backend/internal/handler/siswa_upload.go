package handler

import (
	"net/http"
	"path/filepath"
	"regexp"
	"strings"
)

const maxSubmissionBytes = 50 * 1024 * 1024

var unsafeNameChars = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

func sanitizeSubmissionFilename(name string) string {
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

func detectContentType(ext string, head []byte) (string, bool) {
	switch strings.ToLower(ext) {
	case ".pdf":
		return "application/pdf", true
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document", true
	case ".doc":
		return "application/msword", true
	case ".pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation", true
	case ".ppt":
		return "application/vnd.ms-powerpoint", true
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", true
	case ".xls":
		return "application/vnd.ms-excel", true
	case ".zip":
		return "application/zip", true
	case ".rar":
		return "application/vnd.rar", true
	case ".7z":
		return "application/x-7z-compressed", true
	case ".jpg", ".jpeg":
		return "image/jpeg", true
	case ".png":
		return "image/png", true
	case ".gif":
		return "image/gif", true
	case ".txt":
		return "text/plain; charset=utf-8", true
	case ".csv":
		return "text/csv", true
	}
	if len(head) > 0 {
		ct := http.DetectContentType(head)
		if ct != "" {
			return ct, true
		}
	}
	return "application/octet-stream", true
}

var timestampPrefix = regexp.MustCompile(`^\d{9,}_`)

func displayFileName(fileURL string) string {
	i := strings.LastIndex(fileURL, "/")
	name := fileURL[i+1:]
	return timestampPrefix.ReplaceAllString(name, "")
}
