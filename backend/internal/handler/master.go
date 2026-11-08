package handler

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type MasterHandler struct{}

func NewMasterHandler() *MasterHandler {
	return &MasterHandler{}
}

func (h *MasterHandler) GetKelasList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var activeTA model.TahunAjaran
	tahunAjaranStr := "2026/2027"
	if err := db.Where("is_aktif = ?", true).First(&activeTA).Error; err == nil && activeTA.Tahun != "" {
		tahunAjaranStr = activeTA.Tahun
	}

	var list []model.Kelas
	if err := db.Select("kelas.*, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS total_siswa, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS jumlah_siswa, ? AS tahun_ajaran", tahunAjaranStr).
		Preload("WaliGuru.User").
		Order("tingkat asc, nama_kelas asc").
		Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data kelas",
			Error:   err.Error(),
		})
	}
	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data kelas berhasil dimuat",
		Data:    list,
	})
}

func (h *MasterHandler) CreateKelas(c *fiber.Ctx) error {
	var req model.CreateKelasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	req.NamaKelas = strings.TrimSpace(req.NamaKelas)
	req.Jurusan = strings.TrimSpace(req.Jurusan)

	if req.NamaKelas == "" || req.Jurusan == "" || req.Tingkat == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Nama kelas, tingkat (10, 11, 12), dan jurusan wajib diisi",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var existing model.Kelas
	if err := db.Where("LOWER(nama_kelas) = LOWER(?)", req.NamaKelas).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: "Kelas dengan nama tersebut sudah terdaftar",
		})
	}

	var waliGuruUUID *uuid.UUID
	if req.WaliGuruID != "" && req.WaliGuruID != "none" {
		parsed, err := uuid.Parse(req.WaliGuruID)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "ID guru tidak valid",
			})
		}
		var conflictKelas model.Kelas
		if err := db.Where("wali_guru_id = ?", parsed).First(&conflictKelas).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Guru yang dipilih sudah menjadi wali kelas untuk kelas lain",
			})
		}
		waliGuruUUID = &parsed
	}

	newKelas := model.Kelas{
		NamaKelas:  req.NamaKelas,
		Tingkat:    req.Tingkat,
		Jurusan:    req.Jurusan,
		WaliGuruID: waliGuruUUID,
	}

	if err := db.Create(&newKelas).Error; err != nil {
		if strings.Contains(err.Error(), "uq_kelas_wali_guru") {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Guru yang dipilih sudah menjadi wali kelas untuk kelas lain",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan data kelas",
			Error:   err.Error(),
		})
	}

	_ = db.Preload("WaliGuru.User").First(&newKelas, "id = ?", newKelas.ID)

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Data kelas berhasil ditambahkan",
		Data:    newKelas,
	})
}

func (h *MasterHandler) UpdateKelas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}

	var req model.UpdateKelasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var kelas model.Kelas
	if err := db.First(&kelas, "id = ?", targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Kelas tidak ditemukan",
		})
	}

	if req.NamaKelas != "" {
		req.NamaKelas = strings.TrimSpace(req.NamaKelas)
		var checkDuplicate model.Kelas
		if err := db.Where("LOWER(nama_kelas) = LOWER(?) AND id != ?", req.NamaKelas, targetID).First(&checkDuplicate).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Nama kelas sudah digunakan oleh kelas lain",
			})
		}
		kelas.NamaKelas = req.NamaKelas
	}

	if req.Tingkat != 0 {
		kelas.Tingkat = req.Tingkat
	}
	if req.Jurusan != "" {
		kelas.Jurusan = req.Jurusan
	}
	if req.WaliGuruID != "" {
		if req.WaliGuruID == "none" {
			kelas.WaliGuruID = nil
		} else {
			parsed, err := uuid.Parse(req.WaliGuruID)
			if err != nil {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "ID guru tidak valid",
				})
			}
			var conflictKelas model.Kelas
			if err := db.Where("wali_guru_id = ? AND id != ?", parsed, targetID).First(&conflictKelas).Error; err == nil {
				return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
					Success: false,
					Message: "Guru yang dipilih sudah menjadi wali kelas untuk kelas lain",
				})
			}
			kelas.WaliGuruID = &parsed
		}
	}

	if err := db.Save(&kelas).Error; err != nil {
		if strings.Contains(err.Error(), "uq_kelas_wali_guru") {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Guru yang dipilih sudah menjadi wali kelas untuk kelas lain",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui data kelas",
			Error:   err.Error(),
		})
	}

	_ = db.Preload("WaliGuru.User").First(&kelas, "id = ?", kelas.ID)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data kelas berhasil diperbarui",
		Data:    kelas,
	})
}

