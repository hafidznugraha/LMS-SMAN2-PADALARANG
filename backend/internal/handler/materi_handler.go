package handler

import (
	"bytes"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

var nonAlnumRegex = regexp.MustCompile(`[^a-zA-Z0-9_-]+`)

func sanitizeFilename(title string) string {
	clean := strings.TrimSpace(title)
	clean = nonAlnumRegex.ReplaceAllString(clean, "_")
	clean = strings.Trim(clean, "_")
	if clean == "" {
		return "Materi_SMAN2_Padalarang"
	}
	return clean
}

func mimeTypeByExt(ext string) string {
	switch strings.ToLower(strings.TrimPrefix(ext, ".")) {
	case "pdf":
		return "application/pdf"
	case "docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case "pptx":
		return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
	case "mp4":
		return "video/mp4"
	case "txt":
		return "text/plain"
	default:
		return "application/octet-stream"
	}
}

func uploadFileToSupabaseStorage(cfg *config.Config, filename string, data []byte, mimeType string) (publicURL string, err error) {
	if cfg == nil || cfg.SupabaseURL == "" || cfg.SupabasePublishable == "" {
		return "", fmt.Errorf("konfigurasi Supabase tidak lengkap")
	}

	uploadEndpoint := fmt.Sprintf("%s/storage/v1/object/materi-pelajaran/%s", strings.TrimRight(cfg.SupabaseURL, "/"), filename)
	req, err := http.NewRequest(http.MethodPost, uploadEndpoint, bytes.NewReader(data))
	if err != nil {
		return "", err
	}

	req.Header.Set("apikey", cfg.SupabasePublishable)
	req.Header.Set("Authorization", "Bearer "+cfg.SupabasePublishable)
	req.Header.Set("Content-Type", mimeType)
	req.Header.Set("x-upsert", "true")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("supabase storage error (status %d): %s", resp.StatusCode, string(respBody))
	}

	publicURL = fmt.Sprintf("%s/storage/v1/object/public/materi-pelajaran/%s", strings.TrimRight(cfg.SupabaseURL, "/"), filename)
	return publicURL, nil
}

func deleteFileFromSupabaseStorage(cfg *config.Config, filename string) {
	if cfg == nil || cfg.SupabaseURL == "" || cfg.SupabasePublishable == "" || filename == "" {
		return
	}

	deleteEndpoint := fmt.Sprintf("%s/storage/v1/object/materi-pelajaran/%s", strings.TrimRight(cfg.SupabaseURL, "/"), filename)
	req, err := http.NewRequest(http.MethodDelete, deleteEndpoint, nil)
	if err != nil {
		return
	}
	req.Header.Set("apikey", cfg.SupabasePublishable)
	req.Header.Set("Authorization", "Bearer "+cfg.SupabasePublishable)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err == nil && resp != nil {
		_ = resp.Body.Close()
	}
}

