package handler

import (
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
	var list []model.Kelas
	if err := db.Preload("WaliGuru.User").Order("tingkat asc, nama_kelas asc").Find(&list).Error; err != nil {
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
	if req.WaliGuruID != "" {
		if parsed, err := uuid.Parse(req.WaliGuruID); err == nil {
			waliGuruUUID = &parsed
		}
	}

	newKelas := model.Kelas{
		NamaKelas:  req.NamaKelas,
		Tingkat:    req.Tingkat,
		Jurusan:    req.Jurusan,
		WaliGuruID: waliGuruUUID,
	}

	if err := db.Create(&newKelas).Error; err != nil {
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
		if parsed, err := uuid.Parse(req.WaliGuruID); err == nil {
			kelas.WaliGuruID = &parsed
		}
	}

	if err := db.Save(&kelas).Error; err != nil {
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

func (h *MasterHandler) GetGuruList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}
	var list []model.Guru
	if err := db.Preload("User").Find(&list).Error; err != nil {
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

	if req.Role == model.RoleGuru || req.Role == model.RoleWaliKelas {
		if req.NIP != "" {
			newGuru := model.Guru{
				UserID:    newUser.ID,
				NIP:       req.NIP,
				Gelar:     req.Gelar,
				NoTelepon: req.NoTelepon,
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
	} else if req.Role == model.RoleSiswa {
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
		user.NamaLengkap = req.NamaLengkap
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := db.Save(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui pengguna",
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
	if err := db.Model(&model.User{}).Where("id = ?", targetID).Update("is_active", false).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menonaktifkan akun",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Akun pengguna berhasil dinonaktifkan",
	})
}
