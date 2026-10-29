package handler

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type JadwalHandler struct{}

func NewJadwalHandler() *JadwalHandler {
	return &JadwalHandler{}
}

type ConflictInfo struct {
	ID         uuid.UUID `json:"id"`
	Hari       string    `json:"hari"`
	JamMulai   string    `json:"jam_mulai"`
	JamSelesai string    `json:"jam_selesai"`
	Ruang      string    `json:"ruang"`
	NamaKelas  string    `json:"nama_kelas"`
	NamaMapel  string    `json:"nama_mapel"`
	GuruNama   string    `json:"guru_nama"`
}

func (h *JadwalHandler) GetJadwalList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasID := c.Query("kelas_id")
	guruID := c.Query("guru_id")
	hari := c.Query("hari")

	query := db.Preload("Kelas").
		Preload("Guru.User").
		Preload("Mapel").
		Order("CASE hari " +
			"WHEN 'Senin' THEN 1 " +
			"WHEN 'Selasa' THEN 2 " +
			"WHEN 'Rabu' THEN 3 " +
			"WHEN 'Kamis' THEN 4 " +
			"WHEN 'Jumat' THEN 5 " +
			"WHEN 'Sabtu' THEN 6 " +
			"ELSE 7 END, jam_mulai ASC")

	if kelasID != "" {
		query = query.Where("kelas_id = ?", kelasID)
	}
	if guruID != "" {
		query = query.Where("guru_id = ?", guruID)
	}
	if hari != "" {
		query = query.Where("hari = ?", hari)
	}

	var list []model.JadwalPelajaran
	if err := query.Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data jadwal pelajaran",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data jadwal pelajaran berhasil dimuat",
		Data:    list,
	})
}