func processMateriUpload(c *fiber.Ctx, cfg *config.Config, materiID uuid.UUID, fallbackExt string) (fileURL string, ukuranMB float64, detectedTipe string, ok bool) {
	fileHeader, err := c.FormFile("file")
	if err != nil || fileHeader == nil || fileHeader.Size == 0 {
		return "", 0, "", false
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		ext = "." + strings.ToLower(strings.TrimPrefix(fallbackExt, "."))
	}
	if ext == "." {
		ext = ".pdf"
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", 0, "", false
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil || len(data) == 0 {
		return "", 0, "", false
	}

	storageFilename := fmt.Sprintf("%s%s", materiID.String(), ext)
	mime := mimeTypeByExt(ext)

	uploadDir := filepath.Join("uploads", "materi")
	if err := os.MkdirAll(uploadDir, 0755); err == nil {
		destPath := filepath.Join(uploadDir, storageFilename)
		_ = os.WriteFile(destPath, data, 0644)
	}

	supabasePublicURL, errSupabase := uploadFileToSupabaseStorage(cfg, storageFilename, data, mime)
	if errSupabase == nil && supabasePublicURL != "" {
		fileURL = supabasePublicURL
	} else {
		fileURL = "/uploads/materi/" + storageFilename
	}

	mb := math.Round((float64(fileHeader.Size)/(1024.0*1024.0))*100) / 100
	if mb < 0.1 {
		mb = 0.1
	}

	detectedTipe = strings.ToUpper(strings.TrimPrefix(ext, "."))
	return fileURL, mb, detectedTipe, true
}

func (h *GuruHandler) UpdateMateri(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID materi tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var existing model.Materi
	if err := db.Where("id = ?", targetID).First(&existing).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Materi tidak ditemukan",
		})
	}

	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		if existing.GuruID != callerGuruUUID {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki izin untuk mengedit materi milik guru lain",
			})
		}
	}

	var req model.UpdateMateriRequest
	_ = c.BodyParser(&req)

	if v := strings.TrimSpace(c.FormValue("judul")); v != "" {
		req.Judul = v
	}
	if v := c.FormValue("deskripsi"); v != "" {
		req.Deskripsi = v
	}
	if v := strings.TrimSpace(c.FormValue("kelas_id")); v != "" {
		req.KelasID = v
	}
	if v := strings.TrimSpace(c.FormValue("mapel_id")); v != "" {
		req.MapelID = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe_file")); v != "" {
		req.TipeFile = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe")); v != "" && req.TipeFile == "" {
		req.TipeFile = strings.ToUpper(v)
	}
	if v := strings.TrimSpace(c.FormValue("file_url")); v != "" {
		req.FileURL = v
	}
	if v := strings.TrimSpace(c.FormValue("ukuran_mb")); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil && parsed > 0 {
			req.UkuranMB = parsed
		}
	}

	if strings.TrimSpace(req.Judul) != "" {
		existing.Judul = strings.TrimSpace(req.Judul)
	}
	if req.Deskripsi != "" || c.FormValue("deskripsi") != "" {
		existing.Deskripsi = req.Deskripsi
	}
	if strings.TrimSpace(req.KelasID) != "" {
		kelasUUID, err := uuid.Parse(strings.TrimSpace(req.KelasID))
		if err != nil || kelasUUID == uuid.Nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "ID kelas tidak valid",
			})
		}
		if !h.isCallerKurikulum(c) {
			checkGuruUUID := existing.GuruID
			if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
				checkGuruUUID = callerGuruUUID
			}
			var countJadwal int64
			if err := db.Model(&model.JadwalPelajaran{}).Where("guru_id = ? AND kelas_id = ?", checkGuruUUID, kelasUUID).Count(&countJadwal).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal memverifikasi wewenang kelas mengajar",
					Error:   err.Error(),
				})
			}
			if countJadwal == 0 {
				return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
					Success: false,
					Message: "Anda tidak memiliki jadwal mengajar resmi pada kelas yang dipilih",
				})
			}
		}
		existing.KelasID = kelasUUID
	}
	if mapelUUID, err := uuid.Parse(strings.TrimSpace(req.MapelID)); err == nil {
		existing.MapelID = mapelUUID
	}
	if strings.TrimSpace(req.TipeFile) != "" {
		existing.TipeFile = strings.ToUpper(strings.TrimSpace(req.TipeFile))
	}
	if req.UkuranMB > 0 {
		existing.UkuranMB = req.UkuranMB
	}
	if strings.TrimSpace(req.FileURL) != "" {
		existing.FileURL = strings.TrimSpace(req.FileURL)
	}

	cfg := h.cfg
	if cfg == nil {
		cfg = config.LoadConfig()
	}

	if newURL, mb, detectedTipe, ok := processMateriUpload(c, cfg, existing.ID, existing.TipeFile); ok {
		existing.FileURL = newURL
		existing.UkuranMB = mb
		if detectedTipe != "" {
			existing.TipeFile = detectedTipe
		}
	}

	if err := db.Save(&existing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui materi di database: " + err.Error(),
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Materi berhasil diperbarui",
		Data:    existing,
	})
}

