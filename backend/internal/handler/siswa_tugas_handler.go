package handler

import (
	"fmt"
	"io"
	"log"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/storage"
)

const submissionBucket = "pengumpulan-tugas"

var disallowedSubmissionExt = map[string]bool{
	".exe": true, ".bat": true, ".cmd": true, ".sh": true, ".vbs": true, ".msi": true,
}

// newSubmissionStore memilih Supabase Storage bila kuncinya diisi,
// selain itu menyimpan ke disk lokal (untuk pengembangan).
func newSubmissionStore(cfg *config.Config) storage.Store {
	key := strings.TrimSpace(cfg.SupabasePublishable)
	if key == "" {
		key = strings.TrimSpace(cfg.SupabaseSecretKey)
	}
	if key != "" && !strings.HasSuffix(key, "...") && cfg.SupabaseURL != "" {
		log.Println("[INFO] Penyimpanan pengumpulan tugas: Supabase Storage (bucket " + submissionBucket + ")")
		return storage.NewSupabase(cfg.SupabaseURL, key, submissionBucket)
	}
	log.Println("[WARN] Supabase key kosong: pengumpulan tugas disimpan ke disk lokal (uploads/" + submissionBucket + ")")
	return storage.NewLocal("uploads/" + submissionBucket)
}

type tugasRow struct {
	ID         uuid.UUID  `gorm:"column:id"`
	Judul      string     `gorm:"column:judul"`
	Deskripsi  string     `gorm:"column:deskripsi"`
	NamaMapel  string     `gorm:"column:nama_mapel"`
	NamaGuru   string     `gorm:"column:nama_guru"`
	Deadline   time.Time  `gorm:"column:deadline"`
	PID        string     `gorm:"column:p_id"`
	PFileURL   string     `gorm:"column:p_file_url"`
	PCatatan   string     `gorm:"column:p_catatan"`
	PNilai     *float64   `gorm:"column:p_nilai"`
	PFeedback  string     `gorm:"column:p_feedback"`
	PStatus    string     `gorm:"column:p_status"`
	PSubmitted *time.Time `gorm:"column:p_submitted_at"`
	PGraded    *time.Time `gorm:"column:p_graded_at"`
}

// GET /api/v1/siswa/tugas
// Mengembalikan semua tugas kelas siswa beserta status pengumpulannya.
// Pemisahan tab (aktif / dikumpulkan) dilakukan di frontend.
func (h *SiswaHandler) GetTugasList(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	items := []model.SiswaTugasItem{}
	if siswa.KelasID == nil {
		return c.JSON(model.APIResponse{Success: true, Message: "Siswa belum ditempatkan di kelas", Data: items})
	}

	var rows []tugasRow
	if err := db.Raw(`
		SELECT
			t.id,
			t.judul,
			COALESCE(t.deskripsi, '') AS deskripsi,
			mp.nama_mapel,
			u.nama_lengkap AS nama_guru,
			t.deadline,
			COALESCE(p.id::text, '') AS p_id,
			COALESCE(p.file_url, '') AS p_file_url,
			COALESCE(p.catatan, '') AS p_catatan,
			p.nilai AS p_nilai,
			COALESCE(p.feedback_guru, '') AS p_feedback,
			COALESCE(p.status, '') AS p_status,
			p.submitted_at AS p_submitted_at,
			p.graded_at AS p_graded_at
		FROM tugas t
		JOIN mata_pelajaran mp ON mp.id = t.mapel_id
		JOIN guru g ON g.id = t.guru_id
		JOIN users u ON u.id = g.user_id
		LEFT JOIN pengumpulan_tugas p ON p.tugas_id = t.id AND p.siswa_id = ?
		WHERE t.kelas_id = ?
		ORDER BY t.deadline ASC
		LIMIT 200`, siswa.ID, *siswa.KelasID).Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat daftar tugas",
			Error:   err.Error(),
		})
	}

	now := time.Now()
	for _, r := range rows {
		item := model.SiswaTugasItem{
			ID:            r.ID,
			Judul:         r.Judul,
			Deskripsi:     r.Deskripsi,
			NamaMapel:     r.NamaMapel,
			NamaGuru:      r.NamaGuru,
			Deadline:      r.Deadline,
			Status:        "belum",
			LewatDeadline: now.After(r.Deadline),
		}
		if r.PID != "" {
			pid, _ := uuid.Parse(r.PID)
			status := "dikumpulkan"
			if r.PNilai != nil || r.PStatus == "dinilai" {
				status = "dinilai"
			}
			p := &model.SiswaPengumpulan{
				ID:           pid,
				NamaFile:     displayFileName(r.PFileURL),
				Catatan:      r.PCatatan,
				Nilai:        r.PNilai,
				FeedbackGuru: r.PFeedback,
				Status:       status,
				GradedAt:     r.PGraded,
			}
			if r.PSubmitted != nil {
				p.SubmittedAt = *r.PSubmitted
			}
			item.Status = status
			item.Pengumpulan = p
		} else {
			item.Mendesak = !item.LewatDeadline && r.Deadline.Sub(now) <= 48*time.Hour
		}
		items = append(items, item)
	}

	return c.JSON(model.APIResponse{Success: true, Message: "Daftar tugas berhasil dimuat", Data: items})
}

