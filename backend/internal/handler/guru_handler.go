package handler

import (
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type GuruHandler struct {
	cfg *config.Config
}

func NewGuruHandler(cfg *config.Config) *GuruHandler {
	return &GuruHandler{cfg: cfg}
}

// 1. GET /api/v1/guru/materi - Mengambil daftar seluruh materi dari Supabase
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
	guruID := c.Query("guru_id")

	type MateriDetailResponse struct {
		ID            uuid.UUID `json:"id"`
		IDMateri      string    `json:"id_materi"`
		GuruID        uuid.UUID `json:"guru_id"`
		IDGuru        string    `json:"id_guru"`
		MapelID       uuid.UUID `json:"mapel_id"`
		IDMapel       string    `json:"id_mapel"`
		NamaMapel     string    `json:"nama_mapel"`
		KelasID       uuid.UUID `json:"kelas_id"`
		IDKelas       string    `json:"id_kelas"`
		NamaKelas     string    `json:"nama_kelas"`
		Judul         string    `json:"judul"`
		JudulMateri   string    `json:"judul_materi"`
		Deskripsi     string    `json:"deskripsi"`
		FileURL       string    `json:"file_url"`
		TipeFile      string    `json:"tipe_file"`
		FormatFile    string    `json:"format_file"`
		UkuranMB      float64   `json:"ukuran_mb"`
		JumlahMelihat int       `json:"jumlah_melihat"`
		UnduhanCount  int       `json:"unduhan_count"`
		TanggalUnggah string    `json:"tanggal_unggah"`
		CreatedAt     time.Time `json:"created_at"`
	}

	query := db.Table("materi m").
		Select(`
			m.id,
			m.id as id_materi,
			m.guru_id,
			m.guru_id as id_guru,
			m.mapel_id,
			m.mapel_id as id_mapel,
			COALESCE(mp.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			m.kelas_id,
			m.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Semua Kelas') as nama_kelas,
			m.judul,
			m.judul as judul_materi,
			m.deskripsi,
			m.file_url,
			COALESCE(m.tipe_file, 'PDF') as tipe_file,
			COALESCE(m.tipe_file, 'PDF') as format_file,
			COALESCE(m.ukuran_mb, 0) as ukuran_mb,
			COALESCE(m.jumlah_melihat, 0) as jumlah_melihat,
			COALESCE(m.jumlah_melihat, 0) as unduhan_count,
			to_char(m.created_at, 'YYYY-MM-DD HH24:MI') as tanggal_unggah,
			m.created_at
		`).
		Joins("LEFT JOIN mata_pelajaran mp ON mp.id = m.mapel_id").
		Joins("LEFT JOIN kelas k ON k.id = m.kelas_id")

	if kelasUUID, err := uuid.Parse(kelasID); err == nil {
		query = query.Where("m.kelas_id = ?", kelasUUID)
	}
	if mapelUUID, err := uuid.Parse(mapelID); err == nil {
		query = query.Where("m.mapel_id = ?", mapelUUID)
	}
	if guruUUID, err := uuid.Parse(guruID); err == nil {
		query = query.Where("m.guru_id = ?", guruUUID)
	}

	var materiList []MateriDetailResponse
	if err := query.Order("m.created_at DESC").Scan(&materiList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar materi dari Supabase",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar materi berhasil dimuat",
		Data:    materiList,
	})
}