func (h *GuruHandler) DownloadMateri(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID materi tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var materi model.Materi
	if err := db.Where("id = ?", targetID).First(&materi).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Materi tidak ditemukan",
		})
	}

	cleanBaseName := sanitizeFilename(materi.Judul)
	disposition := "attachment"
	if c.Query("inline") == "true" || c.Query("disposition") == "inline" {
		disposition = "inline"
	}

	var candidatePaths []string
	if strings.HasPrefix(materi.FileURL, "/uploads/materi/") || strings.HasPrefix(materi.FileURL, "uploads/materi/") {
		rel := strings.TrimPrefix(materi.FileURL, "/")
		candidatePaths = append(candidatePaths, filepath.FromSlash(rel))
	}
	if matches, err := filepath.Glob(filepath.Join("uploads", "materi", targetID.String()+".*")); err == nil {
		candidatePaths = append(candidatePaths, matches...)
	}

	for _, p := range candidatePaths {
		if info, err := os.Stat(p); err == nil && !info.IsDir() && info.Size() > 0 {
			fileBytes, readErr := os.ReadFile(p)
			if readErr == nil && len(fileBytes) > 0 {
				ext := strings.ToLower(filepath.Ext(p))
				if ext == "" {
					ext = "." + strings.ToLower(materi.TipeFile)
				}
				downloadFilename := fmt.Sprintf("%s%s", cleanBaseName, ext)
				c.Set("Content-Type", mimeTypeByExt(ext))
				c.Set("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, downloadFilename))
				c.Set("Content-Length", strconv.Itoa(len(fileBytes)))
				c.Set("Cache-Control", "no-store")
				return c.Status(fiber.StatusOK).Send(fileBytes)
			}
		}
	}

	if strings.HasPrefix(materi.FileURL, "http://") || strings.HasPrefix(materi.FileURL, "https://") {
		client := &http.Client{Timeout: 8 * time.Second}
		resp, err := client.Get(materi.FileURL)
		if err == nil && resp.StatusCode == http.StatusOK {
			data, errRead := io.ReadAll(resp.Body)
			resp.Body.Close()
			if errRead == nil && len(data) > 0 {
				ext := strings.ToLower(filepath.Ext(strings.Split(materi.FileURL, "?")[0]))
				if ext == "" {
					ext = strings.ToLower(materi.TipeFile)
					if !strings.HasPrefix(ext, ".") {
						ext = "." + ext
					}
				}
				if ext == "." || ext == "" {
					ext = ".pdf"
				}

				downloadFilename := fmt.Sprintf("%s%s", cleanBaseName, ext)
				c.Set("Content-Type", mimeTypeByExt(ext))
				c.Set("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, downloadFilename))
				c.Set("Content-Length", strconv.Itoa(len(data)))
				c.Set("Cache-Control", "no-store")
				return c.Status(fiber.StatusOK).Send(data)
			}
		}
	}

	namaKelas := "XII IPA 1"
	var kelas model.Kelas
	if err := db.Where("id = ?", materi.KelasID).First(&kelas).Error; err == nil && kelas.NamaKelas != "" {
		namaKelas = kelas.NamaKelas
	}

	namaMapel := "Matematika Peminatan"
	var mapel model.MataPelajaran
	if err := db.Where("id = ?", materi.MapelID).First(&mapel).Error; err == nil && mapel.NamaMapel != "" {
		namaMapel = mapel.NamaMapel
	}

	namaGuru := "Irma Satikarama S.Pd"
	var guru model.Guru
	if err := db.Preload("User").Where("id = ?", materi.GuruID).First(&guru).Error; err == nil && guru.User.NamaLengkap != "" {
		namaGuru = guru.User.NamaLengkap
	}

	formatUpper := strings.ToUpper(strings.TrimSpace(materi.TipeFile))
	if formatUpper == "DOCX" {
		docxBytes := GenerateMateriDOCX(materi.Judul, namaMapel, namaKelas, materi.Deskripsi, namaGuru)
		downloadFilename := fmt.Sprintf("%s.docx", cleanBaseName)
		c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
		c.Set("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, downloadFilename))
		c.Set("Content-Length", strconv.Itoa(len(docxBytes)))
		c.Set("Cache-Control", "no-store")
		return c.Status(fiber.StatusOK).Send(docxBytes)
	}

	pdfBytes := GenerateMateriPDF(materi.Judul, namaMapel, namaKelas, materi.Deskripsi, namaGuru)
	downloadFilename := fmt.Sprintf("%s.pdf", cleanBaseName)
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf(`%s; filename="%s"`, disposition, downloadFilename))
	c.Set("Content-Length", strconv.Itoa(len(pdfBytes)))
	c.Set("Cache-Control", "no-store")
	return c.Status(fiber.StatusOK).Send(pdfBytes)
}
