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

	query := db.Order("created_at DESC")
	if kelasID != "" {
		if kelasUUID, err := uuid.Parse(kelasID); err == nil {
			query = query.Where("kelas_id = ?", kelasUUID)
		}
	}
	if mapelID != "" {
		if mapelUUID, err := uuid.Parse(mapelID); err == nil {
			query = query.Where("mapel_id = ?", mapelUUID)
		}
	}
	if guruID != "" {
		if guruUUID, err := uuid.Parse(guruID); err == nil {
			query = query.Where("guru_id = ?", guruUUID)
		}
	}

	var materiList []model.Materi
	if err := query.Find(&materiList).Error; err != nil {
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
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data materi tidak valid: " + err.Error(),
			Error:   err.Error(),
		})
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
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5") // Bu Irma
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

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // XII IPA 1
	}

	tipeFile := strings.TrimSpace(req.TipeFile)
	if tipeFile == "" {
		tipeFile = strings.TrimSpace(req.Tipe)
	}
	if tipeFile == "" {
		tipeFile = "PDF"
	}

	ukuran := req.UkuranMB
	if ukuran <= 0 {
		ukuran = 3.5
	}

	fileURL := strings.TrimSpace(req.FileURL)
	if fileURL == "" {
		fileURL = "https://storage.sman2padalarang.sch.id/materi/berkas_materi_ajar.pdf"
	}

	newMateri := model.Materi{
		ID:            uuid.New(),
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

	// 1. Validasi UUID Guru Bu Irma
	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")
	}

	// 2. Validasi UUID Mapel Matematika Peminatan
	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001")
		}
	}

	// 3. KUNCI KELAS: Simpan persis sesuai kelas yang dipilih Guru
	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // Default XII IPA 1 jika kosong
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

// 6. GET /api/v1/guru/tugas/:id/submissions - Lembar pengumpulan tugas (Hanya siswa kelas bersangkutan)
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

// 7. GET /api/v1/siswa/tugas - Siswa HANYA BISA MELIHAT tugas dari kelasnya sendiri
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

// 8. PUT /api/v1/guru/submissions/:id/grade - Guru menilai tugas siswa
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

// 9. GET /api/v1/guru/absensi - Rekap presensi siswa kelas
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

// 10. POST /api/v1/guru/absensi - Menyimpan atau memperbarui kehadiran siswa ke Supabase
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

// 11. GET /api/v1/guru/nilai - Mengambil rekap nilai siswa satu kelas dari Supabase
func (h *GuruHandler) GetNilaiList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Database tidak tersedia",
		})
	}

	kelasIDStr := c.Query("kelas_id")
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001") // Default XII IPA 1
	}

	mapelUUID := uuid.MustParse("20000000-0000-0000-0000-000000000001") // MTK Peminatan

	type SiswaNilaiRow struct {
		IDNilaiSiswa string  `json:"id_nilai_siswa"`
		IDSiswa      string  `json:"id_siswa"`
		NIS          string  `json:"nis"`
		NamaSiswa    string  `json:"nama_siswa"`
		IDKelas      string  `json:"id_kelas"`
		NamaKelas    string  `json:"nama_kelas"`
		NilaiTugas   float64 `json:"nilai_tugas"`
		NilaiUH      float64 `json:"nilai_uh"`
		NilaiUTS     float64 `json:"nilai_uts"`
		NilaiUAS     float64 `json:"nilai_uas"`
		NilaiAkhir   float64 `json:"nilai_akhir"`
		SkorHuruf    string  `json:"skor_huruf"`
		Feedback     string  `json:"feedback"`
	}

	var results []SiswaNilaiRow

	query := `
		SELECT 
			s.id as id_siswa,
			s.nis,
			u.nama_lengkap as nama_siswa,
			k.id as id_kelas,
			k.nama_kelas,
			COALESCE(MAX(CASE WHEN n.jenis_penilaian = 'Tugas' THEN n.skor_angka END), 85.0) as nilai_tugas,
			COALESCE(MAX(CASE WHEN n.jenis_penilaian = 'UlanganHarian' THEN n.skor_angka END), 80.0) as nilai_uh,
			COALESCE(MAX(CASE WHEN n.jenis_penilaian = 'UTS' THEN n.skor_angka END), 82.0) as nilai_uts,
			COALESCE(MAX(CASE WHEN n.jenis_penilaian = 'UAS' THEN n.skor_angka END), 88.0) as nilai_uas,
			COALESCE(MAX(n.feedback), 'Pemahaman konsep baik') as feedback
		FROM siswa s
		JOIN users u ON u.id = s.user_id
		JOIN kelas k ON k.id = s.kelas_id
		LEFT JOIN nilai n ON n.siswa_id = s.id AND n.mapel_id = ?
		WHERE s.kelas_id = ?
		GROUP BY s.id, s.nis, u.nama_lengkap, k.id, k.nama_kelas
		ORDER BY u.nama_lengkap ASC
	`

	if err := db.Raw(query, mapelUUID, kelasUUID).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data nilai: " + err.Error(),
		})
	}

	for i := range results {
		na := (results[i].NilaiTugas * 0.2) + (results[i].NilaiUH * 0.2) + (results[i].NilaiUTS * 0.3) + (results[i].NilaiUAS * 0.3)
		results[i].NilaiAkhir = float64(int(na*10)) / 10.0
		switch {
		case na >= 88:
			results[i].SkorHuruf = "A"
		case na >= 78:
			results[i].SkorHuruf = "B"
		case na >= 68:
			results[i].SkorHuruf = "C"
		default:
			results[i].SkorHuruf = "D"
		}
		results[i].IDNilaiSiswa = "val-" + results[i].IDSiswa[:8]
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data nilai siswa berhasil dimuat dari database",
		Data:    results,
	})
}

