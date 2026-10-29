package app

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/handler"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/middleware"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

// SetupRouter menginisialisasi aplikasi Fiber dan mendaftarkan rute
func SetupRouter(cfg *config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:      "LMS SMAN 2 Padalarang API v1.0.0",
		ServerHeader: "Fiber",
	})

	// Middlewares global
	app.Use(recover.New())
	app.Use(logger.New())
	allowCredentials := true
	if cfg.AllowedOrigins == "*" {
		allowCredentials = false
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: allowCredentials,
	}))

	// API Route Grouping: /api/v1
	api := app.Group("/api/v1")

	// Endpoint Publik
	api.Get("/health", handler.HealthCheckHandler)

	// Route Placeholder Autentikasi
	auth := api.Group("/auth")
	auth.Post("/login", func(c *fiber.Ctx) error {
		// Mock login untuk tahap skeleton
		return c.Status(fiber.StatusOK).JSON(model.APIResponse{
			Success: true,
			Message: "Endpoint login siap dikembangkan",
		})
	})

	// Route Terproteksi JWT
	protected := api.Group("", middleware.JWTProtected(cfg))

	// Rute Khusus Kurikulum / Admin
	kurikulum := protected.Group("/kurikulum", middleware.RequireRole(model.RoleKurikulum))
	kurikulum.Get("/jadwal", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data jadwal kurikulum"})
	})

	// Rute Khusus Guru
	guru := protected.Group("/guru", middleware.RequireRole(model.RoleGuru))
	guru.Get("/materi", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data materi guru"})
	})

	// Rute Khusus Siswa
	siswa := protected.Group("/siswa", middleware.RequireRole(model.RoleSiswa))
	siswa.Get("/tugas", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data tugas siswa"})
	})

	return app
}
