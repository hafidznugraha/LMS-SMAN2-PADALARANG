package handler

import (
	"strings"
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

func (h *GuruHandler) CreateMateri(c *fiber.Ctx) error {
	var req model.CreateMateriRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data materi tidak valid",
			Error:   err.Error(),
		})
	}

	if strings.TrimSpace(req.Judul) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul materi wajib diisi",
		})
	}

	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		var guru model.Guru
		db := repository.GetDB()
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("1ca770d9-0e57-471b-95c2-aedc472da0b9")
		}
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001")
	}

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

	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("1ca770d9-0e57-471b-95c2-aedc472da0b9")
		}
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001")
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
			"2006-01-02T15:04",
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
	newTugas := map[string]interface{}{
		"id":         newID,
		"guru_id":    guruUUID,
		"mapel_id":   mapelUUID,
		"kelas_id":   kelasUUID,
		"judul":      req.Judul,
		"deskripsi":  deskripsi,
		"deadline":   deadlineTime,
		"created_at": now,
	}

	if err := db.Table("tugas").Create(&newTugas).Error; err != nil {
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
				newSub := map[string]interface{}{
					"id":            subUUID,
					"tugas_id":      tugasUUID,
					"siswa_id":      siswaUUID,
					"file_url":      "",
					"catatan":       "",
					"nilai":         req.Nilai,
					"feedback_guru": feedback,
					"status":        "dinilai",
					"submitted_at":  now,
					"graded_at":     &now,
				}
				if err := db.Table("pengumpulan_tugas").Create(&newSub).Error; err != nil {
					return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
						Success: false,
						Message: "Gagal membuat entri penilaian: " + err.Error(),
					})
				}
				existing.ID = subUUID
				existing.TugasID = tugasUUID
				existing.SiswaID = siswaUUID
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

func (h *GuruHandler) GetAbsensiKelas(c *fiber.Ctx) error {
	kelasIDStr := c.Params("kelas_id")
	if kelasIDStr == "" {
		kelasIDStr = c.Query("kelas_id")
	}
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