func (h *MasterHandler) DeleteKelas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	res := db.Delete(&model.Kelas{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus kelas",
			Error:   res.Error.Error(),
		})
	}

	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Kelas tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data kelas berhasil dihapus",
	})
}

func (h *MasterHandler) GetMapelList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	var list []model.MataPelajaran
	if err := db.Order("nama_mapel asc").Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data mata pelajaran",
			Error:   err.Error(),
		})
	}
	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data mata pelajaran berhasil dimuat",
		Data:    list,
	})
}

func (h *MasterHandler) CreateMapel(c *fiber.Ctx) error {
	var req model.CreateMapelRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	req.KodeMapel = strings.TrimSpace(req.KodeMapel)
	req.NamaMapel = strings.TrimSpace(req.NamaMapel)
	req.Kategori = strings.TrimSpace(req.Kategori)

	if req.KodeMapel == "" || req.NamaMapel == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Kode mata pelajaran dan nama mata pelajaran wajib diisi",
		})
	}

	if req.Kategori == "" {
		req.Kategori = "Umum"
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var existing model.MataPelajaran
	if err := db.Where("LOWER(kode_mapel) = LOWER(?)", req.KodeMapel).First(&existing).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: "Mata pelajaran dengan kode tersebut sudah terdaftar",
		})
	}

	newMapel := model.MataPelajaran{
		KodeMapel: req.KodeMapel,
		NamaMapel: req.NamaMapel,
		Kategori:  req.Kategori,
	}

	if err := db.Create(&newMapel).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan data mata pelajaran",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Data mata pelajaran berhasil ditambahkan",
		Data:    newMapel,
	})
}

func (h *MasterHandler) UpdateMapel(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID mata pelajaran tidak valid",
		})
	}

	var req model.UpdateMapelRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var mapel model.MataPelajaran
	if err := db.First(&mapel, "id = ?", targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Mata pelajaran tidak ditemukan",
		})
	}

	req.KodeMapel = strings.TrimSpace(req.KodeMapel)
	req.NamaMapel = strings.TrimSpace(req.NamaMapel)
	req.Kategori = strings.TrimSpace(req.Kategori)

	if req.KodeMapel != "" && req.KodeMapel != mapel.KodeMapel {
		var checkDuplicate model.MataPelajaran
		if err := db.Where("LOWER(kode_mapel) = LOWER(?) AND id != ?", req.KodeMapel, targetID).First(&checkDuplicate).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Mata pelajaran dengan kode tersebut sudah terdaftar",
			})
		}
		mapel.KodeMapel = req.KodeMapel
	}

	if req.NamaMapel != "" {
		mapel.NamaMapel = req.NamaMapel
	}
	if req.Kategori != "" {
		mapel.Kategori = req.Kategori
	}

	if err := db.Save(&mapel).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui data mata pelajaran",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data mata pelajaran berhasil diperbarui",
		Data:    mapel,
	})
}

func (h *MasterHandler) DeleteMapel(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID mata pelajaran tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var countJadwal int64
	db.Model(&model.JadwalPelajaran{}).Where("mapel_id = ?", targetID).Count(&countJadwal)
	if countJadwal > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Mata pelajaran tidak dapat dihapus karena masih digunakan pada jadwal pelajaran",
		})
	}

	var countMateri int64
	db.Model(&model.Materi{}).Where("mapel_id = ?", targetID).Count(&countMateri)
	if countMateri > 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Mata pelajaran tidak dapat dihapus karena masih digunakan pada materi pembelajaran",
		})
	}

	res := db.Delete(&model.MataPelajaran{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus mata pelajaran",
			Error:   res.Error.Error(),
		})
	}

	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Mata pelajaran tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Mata pelajaran berhasil dihapus",
	})
}

func (h *MasterHandler) GetGuruList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	var list []model.Guru
	if err := db.Preload("User").Preload("Mapel").Preload("KelasBinaan").Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data guru",
			Error:   err.Error(),
		})
	}
	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data guru berhasil dimuat",
		Data:    list,
	})
}

func (h *MasterHandler) GetSiswaList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	kelasID := c.Query("kelas_id")
	query := db.Preload("User").Preload("Kelas")
	if kelasID != "" {
		query = query.Where("kelas_id = ?", kelasID)
	}

	var list []model.Siswa
	if err := query.Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data siswa",
			Error:   err.Error(),
		})
	}
	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data siswa berhasil dimuat",
		Data:    list,
	})
}

