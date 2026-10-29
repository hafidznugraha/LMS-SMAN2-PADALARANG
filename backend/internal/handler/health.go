package handler

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

// HealthCheckHandler mengecek status kesiapan backend API
func HealthCheckHandler(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "LMS SMAN 2 Padalarang API is healthy",
		Data: fiber.Map{
			"service": "LMS Backend API",
			"version": "1.0.0",
			"status":  "running",
		},
	})
}