// 2. POST /api/v1/guru/materi - Menyimpan materi baru ke tabel materi di Supabase
func (h *GuruHandler) CreateMateri(c *fiber.Ctx) error {
	var req model.CreateMateriRequest
	_ = c.BodyParser(&req)

	if v := strings.TrimSpace(c.FormValue("judul")); v != "" && req.Judul == "" {
		req.Judul = v
	}
	if v := c.FormValue("deskripsi"); v != "" && req.Deskripsi == "" {
		req.Deskripsi = v
	}
	if v := strings.TrimSpace(c.FormValue("kelas_id")); v != "" && req.KelasID == "" {
		req.KelasID = v
	}
	if v := strings.TrimSpace(c.FormValue("guru_id")); v != "" && req.GuruID == "" {
		req.GuruID = v
	}
	if v := strings.TrimSpace(c.FormValue("mapel_id")); v != "" && req.MapelID == "" {
		req.MapelID = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe_file")); v != "" && req.TipeFile == "" {
		req.TipeFile = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe")); v != "" && req.Tipe == "" {
		req.Tipe = v
	}
	if v := strings.TrimSpace(c.FormValue("file_url")); v != "" && req.FileURL == "" {
		req.FileURL = v
	}

	if strings.TrimSpace(req.Judul) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul materi wajib diisi",
		})
	}

	db := repository.GetDB()

	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5") // Fallback ke Bu Irma
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // Default XII IPA 1
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001") // MTK Peminatan
		}
	}

	tipeFile := strings.TrimSpace(req.TipeFile)
	if tipeFile == "" {
		tipeFile = strings.TrimSpace(req.Tipe)
	}
	if tipeFile == "" {
		tipeFile = "PDF"
	}
	tipeFile = strings.ToUpper(tipeFile)

	ukuran := req.UkuranMB
	if ukuran <= 0 {
		ukuran = 3.5
	}

	fileURL := strings.TrimSpace(req.FileURL)
	if fileURL == "" {
		fileURL = "https://storage.sman2padalarang.sch.id/materi/berkas_materi_ajar.pdf"
	}

	materiID := uuid.New()

	// Simpan berkas fisik ke disk lokal dan upload ke Supabase Storage
	if savedURL, mb, detectedTipe, ok := processMateriUpload(c, h.cfg, materiID, tipeFile); ok {
		fileURL = savedURL
		ukuran = mb
		if detectedTipe != "" {
			tipeFile = detectedTipe
		}
	}

	newMateri := model.Materi{
		ID:            materiID,
		GuruID:        guruUUID,
		MapelID:       mapelUUID,
		KelasID:       kelasUUID,
		Judul:         req.Judul,
		Deskripsi:     req.Deskripsi,
		FileURL:       fileURL,
		TipeFile:      tipeFile,
		UkuranMB:      ukuran,
		JumlahMelihat: 0,
		CreatedAt:     time.Now(),
	}

	if err := db.Create(&newMateri).Error; err != nil {
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

// 3. DELETE /api/v1/guru/materi/:id - Menghapus materi
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

	var materi model.Materi
	if err := db.Where("id = ?", targetID).First(&materi).Error; err == nil {
		// Hapus berkas lokal jika ada
		if matches, errGlob := filepath.Glob(filepath.Join("uploads", "materi", targetID.String()+".*")); errGlob == nil {
			for _, m := range matches {
				_ = os.Remove(m)
			}
		}

		// Hapus berkas dari Supabase Storage jika URL mengarah ke Supabase
		if strings.Contains(materi.FileURL, "/storage/v1/object/public/materi-pelajaran/") {
			parts := strings.Split(materi.FileURL, "/storage/v1/object/public/materi-pelajaran/")
			if len(parts) == 2 && parts[1] != "" {
				deleteFileFromSupabaseStorage(h.cfg, parts[1])
			}
		}
	}

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

// 4. GET /api/v1/guru/tugas - Mengambil daftar tugas (Bisa difilter per kelas)
func (h *GuruHandler) GetTugasList(c *fiber.Ctx) error {
	db := repository.GetDB()
	kelasID := c.Query("kelas_id")
	guruID := c.Query("guru_id")

	var list []model.TugasDetailResponse
	query := db.Table("tugas t").
		Select(`
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%kuis%' THEN 'Kuis'
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			'pdf, docx' as format_file,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) as jumlah_mengumpulkan,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id AND pt.status = 'dinilai') as jumlah_dinilai,
			t.created_at
		`).
		Joins("LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id").
		Joins("LEFT JOIN kelas k ON k.id = t.kelas_id")

	// Filter Kelas: Hanya tampilkan tugas kelas yang diminta
	if kelasUUID, err := uuid.Parse(kelasID); err == nil {
		query = query.Where("t.kelas_id = ?", kelasUUID)
	}

	if guruUUID, err := uuid.Parse(guruID); err == nil {
		query = query.Where("t.guru_id = ?", guruUUID)
	}

	if err := query.Order("t.created_at DESC").Scan(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar tugas",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar tugas berhasil dimuat",
		Data:    list,
	})
}