func (h *MasterHandler) GetUsersList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	roleQuery := c.Query("role")

	query := db.Order("created_at desc")
	if roleQuery != "" {
		query = query.Where("role = ?", roleQuery)
	}

	var users []model.User
	if err := query.Find(&users).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar pengguna",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar pengguna berhasil dimuat",
		Data:    users,
	})
}

func (h *MasterHandler) CreateUser(c *fiber.Ctx) error {
	var req model.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Password) == "" || strings.TrimSpace(req.NamaLengkap) == "" || strings.TrimSpace(req.Email) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Username, password, nama lengkap, dan email wajib diisi",
		})
	}

	if strings.TrimSpace(req.NoTelepon) != "" {
		matched, _ := regexp.MatchString(`^[0-9]{10,15}$`, strings.TrimSpace(req.NoTelepon))
		if !matched {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Nomor telepon harus berupa angka antara 10 hingga 15 digit",
			})
		}
	}

	if req.MapelID != "" && req.MapelID != "none" {
		if _, err := uuid.Parse(req.MapelID); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "ID mata pelajaran tidak valid",
			})
		}
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	var existingUser model.User
	if err := db.Where("username = ? OR email = ?", req.Username, req.Email).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
			Success: false,
			Message: "Username atau email sudah digunakan",
		})
	}

	switch req.Role {
	case model.RoleGuru, model.RoleWaliKelas:
		if strings.TrimSpace(req.NIP) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NIP))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NIP hanya boleh berisi angka",
				})
			}
			var existingGuru model.Guru
			if err := db.Where("nip = ?", strings.TrimSpace(req.NIP)).First(&existingGuru).Error; err == nil {
				return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
					Success: false,
					Message: "NIP sudah terdaftar untuk guru lain",
				})
			}
		}
	case model.RoleSiswa:
		if strings.TrimSpace(req.NIS) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NIS))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NIS hanya boleh berisi angka",
				})
			}
		}
		if strings.TrimSpace(req.NISN) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NISN))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NISN hanya boleh berisi angka",
				})
			}
		}
		if req.NIS != "" || req.NISN != "" {
			var existingSiswa model.Siswa
			if err := db.Where("nis = ? OR nisn = ?", strings.TrimSpace(req.NIS), strings.TrimSpace(req.NISN)).First(&existingSiswa).Error; err == nil {
				return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
					Success: false,
					Message: "NIS atau NISN sudah terdaftar untuk siswa lain",
				})
			}
		}
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengenkripsi kata sandi",
			Error:   err.Error(),
		})
	}

	newUser := model.User{
		Username:     req.Username,
		PasswordHash: string(hashed),
		NamaLengkap:  req.NamaLengkap,
		Email:        req.Email,
		Role:         req.Role,
		IsActive:     true,
	}

	tx := db.Begin()
	if err := tx.Create(&newUser).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal membuat pengguna",
			Error:   err.Error(),
		})
	}

	switch req.Role {
	case model.RoleGuru, model.RoleWaliKelas:
		if req.NIP != "" {
			var parsedMapelID *uuid.UUID
			if req.MapelID != "" && req.MapelID != "none" {
				mUUID, err := uuid.Parse(req.MapelID)
				if err != nil {
					tx.Rollback()
					return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
						Success: false,
						Message: "ID mata pelajaran tidak valid",
					})
				}
				var checkMapel model.MataPelajaran
				if err := tx.First(&checkMapel, "id = ?", mUUID).Error; err != nil {
					tx.Rollback()
					return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
						Success: false,
						Message: "Mata pelajaran tidak ditemukan",
					})
				}
				parsedMapelID = &mUUID
			}
			newGuru := model.Guru{
				UserID:    newUser.ID,
				NIP:       req.NIP,
				Gelar:     req.Gelar,
				NoTelepon: req.NoTelepon,
				MapelID:   parsedMapelID,
			}
			if err := tx.Create(&newGuru).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal membuat data profil guru",
					Error:   err.Error(),
				})
			}
		}
	case model.RoleSiswa:
		if req.NIS != "" && req.NISN != "" {
			var parsedKelasID *uuid.UUID
			if req.KelasID != "" {
				kUUID, err := uuid.Parse(req.KelasID)
				if err == nil {
					parsedKelasID = &kUUID
				}
			}
			newSiswa := model.Siswa{
				UserID:       newUser.ID,
				NIS:          req.NIS,
				NISN:         req.NISN,
				KelasID:      parsedKelasID,
				JenisKelamin: req.JenisKelamin,
				NoTelepon:    req.NoTelepon,
				Alamat:       req.Alamat,
			}
			if newSiswa.JenisKelamin == "" {
				newSiswa.JenisKelamin = "Laki-laki"
			}
			if err := tx.Create(&newSiswa).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal membuat data profil siswa",
					Error:   err.Error(),
				})
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan transaksi",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Akun pengguna berhasil dibuat",
		Data:    newUser,
	})
}