func (h *JadwalHandler) CreateJadwal(c *fiber.Ctx) error {
	var req model.CreateJadwalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}
	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID guru tidak valid",
		})
	}
	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID mata pelajaran tidak valid",
		})
	}

	req.Hari = strings.TrimSpace(req.Hari)
	req.JamMulai = strings.TrimSpace(req.JamMulai)
	req.JamSelesai = strings.TrimSpace(req.JamSelesai)

	if req.Hari == "" || req.JamMulai == "" || req.JamSelesai == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Hari, jam mulai, dan jam selesai wajib diisi",
		})
	}

	if req.JamMulai >= req.JamSelesai {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Jam mulai harus lebih awal dari jam selesai",
		})
	}

	if req.Ruang == "" {
		req.Ruang = "Kelas Reguler"
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var guruConflict ConflictInfo
	errGuru := db.Raw(`
		SELECT j.id, j.hari, j.jam_mulai, j.jam_selesai, j.ruang,
		       k.nama_kelas, m.nama_mapel, u.nama_lengkap as guru_nama
		FROM jadwal_pelajaran j
		JOIN guru g ON g.id = j.guru_id
		JOIN users u ON u.id = g.user_id
		JOIN kelas k ON k.id = j.kelas_id
		JOIN mata_pelajaran m ON m.id = j.mapel_id
		WHERE j.guru_id = ?
		  AND j.hari = ?
		  AND j.jam_mulai < ?
		  AND j.jam_selesai > ?
		LIMIT 1
	`, guruUUID, req.Hari, req.JamSelesai, req.JamMulai).Scan(&guruConflict).Error

	if errGuru == nil && guruConflict.ID != uuid.Nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: fmt.Sprintf("Konflik Jadwal Guru: %s sudah memiliki jadwal mengajar %s di kelas %s pada %s, %s - %s",
				guruConflict.GuruNama, guruConflict.NamaMapel, guruConflict.NamaKelas, guruConflict.Hari, guruConflict.JamMulai, guruConflict.JamSelesai),
			Error: "GURU_SCHEDULE_CONFLICT",
			Data: fiber.Map{
				"conflict_type": "guru",
				"guru":          guruConflict.GuruNama,
				"mapel":         guruConflict.NamaMapel,
				"kelas":         guruConflict.NamaKelas,
				"hari":          guruConflict.Hari,
				"waktu":         fmt.Sprintf("%s - %s", guruConflict.JamMulai, guruConflict.JamSelesai),
			},
		})
	}

	var kelasConflict ConflictInfo
	errKelas := db.Raw(`
		SELECT j.id, j.hari, j.jam_mulai, j.jam_selesai, j.ruang,
		       k.nama_kelas, m.nama_mapel, u.nama_lengkap as guru_nama
		FROM jadwal_pelajaran j
		JOIN guru g ON g.id = j.guru_id
		JOIN users u ON u.id = g.user_id
		JOIN kelas k ON k.id = j.kelas_id
		JOIN mata_pelajaran m ON m.id = j.mapel_id
		WHERE j.kelas_id = ?
		  AND j.hari = ?
		  AND j.jam_mulai < ?
		  AND j.jam_selesai > ?
		LIMIT 1
	`, kelasUUID, req.Hari, req.JamSelesai, req.JamMulai).Scan(&kelasConflict).Error

	if errKelas == nil && kelasConflict.ID != uuid.Nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: fmt.Sprintf("Konflik Jadwal Kelas: Kelas %s sudah memiliki jadwal %s (%s) pada %s, %s - %s",
				kelasConflict.NamaKelas, kelasConflict.NamaMapel, kelasConflict.GuruNama, kelasConflict.Hari, kelasConflict.JamMulai, kelasConflict.JamSelesai),
			Error: "KELAS_SCHEDULE_CONFLICT",
			Data: fiber.Map{
				"conflict_type": "kelas",
				"guru":          kelasConflict.GuruNama,
				"mapel":         kelasConflict.NamaMapel,
				"kelas":         kelasConflict.NamaKelas,
				"hari":          kelasConflict.Hari,
				"waktu":         fmt.Sprintf("%s - %s", kelasConflict.JamMulai, kelasConflict.JamSelesai),
			},
		})
	}

	if req.Ruang != "Kelas Reguler" && req.Ruang != "" {
		var ruangConflict ConflictInfo
		errRuang := db.Raw(`
			SELECT j.id, j.hari, j.jam_mulai, j.jam_selesai, j.ruang,
			       k.nama_kelas, m.nama_mapel, u.nama_lengkap as guru_nama
			FROM jadwal_pelajaran j
			JOIN guru g ON g.id = j.guru_id
			JOIN users u ON u.id = g.user_id
			JOIN kelas k ON k.id = j.kelas_id
			JOIN mata_pelajaran m ON m.id = j.mapel_id
			WHERE j.ruang = ?
			  AND j.hari = ?
			  AND j.jam_mulai < ?
			  AND j.jam_selesai > ?
			LIMIT 1
		`, req.Ruang, req.Hari, req.JamSelesai, req.JamMulai).Scan(&ruangConflict).Error

		if errRuang == nil && ruangConflict.ID != uuid.Nil {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: fmt.Sprintf("Konflik Ruangan: %s sedang digunakan oleh kelas %s untuk pelajaran %s pada %s, %s - %s",
					ruangConflict.Ruang, ruangConflict.NamaKelas, ruangConflict.NamaMapel, ruangConflict.Hari, ruangConflict.JamMulai, ruangConflict.JamSelesai),
				Error: "ROOM_SCHEDULE_CONFLICT",
				Data: fiber.Map{
					"conflict_type": "ruang",
					"ruang":         ruangConflict.Ruang,
					"kelas":         ruangConflict.NamaKelas,
					"mapel":         ruangConflict.NamaMapel,
					"hari":          ruangConflict.Hari,
					"waktu":         fmt.Sprintf("%s - %s", ruangConflict.JamMulai, ruangConflict.JamSelesai),
				},
			})
		}
	}

	newJadwal := model.JadwalPelajaran{
		KelasID:    kelasUUID,
		GuruID:     guruUUID,
		MapelID:    mapelUUID,
		Hari:       req.Hari,
		JamMulai:   req.JamMulai,
		JamSelesai: req.JamSelesai,
		Ruang:      req.Ruang,
	}

	if err := db.Create(&newJadwal).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan jadwal pelajaran",
			Error:   err.Error(),
		})
	}

	_ = db.Preload("Kelas").Preload("Guru.User").Preload("Mapel").First(&newJadwal, "id = ?", newJadwal.ID)

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Jadwal pelajaran berhasil ditambahkan",
		Data:    newJadwal,
	})
}