// 5. POST /api/v1/guru/tugas - Menerbitkan tugas baru (Terkunci ke kelas yang dipilih)
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

	db := repository.GetDB()

	// 1. Validasi UUID Guru
	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5") // Fallback ke Bu Irma jika tidak ada
	}

	// 2. Kunci Kelas yang dipilih Guru
	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // Default XII IPA 1 jika kosong
	}

	// 3. Validasi UUID Mapel
	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001") // MTK Peminatan
		}
	}

	deadlineStr := strings.TrimSpace(req.Deadline)
	if deadlineStr == "" {
		deadlineStr = strings.TrimSpace(req.TenggatWaktu)
	}

	var deadlineTime time.Time
	if deadlineStr != "" {
		layouts := []string{
			"2006-01-02 15:04:05",
			"2006-01-02 15:04",
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05.000Z",
			"2006-01-02T15:04:05Z",
			"2006-01-02",
		}
		for _, layout := range layouts {
			t, errParse := time.Parse(layout, deadlineStr)
			if errParse == nil {
				deadlineTime = t
				break
			}
		}
	}
	if deadlineTime.IsZero() {
		deadlineTime = time.Now().AddDate(0, 0, 7)
	}

	deskripsi := strings.TrimSpace(req.Deskripsi)
	if deskripsi == "" {
		deskripsi = strings.TrimSpace(req.Instruksi)
	}

	newID := uuid.New()
	now := time.Now()
	newTugas := model.Tugas{
		ID:        newID,
		GuruID:    guruUUID,
		MapelID:   mapelUUID,
		KelasID:   kelasUUID, // Terkunci ke kelas ini saja!
		Judul:     req.Judul,
		Deskripsi: deskripsi,
		Deadline:  deadlineTime,
		CreatedAt: now,
	}

	if err := db.Create(&newTugas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan tugas ke Supabase: " + err.Error(),
			Error:   err.Error(),
		})
	}

	var detail model.TugasDetailResponse
	queryDetail := `
		SELECT 
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%kuis%' THEN 'Kuis'
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			'pdf, docx' as format_file,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			0 as jumlah_mengumpulkan,
			0 as jumlah_dinilai,
			t.created_at
		FROM tugas t
		LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id
		LEFT JOIN kelas k ON k.id = t.kelas_id
		WHERE t.id = ?
	`
	_ = db.Raw(queryDetail, newID).Scan(&detail)

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil diterbitkan dan masuk ke Supabase",
		Data:    detail,
	})
}

// 6. PUT /api/v1/guru/tugas/:id - Memperbarui data tugas di Supabase
func (h *GuruHandler) UpdateTugas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	var req model.UpdateTugasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data tugas tidak valid: " + err.Error(),
		})
	}

	db := repository.GetDB()
	var existing model.Tugas
	if err := db.Where("id = ?", targetID).First(&existing).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	if strings.TrimSpace(req.Judul) != "" {
		existing.Judul = strings.TrimSpace(req.Judul)
	}
	deskripsi := strings.TrimSpace(req.Deskripsi)
	if deskripsi == "" {
		deskripsi = strings.TrimSpace(req.Instruksi)
	}
	if deskripsi != "" {
		existing.Deskripsi = deskripsi
	}
	if kelasUUID, err := uuid.Parse(req.KelasID); err == nil && kelasUUID != uuid.Nil {
		existing.KelasID = kelasUUID
	}
	if mapelUUID, err := uuid.Parse(req.MapelID); err == nil && mapelUUID != uuid.Nil {
		existing.MapelID = mapelUUID
	}

	deadlineStr := strings.TrimSpace(req.Deadline)
	if deadlineStr == "" {
		deadlineStr = strings.TrimSpace(req.TenggatWaktu)
	}
	if deadlineStr != "" {
		layouts := []string{
			"2006-01-02 15:04:05",
			"2006-01-02 15:04",
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05.000Z",
			"2006-01-02T15:04:05Z",
			"2006-01-02",
		}
		for _, layout := range layouts {
			t, errParse := time.Parse(layout, deadlineStr)
			if errParse == nil {
				existing.Deadline = t
				break
			}
		}
	}

	if err := db.Save(&existing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui tugas: " + err.Error(),
			Error:   err.Error(),
		})
	}

	var detail model.TugasDetailResponse
	queryDetail := `
		SELECT 
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%kuis%' THEN 'Kuis'
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			'pdf, docx' as format_file,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) as jumlah_mengumpulkan,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id AND pt.status = 'dinilai') as jumlah_dinilai,
			t.created_at
		FROM tugas t
		LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id
		LEFT JOIN kelas k ON k.id = t.kelas_id
		WHERE t.id = ?
	`
	_ = db.Raw(queryDetail, targetID).Scan(&detail)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil diperbarui",
		Data:    detail,
	})
}

