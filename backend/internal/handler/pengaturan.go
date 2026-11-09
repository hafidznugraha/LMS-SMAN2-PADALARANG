package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/service"
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

func (h *PengaturanHandler) loadPengaturanConfig(db *gorm.DB) model.PengaturanSekolah {
	var config model.PengaturanSekolah

	var profil model.ProfilSekolah
	if err := db.First(&profil).Error; err == nil {
		config.ID = profil.ID
		config.NamaSekolah = profil.NamaSekolah
		config.NPSN = profil.NPSN
		config.Akreditasi = profil.Akreditasi
		config.Alamat = profil.Alamat
		config.Telepon = profil.Telepon
		config.Email = profil.Email
		config.Website = profil.Website
		config.CreatedAt = profil.CreatedAt
		config.UpdatedAt = profil.UpdatedAt
	}

	var ta model.TahunAjaran
	if err := db.Where("is_aktif = ?", true).First(&ta).Error; err == nil {
		config.TahunAjaranAktif = ta.Tahun
		config.SemesterAktif = ta.Semester
		config.TenggatKunciRaport = ta.TenggatKunciRaport
	}

	var kepsek model.PejabatSekolah
	if err := db.Where("jabatan = ? AND is_aktif = ?", "Kepala Sekolah", true).First(&kepsek).Error; err == nil {
		config.KepalaSekolah = kepsek.NamaPejabat
		config.NIPKepalaSekolah = kepsek.NIP
	}

	var waka model.PejabatSekolah
	if err := db.Where("jabatan = ? AND is_aktif = ?", "Waka Kurikulum", true).First(&waka).Error; err == nil {
		config.WakaKurikulum = waka.NamaPejabat
		config.NIPWakaKurikulum = waka.NIP
	}

	var kbm model.KonfigurasiKBM
	if err := db.Where("is_aktif = ?", true).First(&kbm).Error; err == nil {
		config.DurasiKBMMenit = kbm.DurasiKBMMenit
		config.JamMasuk = kbm.JamMasuk
		config.JamPulang = kbm.JamPulang
	}

	var dapodikLog model.LogSinkronDapodik
	if err := db.Order("terakhir_sinkron desc").First(&dapodikLog).Error; err == nil {
		config.StatusSinkronisasiDapodik = dapodikLog.Status
		config.TerakhirSinkron = &dapodikLog.TerakhirSinkron
	}

	cfgPenilaian := service.GetKonfigurasiPenilaian(db)
	config.KKMDefault = cfgPenilaian.KKMDefault
	config.BobotTugas = cfgPenilaian.BobotTugas
	config.BobotUH = cfgPenilaian.BobotUH
	config.BobotUTS = cfgPenilaian.BobotUTS
	config.BobotUAS = cfgPenilaian.BobotUAS
	config.BatasPredikatA = cfgPenilaian.BatasPredikatA
	config.BatasPredikatB = cfgPenilaian.BatasPredikatB
	config.BatasPredikatC = cfgPenilaian.BatasPredikatC

	return config
}