func (h *MasterHandler) UpdateUser(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna tidak valid",
		})
	}

	var req model.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	var user model.User
	if err := db.First(&user, "id = ?", targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Pengguna tidak ditemukan",
		})
	}

	if req.NamaLengkap != "" {
		user.NamaLengkap = strings.TrimSpace(req.NamaLengkap)
	}
	if req.Email != "" {
		req.Email = strings.TrimSpace(req.Email)
		var checkEmail model.User
		if err := db.Where("LOWER(email) = LOWER(?) AND id != ?", req.Email, targetID).First(&checkEmail).Error; err == nil {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Email sudah digunakan oleh pengguna lain",
			})
		}
		user.Email = req.Email
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}
	if strings.TrimSpace(req.Password) != "" {
		if len(req.Password) < 6 {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Kata sandi minimal 6 karakter",
			})
		}
		hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal mengenkripsi kata sandi",
				Error:   err.Error(),
			})
		}
		user.PasswordHash = string(hashed)
	}

	if strings.TrimSpace(req.NoTelepon) != "" {
		matched, _ := regexp.MatchString(`^[0-9]{10,15}$`, strings.TrimSpace(req.NoTelepon))
		if !matched {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Nomor telepon harus berupa angka antara 10 hingga 15 digit",
			})
		}
	}

	if req.MapelID != "" && req.MapelID != "none" {
		if _, err := uuid.Parse(req.MapelID); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "ID mata pelajaran tidak valid",
			})
		}
	}

	switch user.Role {
	case model.RoleGuru, model.RoleWaliKelas:
		if strings.TrimSpace(req.NIP) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NIP))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NIP hanya boleh berisi angka",
				})
			}
		}
	case model.RoleSiswa:
		if strings.TrimSpace(req.NIS) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NIS))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NIS hanya boleh berisi angka",
				})
			}
		}
		if strings.TrimSpace(req.NISN) != "" {
			matched, _ := regexp.MatchString(`^[0-9]+$`, strings.TrimSpace(req.NISN))
			if !matched {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "NISN hanya boleh berisi angka",
				})
			}
		}
	}

	tx := db.Begin()
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui pengguna",
			Error:   err.Error(),
		})
	}

	switch user.Role {
	case model.RoleGuru, model.RoleWaliKelas:
		var guru model.Guru
		if err := tx.Where("user_id = ?", targetID).First(&guru).Error; err == nil {
			if req.NIP != "" {
				guru.NIP = strings.TrimSpace(req.NIP)
			}
			if req.Gelar != "" {
				guru.Gelar = strings.TrimSpace(req.Gelar)
			}
			guru.NoTelepon = strings.TrimSpace(req.NoTelepon)
			if req.MapelID != "" {
				if req.MapelID == "none" {
					guru.MapelID = nil
				} else {
					parsedMapel, err := uuid.Parse(req.MapelID)
					if err != nil {
						tx.Rollback()
						return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
							Success: false,
							Message: "ID mata pelajaran tidak valid",
						})
					}
					var checkMapel model.MataPelajaran
					if err := tx.First(&checkMapel, "id = ?", parsedMapel).Error; err != nil {
						tx.Rollback()
						return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
							Success: false,
							Message: "Mata pelajaran tidak ditemukan",
						})
					}
					guru.MapelID = &parsedMapel
				}
			}
			if err := tx.Save(&guru).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal memperbarui data profil guru",
					Error:   err.Error(),
				})
			}
		}
	case model.RoleSiswa:
		var siswa model.Siswa
		if err := tx.Where("user_id = ?", targetID).First(&siswa).Error; err == nil {
			if req.NIS != "" {
				siswa.NIS = strings.TrimSpace(req.NIS)
			}
			if req.NISN != "" {
				siswa.NISN = strings.TrimSpace(req.NISN)
			}
			if req.KelasID != "" {
				if req.KelasID == "none" {
					siswa.KelasID = nil
				} else if kUUID, err := uuid.Parse(req.KelasID); err == nil {
					siswa.KelasID = &kUUID
				}
			}
			if req.JenisKelamin != "" {
				siswa.JenisKelamin = req.JenisKelamin
			}
			siswa.NoTelepon = strings.TrimSpace(req.NoTelepon)
			if req.Alamat != "" {
				siswa.Alamat = strings.TrimSpace(req.Alamat)
			}
			if err := tx.Save(&siswa).Error; err != nil {
				tx.Rollback()
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal memperbarui data profil siswa",
					Error:   err.Error(),
				})
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan perubahan pengguna",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data pengguna berhasil diperbarui",
		Data:    user,
	})
}