// 7. DELETE /api/v1/guru/tugas/:id - Menghapus tugas dan pengumpulan terkait
func (h *GuruHandler) DeleteTugas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	db := repository.GetDB()

	// Hapus seluruh pengumpulan tugas terlebih dahulu jika ada
	_ = db.Where("tugas_id = ?", targetID).Delete(&model.PengumpulanTugas{}).Error

	// Hapus tugas
	res := db.Delete(&model.Tugas{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus tugas: " + res.Error.Error(),
			Error:   res.Error.Error(),
		})
	}
	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil dihapus",
	})
}

// 8. GET /api/v1/guru/tugas/:id/submissions - Lembar pengumpulan tugas (Hanya siswa kelas bersangkutan)
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

	// ISOLASI KETAT: JOIN siswa s ON s.kelas_id = t.kelas_id (Hanya siswa dari kelas tugas ini)
	query := `
		SELECT 
			COALESCE(pt.id, gen_random_uuid()) as id,
			COALESCE(pt.id, gen_random_uuid()) as id_pengumpulan,
			t.id as tugas_id,
			t.id as id_tugas_kuis,
			s.id as siswa_id,
			s.id as id_siswa,
			u.nama_lengkap as nama_siswa,
			s.nis,
			k.nama_kelas,
			COALESCE(pt.file_url, '') as file_tugas,
			COALESCE(NULLIF(regexp_replace(pt.file_url, '^.*/', ''), ''), '') as file_name,
			COALESCE(pt.catatan, '') as catatan_siswa,
			COALESCE(pt.submitted_at, t.created_at) as waktu_kirim,
			COALESCE(to_char(pt.submitted_at, 'YYYY-MM-DD HH24:MI:SS'), '') as tanggal_kumpul,
			pt.nilai,
			COALESCE(pt.feedback_guru, '') as catatan_guru,
			COALESCE(pt.feedback_guru, '') as feedback_guru,
			COALESCE(pt.feedback_guru, '') as feedback,
			CASE 
				WHEN pt.id IS NULL THEN 'Belum Mengumpulkan'
				WHEN pt.submitted_at <= t.deadline THEN 'Tepat Waktu'
				ELSE 'Terlambat'
			END as status_penilaian,
			CASE 
				WHEN pt.id IS NULL THEN 'Belum Mengumpulkan'
				WHEN pt.submitted_at <= t.deadline THEN 'Tepat Waktu'
				ELSE 'Terlambat'
			END as status_kumpul
		FROM tugas t
		JOIN kelas k ON k.id = t.kelas_id
		JOIN siswa s ON s.kelas_id = t.kelas_id
		JOIN users u ON u.id = s.user_id
		LEFT JOIN pengumpulan_tugas pt ON pt.tugas_id = t.id AND pt.siswa_id = s.id
		WHERE t.id = ?
		ORDER BY u.nama_lengkap ASC
	`

	if err := db.Raw(query, tugasUUID).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat lembar jawaban siswa",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data pengumpulan tugas berhasil dimuat",
		Data:    results,
	})
}

// 9. GET /api/v1/siswa/tugas - Siswa HANYA BISA MELIHAT tugas dari kelasnya sendiri
func (h *GuruHandler) GetTugasSiswa(c *fiber.Ctx) error {
	kelasIDStr := c.Query("kelas_id")
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas siswa wajib disertakan",
		})
	}

	db := repository.GetDB()
	var listTugas []model.Tugas

	// ISOLASI KETAT SISWA: Hanya ambil tugas yang t.kelas_id = kelas_id siswa!
	if err := db.Where("kelas_id = ?", kelasUUID).Order("deadline ASC").Find(&listTugas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat tugas siswa",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar tugas kelas siswa berhasil dimuat",
		Data:    listTugas,
	})
}