func (h *JadwalHandler) UpdateJadwal(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID jadwal tidak valid",
		})
	}

	var req model.UpdateJadwalRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}
	guruUUID, err := uuid.Parse(req.GuruID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID guru tidak valid",
		})
	}
	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID mata pelajaran tidak valid",
		})
	}

	req.Hari = strings.TrimSpace(req.Hari)
	req.JamMulai = strings.TrimSpace(req.JamMulai)
	req.JamSelesai = strings.TrimSpace(req.JamSelesai)

	if req.JamMulai >= req.JamSelesai {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Jam mulai harus lebih awal dari jam selesai",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var existing model.JadwalPelajaran
	if err := db.First(&existing, "id = ?", targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Jadwal pelajaran tidak ditemukan",
		})
	}

	var guruConflict ConflictInfo
	errGuru := db.Raw(`
		SELECT j.id, j.hari, j.jam_mulai, j.jam_selesai, j.ruang,
		       k.nama_kelas, m.nama_mapel, u.nama_lengkap as guru_nama
		FROM jadwal_pelajaran j
		JOIN guru g ON g.id = j.guru_id
		JOIN users u ON u.id = g.user_id
		JOIN kelas k ON k.id = j.kelas_id
		JOIN mata_pelajaran m ON m.id = j.mapel_id
		WHERE j.guru_id = ?
		  AND j.hari = ?
		  AND j.jam_mulai < ?
		  AND j.jam_selesai > ?
		  AND j.id != ?
		LIMIT 1
	`, guruUUID, req.Hari, req.JamSelesai, req.JamMulai, targetID).Scan(&guruConflict).Error

	if errGuru == nil && guruConflict.ID != uuid.Nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: fmt.Sprintf("Konflik Jadwal Guru: %s sudah memiliki jadwal mengajar %s di kelas %s pada %s, %s - %s",
				guruConflict.GuruNama, guruConflict.NamaMapel, guruConflict.NamaKelas, guruConflict.Hari, guruConflict.JamMulai, guruConflict.JamSelesai),
			Error: "GURU_SCHEDULE_CONFLICT",
			Data: fiber.Map{
				"conflict_type": "guru",
				"guru":          guruConflict.GuruNama,
				"mapel":         guruConflict.NamaMapel,
				"kelas":         guruConflict.NamaKelas,
				"hari":          guruConflict.Hari,
				"waktu":         fmt.Sprintf("%s - %s", guruConflict.JamMulai, guruConflict.JamSelesai),
			},
		})
	}

	var kelasConflict ConflictInfo
	errKelas := db.Raw(`
		SELECT j.id, j.hari, j.jam_mulai, j.jam_selesai, j.ruang,
		       k.nama_kelas, m.nama_mapel, u.nama_lengkap as guru_nama
		FROM jadwal_pelajaran j
		JOIN guru g ON g.id = j.guru_id
		JOIN users u ON u.id = g.user_id
		JOIN kelas k ON k.id = j.kelas_id
		JOIN mata_pelajaran m ON m.id = j.mapel_id
		WHERE j.kelas_id = ?
		  AND j.hari = ?
		  AND j.jam_mulai < ?
		  AND j.jam_selesai > ?
		  AND j.id != ?
		LIMIT 1
	`, kelasUUID, req.Hari, req.JamSelesai, req.JamMulai, targetID).Scan(&kelasConflict).Error

	if errKelas == nil && kelasConflict.ID != uuid.Nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: fmt.Sprintf("Konflik Jadwal Kelas: Kelas %s sudah memiliki jadwal %s (%s) pada %s, %s - %s",
				kelasConflict.NamaKelas, kelasConflict.NamaMapel, kelasConflict.GuruNama, kelasConflict.Hari, kelasConflict.JamMulai, kelasConflict.JamSelesai),
			Error: "KELAS_SCHEDULE_CONFLICT",
			Data: fiber.Map{
				"conflict_type": "kelas",
				"guru":          kelasConflict.GuruNama,
				"mapel":         kelasConflict.NamaMapel,
				"kelas":         kelasConflict.NamaKelas,
				"hari":          kelasConflict.Hari,
				"waktu":         fmt.Sprintf("%s - %s", kelasConflict.JamMulai, kelasConflict.JamSelesai),
			},
		})
	}

	existing.KelasID = kelasUUID
	existing.GuruID = guruUUID
	existing.MapelID = mapelUUID
	existing.Hari = req.Hari
	existing.JamMulai = req.JamMulai
	existing.JamSelesai = req.JamSelesai
	if req.Ruang != "" {
		existing.Ruang = req.Ruang
	}

	if err := db.Save(&existing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui jadwal pelajaran",
			Error:   err.Error(),
		})
	}

	_ = db.Preload("Kelas").Preload("Guru.User").Preload("Mapel").First(&existing, "id = ?", existing.ID)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Jadwal pelajaran berhasil diperbarui",
		Data:    existing,
	})
}

func (h *JadwalHandler) DeleteJadwal(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID jadwal tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	res := db.Delete(&model.JadwalPelajaran{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus jadwal pelajaran",
			Error:   res.Error.Error(),
		})
	}

	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Jadwal tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Jadwal pelajaran berhasil dihapus",
	})
}