func (h *MasterHandler) DeleteUser(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna tidak valid",
		})
	}

	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	if c.Query("permanent") == "true" {
		res := db.Delete(&model.User{}, "id = ?", targetID)
		if res.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menghapus akun pengguna",
				Error:   res.Error.Error(),
			})
		}
		if res.RowsAffected == 0 {
			return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
				Success: false,
				Message: "Pengguna tidak ditemukan",
			})
		}
		return c.JSON(model.APIResponse{
			Success: true,
			Message: "Akun pengguna berhasil dihapus secara permanen",
		})
	}

	var user model.User
	if err := db.First(&user, "id = ?", targetID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Pengguna tidak ditemukan",
		})
	}

	newStatus := !user.IsActive
	if err := db.Model(&user).Update("is_active", newStatus).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui status akun",
			Error:   err.Error(),
		})
	}

	msg := "Akun pengguna berhasil dinonaktifkan"
	if newStatus {
		msg = "Akun pengguna berhasil diaktifkan kembali"
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: msg,
		Data:    user,
	})
}

var academicPrefixes = []string{
	"dr.", "dra.", "drs.", "drg.", "prof.", "ir.", "h.", "hj.",
	"dr", "dra", "drs", "prof", "ir", "kh", "k.h.",
}

var academicSuffixes = []string{
	"s.pd", "s.si", "s.kom", "s.t", "s.e", "s.sos", "s.ag", "s.ked", "s.h", "s.sn", "s.or", "s.psi", "s.ip",
	"m.pd", "m.m", "m.kom", "m.si", "m.t", "m.e", "m.ag", "m.sc", "ph.d", "b.a", "m.a",
	"spd", "ssi", "skom", "mpd", "mm", "mkom", "msi",
}

func cleanNameForCredentials(raw string, isGuru bool) []string {
	clean := strings.ToLower(raw)

	if isGuru {
		parts := strings.Split(clean, ",")
		if len(parts) > 0 {
			clean = parts[0]
		}

		clean = strings.ReplaceAll(clean, ".", " ")
		words := strings.Fields(clean)
		var filtered []string
		for _, w := range words {
			isTitle := false
			for _, pre := range academicPrefixes {
				cleanPre := strings.ReplaceAll(pre, ".", "")
				if w == cleanPre {
					isTitle = true
					break
				}
			}
			for _, suf := range academicSuffixes {
				cleanSuf := strings.ReplaceAll(suf, ".", "")
				if w == cleanSuf {
					isTitle = true
					break
				}
			}
			if !isTitle {
				filtered = append(filtered, w)
			}
		}
		clean = strings.Join(filtered, " ")
	}

	reNonAlpha := regexp.MustCompile(`[^a-z\s]`)
	clean = reNonAlpha.ReplaceAllString(clean, "")

	fields := strings.Fields(clean)
	var words []string
	for _, f := range fields {
		trimmed := strings.TrimSpace(f)
		if trimmed != "" {
			words = append(words, trimmed)
		}
	}
	return words
}