// 10. PUT /api/v1/guru/submissions/:id/grade - Guru menilai tugas siswa
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

	feedback := strings.TrimSpace(req.FeedbackGuru)
	if feedback == "" {
		feedback = strings.TrimSpace(req.Feedback)
	}
	if feedback == "" {
		feedback = strings.TrimSpace(req.CatatanGuru)
	}
	if feedback == "" {
		feedback = strings.TrimSpace(req.Catatan)
	}

	now := time.Now()
	db := repository.GetDB()

	var existing model.PengumpulanTugas
	checkErr := db.Where("id = ?", subUUID).First(&existing).Error

	if checkErr != nil {
		tugasUUID, errT := uuid.Parse(req.TugasID)
		siswaUUID, errS := uuid.Parse(req.SiswaID)
		if errT == nil && errS == nil {
			var bySiswa model.PengumpulanTugas
			if db.Where("tugas_id = ? AND siswa_id = ?", tugasUUID, siswaUUID).First(&bySiswa).Error == nil {
				subUUID = bySiswa.ID
				existing = bySiswa
				checkErr = nil
			} else {
				newSub := model.PengumpulanTugas{
					ID:           subUUID,
					TugasID:      tugasUUID,
					SiswaID:      siswaUUID,
					FileURL:      "",
					Catatan:      "",
					Nilai:        &req.Nilai,
					FeedbackGuru: feedback,
					Status:       "dinilai",
					SubmittedAt:  now,
					GradedAt:     &now,
				}
				if err := db.Create(&newSub).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
						Success: false,
						Message: "Gagal membuat entri penilaian: " + err.Error(),
					})
				}
				existing = newSub
				checkErr = nil
			}
		}
	}

	if checkErr == nil {
		res := db.Model(&model.PengumpulanTugas{}).
			Where("id = ?", subUUID).
			Updates(map[string]interface{}{
				"nilai":         req.Nilai,
				"feedback_guru": feedback,
				"status":        "dinilai",
				"graded_at":     &now,
			})
		if res.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menyimpan penilaian: " + res.Error.Error(),
			})
		}
	} else {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data pengumpulan tugas tidak ditemukan",
		})
	}

	var tugas model.Tugas
	if err := db.Where("id = ?", existing.TugasID).First(&tugas).Error; err == nil {
		var nilaiRecord model.Nilai
		skorHuruf := "E"
		switch {
		case req.Nilai >= 85:
			skorHuruf = "A"
		case req.Nilai >= 75:
			skorHuruf = "B"
		case req.Nilai >= 65:
			skorHuruf = "C"
		case req.Nilai >= 50:
			skorHuruf = "D"
		}

		errNilai := db.Where("siswa_id = ? AND mapel_id = ? AND jenis_penilaian = ?", existing.SiswaID, tugas.MapelID, model.PenilaianTugas).First(&nilaiRecord).Error
		if errNilai == nil {
			db.Model(&nilaiRecord).Updates(map[string]interface{}{
				"skor_angka": req.Nilai,
				"skor_huruf": skorHuruf,
				"feedback":   feedback,
				"updated_at": now,
			})
		} else {
			newNilai := model.Nilai{
				ID:             uuid.New(),
				SiswaID:        existing.SiswaID,
				GuruID:         tugas.GuruID,
				MapelID:        tugas.MapelID,
				JenisPenilaian: model.PenilaianTugas,
				SkorAngka:      req.Nilai,
				SkorHuruf:      skorHuruf,
				Feedback:       feedback,
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			_ = db.Create(&newNilai).Error
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai dan umpan balik berhasil disimpan",
		Data: map[string]interface{}{
			"id":            subUUID,
			"nilai":         req.Nilai,
			"feedback_guru": feedback,
			"status":        "dinilai",
			"graded_at":     now,
		},
	})
}

