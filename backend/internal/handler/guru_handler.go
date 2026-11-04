package handler

import (
	"strings" // <--- PASTIKAN BARIS INI ADA
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type GuruHandler struct{}

func NewGuruHandler() *GuruHandler {
	return &GuruHandler{}
}

// ==========================================
// 1. MODUL MATERI PEMBELAJARAN (FR-MAT-01 s/d 03)
// ==========================================

// GetMateriList: Mengambil daftar materi (bisa filter ?kelas_id=... & mapel_id=...)
func (h *GuruHandler) GetMateriList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasID := c.Query("kelas_id")
	mapelID := c.Query("mapel_id")

	query := db.Order("created_at DESC")
	if kelasID != "" {
		query = query.Where("kelas_id = ?", kelasID)
	}
	if mapelID != "" {
		query = query.Where("mapel_id = ?", mapelID)
	}

	var materiList []model.Materi
	if err := query.Find(&materiList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar materi",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar materi berhasil dimuat",
		Data:    materiList,
	})
}

// 2. POST /api/v1/guru/materi
func (h *GuruHandler) CreateMateri(c *fiber.Ctx) error {
	var req model.CreateMateriRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data materi tidak valid",
			Error:   err.Error(),
		})
	}

	if req.Judul == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul materi wajib diisi",
		})
	}

	// Gunakan ID default Bu Irma & Kelas XII IPA 1 yang valid di Supabase jika kosong
	if req.GuruID == "" {
		req.GuruID = "298257fb-b4aa-4710-afaa-bbfd63abd5c5"
	}
	if req.MapelID == "" {
		req.MapelID = "20000000-0000-0000-0000-000000000001"
	}
	if req.KelasID == "" {
		req.KelasID = "f0000000-0000-0000-0000-000000000001"
	}

	guruUUID, _ := uuid.Parse(req.GuruID)
	mapelUUID, _ := uuid.Parse(req.MapelID)
	kelasUUID, _ := uuid.Parse(req.KelasID)

	db := repository.GetDB()
	newMateri := map[string]interface{}{
		"id":         uuid.New(),
		"guru_id":    guruUUID,
		"mapel_id":   mapelUUID,
		"kelas_id":   kelasUUID,
		"judul":      req.Judul,
		"deskripsi":  req.Deskripsi,
		"tipe":       req.Tipe,
		"file_url":   req.FileURL,
		"created_at": time.Now(),
	}

	if err := db.Table("materi").Create(&newMateri).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan materi ke Supabase: " + err.Error(),
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Materi berhasil ditambahkan ke Supabase",
		Data:    newMateri,
	})
}

// DeleteMateri: Menghapus materi
func (h *GuruHandler) DeleteMateri(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID materi tidak valid",
		})
	}

	db := repository.GetDB()
	res := db.Delete(&model.Materi{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus materi",
			Error:   res.Error.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Materi berhasil dihapus",
	})
}

// ==========================================
// 2. MODUL TUGAS & PENILAIAN SISWA (FR-TG-01, 04)
// ==========================================

// GetTugasList: Mengambil daftar tugas yang dibuat guru
func (h *GuruHandler) GetTugasList(c *fiber.Ctx) error {
	db := repository.GetDB()
	kelasID := c.Query("kelas_id")

	query := db.Order("deadline DESC")
	if kelasID != "" {
		query = query.Where("kelas_id = ?", kelasID)
	}

	var tugasList []model.Tugas
	if err := query.Find(&tugasList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar tugas",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar tugas berhasil dimuat",
		Data:    tugasList,
	})
}

// 5. POST /api/v1/guru/tugas
func (h *GuruHandler) CreateTugas(c *fiber.Ctx) error {
	var req model.CreateTugasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data tugas tidak valid: " + err.Error(),
		})
	}

	if strings.TrimSpace(req.Judul) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul tugas wajib diisi",
		})
	}

	// 1. Validasi & Mapping ke UUID Supabase Bu Irma & Kelas XII IPA 1 yang sah
	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5") // ID Guru Bu Irma
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001") // ID Matematika Peminatan
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // ID Kelas XII IPA 1
	}

	// 2. Parsing Waktu Deadline
	var deadlineTime time.Time
	deadlineTime, err = time.Parse("2006-01-02 15:04:05", strings.TrimSpace(req.Deadline))
	if err != nil {
		deadlineTime, err = time.Parse("2006-01-02 15:04", strings.TrimSpace(req.Deadline))
		if err != nil {
			deadlineTime, err = time.Parse("2006-01-02", strings.TrimSpace(req.Deadline))
			if err != nil {
				deadlineTime = time.Now().AddDate(0, 0, 7) // Default 7 hari ke depan jika format tanggal bebas
			}
		}
	}

	db := repository.GetDB()
	newTugas := map[string]interface{}{
		"id":         uuid.New(),
		"guru_id":    guruUUID,
		"mapel_id":   mapelUUID,
		"kelas_id":   kelasUUID,
		"judul":      req.Judul,
		"deskripsi":  req.Deskripsi,
		"deadline":   deadlineTime,
		"created_at": time.Now(),
	}

	// 3. Simpan langsung ke tabel tugas di Supabase
	if err := db.Table("tugas").Create(&newTugas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan tugas ke Supabase: " + err.Error(),
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil diterbitkan dan masuk ke Supabase",
		Data:    newTugas,
	})
}

