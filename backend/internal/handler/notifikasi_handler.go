package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type NotifikasiHandler struct {
	cfg *config.Config
}

func NewNotifikasiHandler(cfg *config.Config) *NotifikasiHandler {
	return &NotifikasiHandler{cfg: cfg}
}

type NotifikasiListResponse struct {
	Items       []model.Notifikasi `json:"items"`
	UnreadCount int64              `json:"unread_count"`
}

// GET /api/v1/notifikasi
func (h *NotifikasiHandler) GetNotifikasi(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || strings.TrimSpace(userIDStr) == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "Sesi autentikasi tidak ditemukan",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna tidak valid",
		})
	}

	var items []model.Notifikasi
	if err := db.Where("user_id = ?", userID).Order("created_at DESC").Limit(50).Find(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat notifikasi",
			Error:   err.Error(),
		})
	}

	if items == nil {
		items = []model.Notifikasi{}
	}

	var unreadCount int64
	_ = db.Model(&model.Notifikasi{}).Where("user_id = ? AND is_read = false", userID).Count(&unreadCount).Error

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar notifikasi berhasil dimuat",
		Data: NotifikasiListResponse{
			Items:       items,
			UnreadCount: unreadCount,
		},
	})
}

// PUT /api/v1/notifikasi/:id/read
func (h *NotifikasiHandler) MarkAsRead(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || strings.TrimSpace(userIDStr) == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "Sesi autentikasi tidak ditemukan",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna tidak valid",
		})
	}

	notifIDStr := c.Params("id")
	notifID, err := uuid.Parse(notifIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID notifikasi tidak valid",
		})
	}

	if err := db.Model(&model.Notifikasi{}).Where("id = ? AND user_id = ?", notifID, userID).Update("is_read", true).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui status notifikasi",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Notifikasi berhasil ditandai sebagai dibaca",
	})
}

// PUT /api/v1/notifikasi/read-all
func (h *NotifikasiHandler) MarkAllAsRead(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || strings.TrimSpace(userIDStr) == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "Sesi autentikasi tidak ditemukan",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna tidak valid",
		})
	}

	if err := db.Model(&model.Notifikasi{}).Where("user_id = ? AND is_read = false", userID).Update("is_read", true).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menandai seluruh notifikasi",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Semua notifikasi berhasil ditandai sebagai dibaca",
	})
}