// 11. GET /api/v1/guru/absensi - Rekap presensi siswa kelas
func (h *GuruHandler) GetAbsensiKelas(c *fiber.Ctx) error {
	kelasIDStr := c.Params("kelas_id")
	if kelasIDStr == "" {
		kelasIDStr = c.Query("kelas_id")
	}
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // Default XII IPA 1
	}

	tanggal := c.Query("tanggal", time.Now().Format("2006-01-02"))

	db := repository.GetDB()
	type AbsensiRow struct {
		ID                   uuid.UUID `json:"id"`
		IDAbsensi            string    `json:"id_absensi"`
		SiswaID              uuid.UUID `json:"siswa_id"`
		IDSiswa              string    `json:"id_siswa"`
		NamaSiswa            string    `json:"nama_siswa"`
		NIS                  string    `json:"nis"`
		KelasID              uuid.UUID `json:"kelas_id"`
		IDKelas              string    `json:"id_kelas"`
		Tanggal              string    `json:"tanggal"`
		Waktu                string    `json:"waktu"`
		StatusKehadiran      string    `json:"status_kehadiran"`
		Keterangan           string    `json:"keterangan"`
		DiverifikasiOlehGuru bool      `json:"diverifikasi_oleh_guru"`
	}

	var rows []AbsensiRow
	errQuery := db.Raw(`
		SELECT 
			a.id,
			a.id as id_absensi,
			a.siswa_id,
			a.siswa_id as id_siswa,
			u.nama_lengkap as nama_siswa,
			s.nis,
			a.kelas_id,
			a.kelas_id as id_kelas,
			a.tanggal,
			to_char(a.created_at, 'HH24:MI:SS') as waktu,
			CASE 
				WHEN LOWER(a.status) = 'hadir' THEN 'Hadir'
				WHEN LOWER(a.status) = 'sakit' THEN 'Sakit'
				WHEN LOWER(a.status) = 'izin' THEN 'Izin'
				ELSE 'Alfa'
			END as status_kehadiran,
			COALESCE(a.keterangan, '') as keterangan,
			true as diverifikasi_oleh_guru
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

	if len(rows) == 0 {
		var siswaInKelas []struct {
			ID        uuid.UUID `json:"id"`
			NamaSiswa string    `json:"nama_siswa"`
			NIS       string    `json:"nis"`
		}
		db.Raw(`
			SELECT s.id, u.nama_lengkap as nama_siswa, s.nis
			FROM siswa s
			JOIN users u ON u.id = s.user_id
			WHERE s.kelas_id = ?
			ORDER BY u.nama_lengkap ASC
		`, kelasUUID).Scan(&siswaInKelas)

		for _, s := range siswaInKelas {
			newID := uuid.New()
			rows = append(rows, AbsensiRow{
				ID:                   newID,
				IDAbsensi:            newID.String(),
				SiswaID:              s.ID,
				IDSiswa:              s.ID.String(),
				NamaSiswa:            s.NamaSiswa,
				NIS:                  s.NIS,
				KelasID:              kelasUUID,
				IDKelas:              kelasUUID.String(),
				Tanggal:              tanggal,
				Waktu:                "07:00:00",
				StatusKehadiran:      "Hadir",
				Keterangan:           "-",
				DiverifikasiOlehGuru: true,
			})
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data absensi kelas berhasil dimuat",
		Data:    rows,
	})
}

// 12. POST & PUT /api/v1/guru/absensi - Menyimpan atau memperbarui kehadiran siswa ke Supabase
func (h *GuruHandler) SaveOrUpdateAbsensi(c *fiber.Ctx) error {
	var req struct {
		AbsensiID string `json:"absensi_id"`
		SiswaID   string `json:"siswa_id"`
		KelasID   string `json:"kelas_id"`
		Tanggal   string `json:"tanggal"`
		Status    string `json:"status"`
		Catatan   string `json:"catatan"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload presensi tidak valid",
		})
	}

	statusClean := strings.ToLower(strings.TrimSpace(req.Status))
	if statusClean == "alfa" {
		statusClean = "alpa"
	}

	tanggalStr := strings.TrimSpace(req.Tanggal)
	if tanggalStr == "" {
		tanggalStr = time.Now().Format("2006-01-02")
	}
	tglParsed, _ := time.Parse("2006-01-02", tanggalStr)

	db := repository.GetDB()

	if req.AbsensiID != "" {
		if absenUUID, err := uuid.Parse(req.AbsensiID); err == nil {
			errUpdate := db.Model(&model.Absensi{}).
				Where("id = ?", absenUUID).
				Updates(map[string]interface{}{
					"status":  statusClean,
					"catatan": req.Catatan,
				}).Error

			if errUpdate == nil {
				return c.JSON(model.APIResponse{
					Success: true,
					Message: "Status presensi berhasil diperbarui di Supabase",
				})
			}
		}
	}

	siswaUUID, errSiswa := uuid.Parse(req.SiswaID)
	kelasUUID, errKelas := uuid.Parse(req.KelasID)
	if errKelas != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001")
	}

	if errSiswa == nil {
		var existing model.Absensi
		errFind := db.Where("siswa_id = ? AND kelas_id = ? AND tanggal = ?", siswaUUID, kelasUUID, tglParsed).First(&existing).Error

		if errFind == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"status":  statusClean,
				"catatan": req.Catatan,
			})
			return c.JSON(model.APIResponse{
				Success: true,
				Message: "Presensi siswa berhasil diperbarui",
				Data:    existing,
			})
		} else {
			nowTime := time.Now().Format("15:04:05")
			newAbsen := model.Absensi{
				ID:         uuid.New(),
				SiswaID:    siswaUUID,
				KelasID:    kelasUUID,
				Tanggal:    tglParsed,
				WaktuMasuk: &nowTime,
				Status:     model.AbsensiStatus(statusClean),
				Catatan:    req.Catatan,
				CreatedAt:  time.Now(),
			}
			if err := db.Create(&newAbsen).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal menyimpan presensi baru: " + err.Error(),
				})
			}
			return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
				Success: true,
				Message: "Presensi baru siswa berhasil masuk ke Supabase",
				Data:    newAbsen,
			})
		}
	}

	return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
		Success: false,
		Message: "ID Siswa wajib valid",
	})
}