// GetTugasSubmissions: Melihat lembar pengumpulan tugas siswa dalam satu kelas
func (h *GuruHandler) GetTugasSubmissions(c *fiber.Ctx) error {
	tugasIDStr := c.Params("id")
	tugasUUID, err := uuid.Parse(tugasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	db := repository.GetDB()
	var results []model.SubmissionWithSiswa

	errQuery := db.Raw(`
		SELECT pt.*, u.nama_lengkap as nama_siswa, s.nis
		FROM pengumpulan_tugas pt
		JOIN siswa s ON s.id = pt.siswa_id
		JOIN users u ON u.id = s.user_id
		WHERE pt.tugas_id = ?
		ORDER BY pt.submitted_at ASC
	`, tugasUUID).Scan(&results).Error

	if errQuery != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat lembar jawaban siswa",
			Error:   errQuery.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data pengumpulan tugas berhasil dimuat",
		Data:    results,
	})
}

// GradeSubmission: Guru memberikan nilai angka (0-100) dan umpan balik
func (h *GuruHandler) GradeSubmission(c *fiber.Ctx) error {
	subIDStr := c.Params("id")
	subUUID, err := uuid.Parse(subIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengumpulan tidak valid",
		})
	}

	var req model.GradeSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload penilaian tidak valid",
		})
	}

	if req.Nilai < 0 || req.Nilai > 100 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Skor nilai harus berada pada rentang 0 sampai 100",
		})
	}

	now := time.Now()
	db := repository.GetDB()

	res := db.Model(&model.PengumpulanTugas{}).
		Where("id = ?", subUUID).
		Updates(map[string]interface{}{
			"nilai":         req.Nilai,
			"feedback_guru": req.FeedbackGuru,
			"status":        "dinilai",
			"graded_at":     &now,
		})

	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan penilaian",
			Error:   res.Error.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai dan umpan balik berhasil disimpan",
	})
}

// ==========================================
// 3. MODUL PRESENSI & ABSENSI SISWA (FR-ABS-03)
// ==========================================

// GetAbsensiKelas: Guru memeriksa kehadiran siswa di kelas hari ini
func (h *GuruHandler) GetAbsensiKelas(c *fiber.Ctx) error {
	kelasIDStr := c.Params("kelas_id")
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}

	tanggal := c.Query("tanggal", time.Now().Format("2006-01-02"))

	db := repository.GetDB()
	type AbsensiRow struct {
		model.Absensi
		NamaSiswa string `json:"nama_siswa"`
		NIS       string `json:"nis"`
	}

	var rows []AbsensiRow
	errQuery := db.Raw(`
		SELECT a.*, u.nama_lengkap as nama_siswa, s.nis
		FROM absensi a
		JOIN siswa s ON s.id = a.siswa_id
		JOIN users u ON u.id = s.user_id
		WHERE a.kelas_id = ? AND a.tanggal = ?
		ORDER BY u.nama_lengkap ASC
	`, kelasUUID, tanggal).Scan(&rows).Error

	if errQuery != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data absensi kelas",
			Error:   errQuery.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data absensi kelas berhasil dimuat",
		Data:    rows,
	})
}

// UpdateAbsensi: Guru memvalidasi/koreksi status presensi siswa (Sequence 28)
func (h *GuruHandler) UpdateAbsensi(c *fiber.Ctx) error {
	absenIDStr := c.Params("id")
	absenUUID, err := uuid.Parse(absenIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID absensi tidak valid",
		})
	}

	var req model.UpdateAbsensiStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload tidak valid",
		})
	}

	db := repository.GetDB()
	res := db.Model(&model.Absensi{}).
		Where("id = ?", absenUUID).
		Updates(map[string]interface{}{
			"status":  req.Status,
			"catatan": req.Catatan,
		})

	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui status presensi",
			Error:   res.Error.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Status kehadiran berhasil divalidasi oleh guru",
	})
}