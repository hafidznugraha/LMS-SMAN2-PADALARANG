package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

type ubahPasswordRequest struct {
	PasswordLama string `json:"password_lama"`
	PasswordBaru string `json:"password_baru"`
}

func (h *SiswaHandler) UbahPassword(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	var req ubahPasswordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "Format data tidak valid"})
	}
	if req.PasswordLama == "" || req.PasswordBaru == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "Password lama dan baru wajib diisi"})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(siswa.User.PasswordHash), []byte(req.PasswordLama)); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Password lama salah",
			Error:   "WRONG_PASSWORD",
		})
	}

	if msg := validasiPasswordBaru(req.PasswordLama, req.PasswordBaru); msg != "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: msg, Error: "WEAK_PASSWORD"})
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.PasswordBaru), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{Success: false, Message: "Gagal memproses password baru"})
	}

	if err := db.Model(&model.User{}).Where("id = ?", siswa.UserID).Updates(map[string]interface{}{
		"password_hash": string(hash),
		"updated_at":    time.Now(),
	}).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan password baru",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{Success: true, Message: "Password berhasil diubah"})
}