// 12. POST /api/v1/guru/nilai - Menyimpan input nilai siswa ke tabel nilai di Supabase
func (h *GuruHandler) SaveNilai(c *fiber.Ctx) error {
	var req struct {
		SiswaID    string  `json:"siswa_id"`
		KelasID    string  `json:"kelas_id"`
		NilaiTugas float64 `json:"nilai_tugas"`
		NilaiUH    float64 `json:"nilai_uh"`
		NilaiUTS   float64 `json:"nilai_uts"`
		NilaiUAS   float64 `json:"nilai_uas"`
		Feedback   string  `json:"feedback"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data nilai tidak valid",
		})
	}

	siswaUUID, errSiswa := uuid.Parse(req.SiswaID)
	if errSiswa != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Siswa tidak valid",
		})
	}

	guruUUID := uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")   // Bu Irma
	mapelUUID := uuid.MustParse("20000000-0000-0000-0000-000000000001") // MTK Peminatan

	db := repository.GetDB()
	now := time.Now()

	komponen := []struct {
		Jenis model.JenisPenilaian
		Skor  float64
	}{
		{model.PenilaianTugas, req.NilaiTugas},
		{model.PenilaianUlanganHarian, req.NilaiUH},
		{model.PenilaianUTS, req.NilaiUTS},
		{model.PenilaianUAS, req.NilaiUAS},
	}

	for _, k := range komponen {
		var existing model.Nilai
		errFind := db.Where("siswa_id = ? AND mapel_id = ? AND jenis_penilaian = ?", siswaUUID, mapelUUID, k.Jenis).First(&existing).Error

		skorHuruf := "D"
		if k.Skor >= 85 {
			skorHuruf = "A"
		} else if k.Skor >= 75 {
			skorHuruf = "B"
		} else if k.Skor >= 65 {
			skorHuruf = "C"
		}

		if errFind == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"skor_angka": k.Skor,
				"skor_huruf": skorHuruf,
				"feedback":   req.Feedback,
				"updated_at": now,
			})
		} else {
			newNilai := model.Nilai{
				ID:             uuid.New(),
				SiswaID:        siswaUUID,
				GuruID:         guruUUID,
				MapelID:        mapelUUID,
				JenisPenilaian: k.Jenis,
				SkorAngka:      k.Skor,
				SkorHuruf:      skorHuruf,
				Feedback:       req.Feedback,
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			db.Create(&newNilai)
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai siswa berhasil disimpan ke Supabase",
	})
}