type uploadedFile struct {
	Data        []byte
	Name        string
	ContentType string
}

// readSubmissionFile membaca dan memvalidasi field multipart "file".
// Mengembalikan (file, "", "") bila sukses, atau (nil, kode, pesan) bila gagal.
// Bila required=false dan tidak ada file, hasilnya (nil, "", "").
func readSubmissionFile(c *fiber.Ctx, required bool) (*uploadedFile, string, string) {
	fh, err := c.FormFile("file")
	if err != nil {
		if required {
			return nil, "FILE_REQUIRED", "File jawaban wajib diunggah"
		}
		return nil, "", ""
	}
	if fh.Size > maxSubmissionBytes {
		return nil, "FILE_TOO_LARGE", "Ukuran file maksimal 50 MB"
	}
	ext := strings.ToLower(filepath.Ext(fh.Filename))
	if disallowedSubmissionExt[ext] {
		return nil, "FILE_TYPE_INVALID", "Format file executable tidak diizinkan demi keamanan"
	}

	f, err := fh.Open()
	if err != nil {
		return nil, "FILE_REQUIRED", "File tidak dapat dibaca"
	}
	defer f.Close()

	data, err := io.ReadAll(io.LimitReader(f, maxSubmissionBytes+1))
	if err != nil {
		return nil, "FILE_REQUIRED", "File tidak dapat dibaca"
	}
	if len(data) > maxSubmissionBytes {
		return nil, "FILE_TOO_LARGE", "Ukuran file maksimal 10 MB"
	}
	if len(data) == 0 {
		return nil, "FILE_REQUIRED", "File kosong"
	}

	head := data
	if len(head) > 16 {
		head = head[:16]
	}
	ct, ok := detectContentType(ext, head)
	if !ok {
		return nil, "FILE_TYPE_INVALID", "Isi file tidak sesuai dengan ekstensinya"
	}
	return &uploadedFile{Data: data, Name: sanitizeSubmissionFilename(fh.Filename), ContentType: ct}, "", ""
}

func respondUploadError(c *fiber.Ctx, code, msg string) error {
	status := fiber.StatusBadRequest
	switch code {
	case "FILE_TOO_LARGE":
		status = fiber.StatusRequestEntityTooLarge
	case "FILE_TYPE_INVALID":
		status = fiber.StatusUnsupportedMediaType
	}
	return c.Status(status).JSON(model.APIResponse{Success: false, Message: msg, Error: code})
}

func respondDeadlineExpired(c *fiber.Ctx) error {
	return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
		Success: false,
		Message: "Batas waktu pengumpulan telah berakhir",
		Error:   "DEADLINE_EXPIRED",
	})
}

func toPengumpulanDTO(p model.PengumpulanTugas) model.SiswaPengumpulan {
	return model.SiswaPengumpulan{
		ID:           p.ID,
		NamaFile:     displayFileName(p.FileURL),
		Catatan:      p.Catatan,
		Nilai:        p.Nilai,
		FeedbackGuru: p.FeedbackGuru,
		Status:       p.Status,
		SubmittedAt:  p.SubmittedAt,
		GradedAt:     p.GradedAt,
	}
}