func (h *MasterHandler) GenerateCredentials(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	rawName := strings.TrimSpace(c.Query("name"))
	role := strings.ToLower(strings.TrimSpace(c.Query("role")))

	if rawName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Parameter nama wajib diisi",
		})
	}

	isGuru := role == "guru" || role == "wali_kelas"

	var activeTA model.TahunAjaran
	var yearCode string
	var tahunFull string

	if !isGuru {
		if err := db.Where("is_aktif = ?", true).First(&activeTA).Error; err != nil || activeTA.Tahun == "" {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(model.APIResponse{
				Success: false,
				Message: "Tahun ajaran aktif belum ditentukan pada sistem. Silakan aktifkan tahun ajaran di database terlebih dahulu",
			})
		}

		tahunFull = activeTA.Tahun
		parts := strings.Split(activeTA.Tahun, "/")
		cleanYear := strings.TrimSpace(parts[0])
		if len(cleanYear) >= 4 {
			yearCode = cleanYear[2:4]
		} else if len(cleanYear) == 2 {
			yearCode = cleanYear
		} else {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(model.APIResponse{
				Success: false,
				Message: "Format tahun ajaran aktif tidak valid di database",
			})
		}
	} else {
		if err := db.Where("is_aktif = ?", true).First(&activeTA).Error; err == nil {
			tahunFull = activeTA.Tahun
		}
	}

	words := cleanNameForCredentials(rawName, isGuru)
	if len(words) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Nama tidak memuat karakter alfabet yang valid",
		})
	}

	var finalUsername string
	var finalEmail string
	isConflict := false

	if isGuru {
		var baseEmailUser string
		var baseUsername string
		if len(words) == 1 {
			baseEmailUser = words[0]
			baseUsername = fmt.Sprintf("guru_%s", words[0])
		} else {
			baseEmailUser = fmt.Sprintf("%s.%s", words[0], words[len(words)-1])
			baseUsername = fmt.Sprintf("guru_%s", strings.Join(words, ""))
		}

		finalEmail = fmt.Sprintf("%s@guru.sman2padalarang.sch.id", baseEmailUser)
		finalUsername = baseUsername

		index := 1
		for {
			var count int64
			db.Model(&model.User{}).Where("username = ? OR email = ?", finalUsername, finalEmail).Count(&count)
			if count == 0 {
				break
			}
			isConflict = true
			index++
			if len(words) == 1 {
				finalEmail = fmt.Sprintf("%s%d@guru.sman2padalarang.sch.id", baseEmailUser, index)
				finalUsername = fmt.Sprintf("guru_%s%d", words[0], index)
			} else {
				finalEmail = fmt.Sprintf("%s.%s%d@guru.sman2padalarang.sch.id", words[0], words[len(words)-1], index)
				finalUsername = fmt.Sprintf("guru_%s%d", strings.Join(words, ""), index)
			}
		}
	} else {
		var initials string
		if len(words) == 1 {
			initials = words[0]
		} else {
			var sb strings.Builder
			for _, w := range words {
				sb.WriteRune([]rune(w)[0])
			}
			initials = sb.String()
		}

		finalEmail = fmt.Sprintf("%s.%s@siswa.sman2padalarang.sch.id", initials, yearCode)
		finalUsername = fmt.Sprintf("siswa_%s%s", initials, yearCode)

		index := 1
		for {
			var count int64
			db.Model(&model.User{}).Where("username = ? OR email = ?", finalUsername, finalEmail).Count(&count)
			if count == 0 {
				break
			}
			isConflict = true
			index++
			finalEmail = fmt.Sprintf("%s%d.%s@siswa.sman2padalarang.sch.id", initials, index, yearCode)
			finalUsername = fmt.Sprintf("siswa_%s%s_%d", initials, yearCode, index)
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Kredensial berhasil digenerate",
		Data: fiber.Map{
			"username":     finalUsername,
			"email":        finalEmail,
			"tahun_kode":   yearCode,
			"tahun_ajaran": tahunFull,
			"is_conflict":  isConflict,
		},
	})
}

func (h *MasterHandler) CheckAvailability(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	username := strings.TrimSpace(c.Query("username"))
	email := strings.TrimSpace(c.Query("email"))
	excludeUserID := strings.TrimSpace(c.Query("exclude_user_id"))

	usernameAvailable := true
	emailAvailable := true

	if username != "" {
		query := db.Model(&model.User{}).Where("username = ?", username)
		if excludeUserID != "" {
			if uid, err := uuid.Parse(excludeUserID); err == nil {
				query = query.Where("id != ?", uid)
			}
		}
		var count int64
		query.Count(&count)
		if count > 0 {
			usernameAvailable = false
		}
	}

	if email != "" {
		query := db.Model(&model.User{}).Where("email = ?", email)
		if excludeUserID != "" {
			if uid, err := uuid.Parse(excludeUserID); err == nil {
				query = query.Where("id != ?", uid)
			}
		}
		var count int64
		query.Count(&count)
		if count > 0 {
			emailAvailable = false
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Data: fiber.Map{
			"username_available": usernameAvailable,
			"email_available":    emailAvailable,
		},
	})
}