// 13. GET /api/v1/guru/nilai - Mengambil rekap nilai siswa satu kelas dari Supabase
type NilaiSiswaResponse struct {
	IDNilai     string  `json:"id_nilai"`
	IDSiswa     string  `json:"id_siswa"`
	NamaSiswa   string  `json:"nama_siswa"`
	NIS         string  `json:"nis"`
	IDGuru      string  `json:"id_guru"`
	IDMapel     string  `json:"id_mapel"`
	IDKelas     string  `json:"id_kelas"`
	NilaiTugas  float64 `json:"nilai_tugas"`
	NilaiUH     float64 `json:"nilai_uh"`
	NilaiUTS    float64 `json:"nilai_uts"`
	NilaiUAS    float64 `json:"nilai_uas"`
	NilaiAkhir  float64 `json:"nilai_akhir"`
	SkorHuruf   string  `json:"skor_huruf"`
	Feedback    string  `json:"feedback"`
	StatusKunci string  `json:"status_kunci"`
}

func (h *GuruHandler) GetNilaiList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasIDStr := c.Query("kelas_id")
	if kelasIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Parameter kelas_id wajib disertakan",
		})
	}
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format kelas_id tidak valid",
		})
	}

	mapelIDStr := c.Query("mapel_id")
	guruIDStr := c.Query("guru_id")

	type StudentRow struct {
		ID        uuid.UUID `json:"id"`
		NamaSiswa string    `json:"nama_siswa"`
		NIS       string    `json:"nis"`
		KelasID   uuid.UUID `json:"kelas_id"`
	}

	var students []StudentRow
	if err := db.Table("siswa s").
		Select("s.id, u.nama_lengkap as nama_siswa, s.nis, s.kelas_id").
		Joins("JOIN users u ON u.id = s.user_id").
		Where("s.kelas_id = ?", kelasUUID).
		Order("u.nama_lengkap ASC").
		Scan(&students).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat siswa kelas",
			Error:   err.Error(),
		})
	}

	results := make([]NilaiSiswaResponse, 0, len(students))
	for _, st := range students {
		var nilaiList []model.Nilai
		q := db.Where("siswa_id = ?", st.ID)
		if mUUID, err := uuid.Parse(mapelIDStr); err == nil {
			q = q.Where("mapel_id = ?", mUUID)
		}
		if gUUID, err := uuid.Parse(guruIDStr); err == nil {
			q = q.Where("guru_id = ?", gUUID)
		}
		_ = q.Find(&nilaiList).Error

		var tugas, uh, uts, uas float64
		var feedback string
		var firstID uuid.UUID
		for _, n := range nilaiList {
			if firstID == uuid.Nil {
				firstID = n.ID
			}
			switch n.JenisPenilaian {
			case model.PenilaianTugas:
				tugas = n.SkorAngka
			case model.PenilaianUlanganHarian:
				uh = n.SkorAngka
			case model.PenilaianUTS:
				uts = n.SkorAngka
			case model.PenilaianUAS:
				uas = n.SkorAngka
			}
			if n.Feedback != "" {
				feedback = n.Feedback
			}
		}

		if tugas == 0 {
			var avgTugas float64
			db.Raw(`
				SELECT COALESCE(AVG(pt.nilai), 0)
				FROM pengumpulan_tugas pt
				JOIN tugas t ON t.id = pt.tugas_id
				WHERE pt.siswa_id = ? AND pt.nilai IS NOT NULL
			`, st.ID).Scan(&avgTugas)
			if avgTugas > 0 {
				tugas = math.Round(avgTugas*10) / 10
			}
		}

		finalScore := math.Round((0.3*tugas+0.2*uh+0.25*uts+0.25*uas)*10) / 10
		skorHuruf := "D"
		if finalScore >= 85 {
			skorHuruf = "A"
		} else if finalScore >= 75 {
			skorHuruf = "B"
		} else if finalScore >= 60 {
			skorHuruf = "C"
		}

		if firstID == uuid.Nil {
			firstID = uuid.New()
		}

		results = append(results, NilaiSiswaResponse{
			IDNilai:     firstID.String(),
			IDSiswa:     st.ID.String(),
			NamaSiswa:   st.NamaSiswa,
			NIS:         st.NIS,
			IDGuru:      guruIDStr,
			IDMapel:     mapelIDStr,
			IDKelas:     st.KelasID.String(),
			NilaiTugas:  tugas,
			NilaiUH:     uh,
			NilaiUTS:    uts,
			NilaiUAS:    uas,
			NilaiAkhir:  finalScore,
			SkorHuruf:   skorHuruf,
			Feedback:    feedback,
			StatusKunci: "Draf",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar nilai berhasil dimuat",
		Data:    results,
	})
}