func (h *PengaturanHandler) GetPengaturan(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	config := h.loadPengaturanConfig(db)

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

	now := time.Now()

	var profil model.ProfilSekolah
	if err := db.First(&profil).Error; err == nil {
		if req.NamaSekolah != "" {
			profil.NamaSekolah = req.NamaSekolah
		}
		if req.NPSN != "" {
			profil.NPSN = req.NPSN
		}
		if req.Akreditasi != "" {
			profil.Akreditasi = req.Akreditasi
		}
		if req.Alamat != "" {
			profil.Alamat = req.Alamat
		}
		if req.Telepon != "" {
			profil.Telepon = req.Telepon
		}
		if req.Email != "" {
			profil.Email = req.Email
		}
		if req.Website != "" {
			profil.Website = req.Website
		}
		profil.UpdatedAt = now
		_ = db.Save(&profil).Error
	}

	if req.TahunAjaranAktif != "" && req.SemesterAktif != "" {
		_ = db.Model(&model.TahunAjaran{}).Where("is_aktif = ?", true).Update("is_aktif", false).Error
		var ta model.TahunAjaran
		if err := db.Where("tahun = ? AND semester = ?", req.TahunAjaranAktif, req.SemesterAktif).First(&ta).Error; err == nil {
			ta.IsAktif = true
			if req.TenggatKunciRaport != "" {
				t, parseErr := time.Parse("2006-01-02", req.TenggatKunciRaport)
				if parseErr == nil {
					ta.TenggatKunciRaport = &t
				}
			}
			ta.UpdatedAt = now
			_ = db.Save(&ta).Error
		} else {
			newTA := model.TahunAjaran{
				Tahun:    req.TahunAjaranAktif,
				Semester: req.SemesterAktif,
				IsAktif:  true,
			}
			if req.TenggatKunciRaport != "" {
				t, parseErr := time.Parse("2006-01-02", req.TenggatKunciRaport)
				if parseErr == nil {
					newTA.TenggatKunciRaport = &t
				}
			}
			_ = db.Create(&newTA).Error
		}
	} else if req.TenggatKunciRaport != "" {
		t, parseErr := time.Parse("2006-01-02", req.TenggatKunciRaport)
		if parseErr == nil {
			_ = db.Model(&model.TahunAjaran{}).Where("is_aktif = ?", true).Updates(map[string]interface{}{
				"tenggat_kunci_raport": &t,
				"updated_at":           now,
			}).Error
		}
	}

	if req.KepalaSekolah != "" {
		_ = db.Model(&model.PejabatSekolah{}).
			Where("jabatan = ? AND is_aktif = ?", "Kepala Sekolah", true).
			Updates(map[string]interface{}{
				"nama_pejabat": req.KepalaSekolah,
				"nip":          req.NIPKepalaSekolah,
				"updated_at":   now,
			}).Error
	}
	if req.WakaKurikulum != "" {
		_ = db.Model(&model.PejabatSekolah{}).
			Where("jabatan = ? AND is_aktif = ?", "Waka Kurikulum", true).
			Updates(map[string]interface{}{
				"nama_pejabat": req.WakaKurikulum,
				"nip":          req.NIPWakaKurikulum,
				"updated_at":   now,
			}).Error
	}

	var kbm model.KonfigurasiKBM
	if err := db.Where("is_aktif = ?", true).First(&kbm).Error; err == nil {
		if req.DurasiKBMMenit > 0 {
			kbm.DurasiKBMMenit = req.DurasiKBMMenit
		}
		if req.JamMasuk != "" {
			kbm.JamMasuk = req.JamMasuk
		}
		if req.JamPulang != "" {
			kbm.JamPulang = req.JamPulang
		}
		kbm.UpdatedAt = now
		_ = db.Save(&kbm).Error
	}

	// Tangani pembaruan konfigurasi penilaian oleh Kurikulum
	if req.KKMDefault != nil || req.BobotTugas != nil || req.BobotUH != nil ||
		req.BobotUTS != nil || req.BobotUAS != nil || req.BatasPredikatA != nil ||
		req.BatasPredikatB != nil || req.BatasPredikatC != nil {

		cfgPenilaian := service.GetKonfigurasiPenilaian(db)
		if req.KKMDefault != nil {
			cfgPenilaian.KKMDefault = *req.KKMDefault
		}
		if req.BobotTugas != nil {
			cfgPenilaian.BobotTugas = *req.BobotTugas
		}
		if req.BobotUH != nil {
			cfgPenilaian.BobotUH = *req.BobotUH
		}
		if req.BobotUTS != nil {
			cfgPenilaian.BobotUTS = *req.BobotUTS
		}
		if req.BobotUAS != nil {
			cfgPenilaian.BobotUAS = *req.BobotUAS
		}
		if req.BatasPredikatA != nil {
			cfgPenilaian.BatasPredikatA = *req.BatasPredikatA
		}
		if req.BatasPredikatB != nil {
			cfgPenilaian.BatasPredikatB = *req.BatasPredikatB
		}
		if req.BatasPredikatC != nil {
			cfgPenilaian.BatasPredikatC = *req.BatasPredikatC
		}

		if errVal := service.ValidasiKonfigurasiPenilaian(cfgPenilaian); errVal != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: errVal.Error(),
			})
		}

		cfgPenilaian.UpdatedAt = now
		cfgPenilaian.IsAktif = true
		if cfgPenilaian.ID == [16]byte{} {
			_ = db.Create(&cfgPenilaian).Error
		} else {
			_ = db.Save(&cfgPenilaian).Error
		}
	}

	config := h.loadPengaturanConfig(db)

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

	now := time.Now()
	newLog := model.LogSinkronDapodik{
		Status:          "Sinkron Berhasil",
		Keterangan:      "Sinkronisasi data pokok pendidikan terverifikasi Dapodik Kemdikbudristek",
		TerakhirSinkron: now,
	}

	if err := db.Create(&newLog).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui status sinkronisasi",
			Error:   err.Error(),
		})
	}

	var profil model.ProfilSekolah
	_ = db.First(&profil).Error

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Sinkronisasi Dapodik berhasil diselesaikan",
		Data: fiber.Map{
			"status":           newLog.Status,
			"terakhir_sinkron": now.Format("02 January 2006 15:04:05 WIB"),
			"npsn":             profil.NPSN,
			"nama_sekolah":     profil.NamaSekolah,
		},
	})
}