// POST /api/v1/siswa/tugas/:id/submit  (multipart: file, catatan)
func (h *SiswaHandler) SubmitTugas(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	tugasID, perr := uuid.Parse(c.Params("id"))
	if perr != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "ID tugas tidak valid"})
	}

	// Siswa hanya boleh mengumpulkan tugas kelasnya sendiri.
	var tugas model.Tugas
	q := db.Where("id = ?", tugasID)
	if siswa.KelasID != nil {
		q = q.Where("kelas_id = ?", *siswa.KelasID)
	} else {
		q = q.Where("1 = 0")
	}
	if err := q.First(&tugas).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{Success: false, Message: "Tugas tidak ditemukan"})
	}

	if time.Now().After(tugas.Deadline) {
		return respondDeadlineExpired(c)
	}

	var sudah int64
	db.Model(&model.PengumpulanTugas{}).
		Where("tugas_id = ? AND siswa_id = ?", tugas.ID, siswa.ID).Count(&sudah)
	if sudah > 0 {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas ini sudah dikumpulkan. Gunakan fitur ganti jawaban.",
			Error:   "ALREADY_SUBMITTED",
		})
	}

	file, code, msg := readSubmissionFile(c, true)
	if code != "" {
		return respondUploadError(c, code, msg)
	}

	catatan := strings.TrimSpace(c.FormValue("catatan"))
	if len([]rune(catatan)) > 500 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "Catatan maksimal 500 karakter"})
	}

	now := time.Now()
	objectPath := fmt.Sprintf("%s/%s/%d_%s", tugas.ID, siswa.ID, now.Unix(), file.Name)
	ref, err := h.store.Save(c.UserContext(), objectPath, file.Data, file.ContentType)
	if err != nil {
		log.Printf("[WARN] simpan ke Supabase Storage gagal (%v), fallback menyimpan ke disk lokal...", err)
		fallbackStore := storage.NewLocal("uploads/" + submissionBucket)
		ref, err = fallbackStore.Save(c.UserContext(), objectPath, file.Data, file.ContentType)
		if err != nil {
			log.Printf("[ERROR] simpan file pengumpulan ke disk lokal juga gagal: %v", err)
			return c.Status(fiber.StatusBadGateway).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menyimpan file ke penyimpanan. Coba lagi.",
			})
		}
		if !strings.HasPrefix(ref, "/") {
			ref = "/" + ref
		}
	}

	sub := model.PengumpulanTugas{
		TugasID:     tugas.ID,
		SiswaID:     siswa.ID,
		FileURL:     ref,
		Catatan:     catatan,
		Status:      "dikumpulkan",
		SubmittedAt: now,
	}
	if err := db.Create(&sub).Error; err != nil {
		_ = h.store.Remove(c.UserContext(), ref)
		if strings.Contains(err.Error(), "uq_siswa_tugas") {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Tugas ini sudah dikumpulkan",
				Error:   "ALREADY_SUBMITTED",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan pengumpulan tugas",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil dikumpulkan",
		Data:    toPengumpulanDTO(sub),
	})
}

// PUT /api/v1/siswa/submissions/:id  (multipart: file opsional, catatan)
// Hanya boleh sebelum deadline dan sebelum dinilai guru.
func (h *SiswaHandler) UpdatePengumpulan(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	subID, perr := uuid.Parse(c.Params("id"))
	if perr != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "ID pengumpulan tidak valid"})
	}

	var sub model.PengumpulanTugas
	if err := db.Where("id = ? AND siswa_id = ?", subID, siswa.ID).First(&sub).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{Success: false, Message: "Pengumpulan tidak ditemukan"})
	}

	var tugas model.Tugas
	if err := db.First(&tugas, "id = ?", sub.TugasID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{Success: false, Message: "Tugas tidak ditemukan"})
	}
	if time.Now().After(tugas.Deadline) {
		return respondDeadlineExpired(c)
	}
	if sub.Nilai != nil || sub.Status == "dinilai" {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: "Jawaban sudah dinilai guru dan tidak dapat diubah",
			Error:   "ALREADY_GRADED",
		})
	}

	file, code, msg := readSubmissionFile(c, false)
	if code != "" {
		return respondUploadError(c, code, msg)
	}

	catatan := strings.TrimSpace(c.FormValue("catatan"))
	if len([]rune(catatan)) > 500 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "Catatan maksimal 500 karakter"})
	}

	now := time.Now()
	oldRef := sub.FileURL
	updates := map[string]interface{}{
		"catatan":      catatan,
		"submitted_at": now,
		"status":       "dikumpulkan",
	}

	var newRef string
	if file != nil {
		objectPath := fmt.Sprintf("%s/%s/%d_%s", tugas.ID, siswa.ID, now.Unix(), file.Name)
		newRef, err = h.store.Save(c.UserContext(), objectPath, file.Data, file.ContentType)
		if err != nil {
			log.Printf("[WARN] simpan pembaruan ke Supabase Storage gagal (%v), fallback ke disk lokal...", err)
			fallbackStore := storage.NewLocal("uploads/" + submissionBucket)
			newRef, err = fallbackStore.Save(c.UserContext(), objectPath, file.Data, file.ContentType)
			if err != nil {
				log.Printf("[ERROR] simpan file pembaruan ke disk lokal juga gagal: %v", err)
				return c.Status(fiber.StatusBadGateway).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal menyimpan file ke penyimpanan. Coba lagi.",
				})
			}
			if !strings.HasPrefix(newRef, "/") {
				newRef = "/" + newRef
			}
		}
		updates["file_url"] = newRef
	}

	if err := db.Model(&model.PengumpulanTugas{}).Where("id = ?", sub.ID).Updates(updates).Error; err != nil {
		if newRef != "" {
			_ = h.store.Remove(c.UserContext(), newRef)
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui pengumpulan tugas",
			Error:   err.Error(),
		})
	}
	if newRef != "" && oldRef != "" {
		_ = h.store.Remove(c.UserContext(), oldRef) // hapus file lama, kegagalan diabaikan
	}

	sub.Catatan = catatan
	sub.SubmittedAt = now
	sub.Status = "dikumpulkan"
	if newRef != "" {
		sub.FileURL = newRef
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Jawaban berhasil diperbarui",
		Data:    toPengumpulanDTO(sub),
	})
}
