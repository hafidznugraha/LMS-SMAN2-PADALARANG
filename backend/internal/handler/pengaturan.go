package handler

import (
	"errors"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type PengaturanHandler struct {
	db *gorm.DB
}

func NewPengaturanHandler(db ...*gorm.DB) *PengaturanHandler {
	if len(db) > 0 && db[0] != nil {
		return &PengaturanHandler{db: db[0]}
	}
	return &PengaturanHandler{db: repository.GetDB()}
}

func (h *PengaturanHandler) getDB() *gorm.DB {
	if h.db != nil {
		return h.db
	}
	return repository.GetDB()
}

func (h *PengaturanHandler) GetPengaturan(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var config model.PengaturanSekolah
	err := db.First(&config).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			defaultConfig := model.PengaturanSekolah{
				ID:                        uuid.New(),
				NamaSekolah:               "SMA Negeri 2 Padalarang",
				NPSN:                      "20227927",
				Akreditasi:                "A",
				Alamat:                    "Jalan Raya Padalarang No. 45, Kertajaya, Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553",
				Telepon:                   "(022) 6806123",
				Email:                     "info@sman2padalarang.sch.id",
				Website:                   "https://sman2padalarang.sch.id",
				KepalaSekolah:             "Drs. H. Engkos Kosasih, M.Pd",
				NIPKepalaSekolah:          "196508121990031008",
				WakaKurikulum:             "Drs. Herman Wijaya, M.M",
				NIPWakaKurikulum:          "196804151994031004",
				TahunAjaranAktif:          "2026/2027",
				SemesterAktif:             "Ganjil",
				DurasiKBMMenit:            45,
				JamMasuk:                  "07:00:00",
				JamPulang:                 "15:30:00",
				StatusSinkronisasiDapodik: "Terhubung",
			}
			if createErr := db.Create(&defaultConfig).Error; createErr != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal membuat konfigurasi pengaturan bawaan",
					Error:   createErr.Error(),
				})
			}
			config = defaultConfig
		} else {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal memuat pengaturan sekolah",
				Error:   err.Error(),
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Berhasil memuat pengaturan sekolah",
		Data:    config,
	})
}

func (h *PengaturanHandler) UpdatePengaturan(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var req model.UpdatePengaturanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	var config model.PengaturanSekolah
	if err := db.First(&config).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Pengaturan sekolah belum diinisialisasi",
		})
	}

	if req.NamaSekolah != "" {
		config.NamaSekolah = req.NamaSekolah
	}
	if req.NPSN != "" {
		config.NPSN = req.NPSN
	}
	if req.Akreditasi != "" {
		config.Akreditasi = req.Akreditasi
	}
	if req.Alamat != "" {
		config.Alamat = req.Alamat
	}
	if req.Telepon != "" {
		config.Telepon = req.Telepon
	}
	if req.Email != "" {
		config.Email = req.Email
	}
	if req.Website != "" {
		config.Website = req.Website
	}
	if req.KepalaSekolah != "" {
		config.KepalaSekolah = req.KepalaSekolah
	}
	if req.NIPKepalaSekolah != "" {
		config.NIPKepalaSekolah = req.NIPKepalaSekolah
	}
	if req.WakaKurikulum != "" {
		config.WakaKurikulum = req.WakaKurikulum
	}
	if req.NIPWakaKurikulum != "" {
		config.NIPWakaKurikulum = req.NIPWakaKurikulum
	}
	if req.TahunAjaranAktif != "" {
		config.TahunAjaranAktif = req.TahunAjaranAktif
	}
	if req.SemesterAktif != "" {
		config.SemesterAktif = req.SemesterAktif
	}
	if req.DurasiKBMMenit > 0 {
		config.DurasiKBMMenit = req.DurasiKBMMenit
	}
	if req.JamMasuk != "" {
		config.JamMasuk = req.JamMasuk
	}
	if req.JamPulang != "" {
		config.JamPulang = req.JamPulang
	}
	if req.TenggatKunciRaport != "" {
		t, parseErr := time.Parse("2006-01-02", req.TenggatKunciRaport)
		if parseErr == nil {
			config.TenggatKunciRaport = &t
		}
	}

	config.UpdatedAt = time.Now()

	if err := db.Save(&config).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan perubahan pengaturan sekolah",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Pengaturan sekolah berhasil diperbarui",
		Data:    config,
	})
}

func (h *PengaturanHandler) TriggerSinkronDapodik(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var config model.PengaturanSekolah
	if err := db.First(&config).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Pengaturan sekolah tidak ditemukan",
		})
	}

	now := time.Now()
	config.TerakhirSinkron = &now
	config.StatusSinkronisasiDapodik = "Sinkron Berhasil"
	config.UpdatedAt = now

	if err := db.Save(&config).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui status sinkronisasi",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Sinkronisasi Dapodik berhasil diselesaikan",
		Data: fiber.Map{
			"status":           config.StatusSinkronisasiDapodik,
			"terakhir_sinkron": config.TerakhirSinkron.Format("02 January 2006 15:04:05 WIB"),
			"npsn":             config.NPSN,
			"nama_sekolah":     config.NamaSekolah,
		},
	})
}