// 14. PUT & POST /api/v1/guru/nilai - Menyimpan input nilai siswa ke tabel nilai di Supabase
type UpdateNilaiRequest struct {
	SiswaID    string  `json:"siswa_id"`
	GuruID     string  `json:"guru_id"`
	MapelID    string  `json:"mapel_id"`
	NilaiTugas float64 `json:"nilai_tugas"`
	NilaiUH    float64 `json:"nilai_uh"`
	NilaiUTS   float64 `json:"nilai_uts"`
	NilaiUAS   float64 `json:"nilai_uas"`
	Feedback   string  `json:"feedback"`
}

func (h *GuruHandler) UpdateNilai(c *fiber.Ctx) error {
	var req UpdateNilaiRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload tidak valid",
		})
	}

	siswaUUID, errS := uuid.Parse(req.SiswaID)
	if errS != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Siswa tidak valid",
		})
	}

	db := repository.GetDB()
	var guruUUID, mapelUUID uuid.UUID
	var errG, errM error
	if req.GuruID != "" {
		guruUUID, errG = uuid.Parse(req.GuruID)
	}
	if req.MapelID != "" {
		mapelUUID, errM = uuid.Parse(req.MapelID)
	}

	if errG != nil || guruUUID == uuid.Nil {
		var guru model.Guru
		if err := db.First(&guru).Error; err == nil {
			guruUUID = guru.ID
			if guru.MapelID != nil {
				mapelUUID = *guru.MapelID
			}
		}
	}

	if errM != nil || mapelUUID == uuid.Nil {
		var mapel model.MataPelajaran
		if err := db.First(&mapel).Error; err == nil {
			mapelUUID = mapel.ID
		}
	}

	saveOrUpdate := func(jp model.JenisPenilaian, skor float64) {
		skorHuruf := "D"
		if skor >= 85 {
			skorHuruf = "A"
		} else if skor >= 75 {
			skorHuruf = "B"
		} else if skor >= 60 {
			skorHuruf = "C"
		}

		var existing model.Nilai
		if err := db.Where("siswa_id = ? AND mapel_id = ? AND jenis_penilaian = ?", siswaUUID, mapelUUID, jp).First(&existing).Error; err == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"skor_angka": skor,
				"skor_huruf": skorHuruf,
				"feedback":   req.Feedback,
				"updated_at": time.Now(),
			})
		} else {
			db.Create(&model.Nilai{
				ID:             uuid.New(),
				SiswaID:        siswaUUID,
				GuruID:         guruUUID,
				MapelID:        mapelUUID,
				JenisPenilaian: jp,
				SkorAngka:      skor,
				SkorHuruf:      skorHuruf,
				Feedback:       req.Feedback,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			})
		}
	}

	saveOrUpdate(model.PenilaianTugas, req.NilaiTugas)
	saveOrUpdate(model.PenilaianUlanganHarian, req.NilaiUH)
	saveOrUpdate(model.PenilaianUTS, req.NilaiUTS)
	saveOrUpdate(model.PenilaianUAS, req.NilaiUAS)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai siswa berhasil disimpan",
	})
}
