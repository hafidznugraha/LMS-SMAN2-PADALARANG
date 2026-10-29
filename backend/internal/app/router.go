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

func SetupRouter(cfg *config.Config) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:        "LMS SMAN 2 Padalarang API v1.0.0",
		ServerHeader:   "Fiber",
		ReadBufferSize: 32768,
	})

	app.Use(recover.New())
	app.Use(logger.New())

	allowCredentials := true
	if cfg.AllowedOrigins == "*" {
		allowCredentials = false
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With",
		AllowMethods:     "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: allowCredentials,
		ExposeHeaders:    "Set-Cookie",
	}))

	api := app.Group("/api/v1")

	api.Get("/health", handler.HealthCheckHandler)

	auth := api.Group("/auth")
	auth.Post("/login", handler.LoginHandler(cfg))
	auth.Post("/refresh", handler.RefreshTokenHandler(cfg))
	auth.Post("/logout", handler.LogoutHandler())
	auth.Get("/me", middleware.JWTProtected(cfg), handler.MeHandler())

	protected := api.Group("", middleware.JWTProtected(cfg))

	kurikulum := protected.Group("/kurikulum", middleware.RequireRole(model.RoleKurikulum))
	kurikulum.Get("/jadwal", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data jadwal kurikulum"})
	})

	guru := protected.Group("/guru", middleware.RequireRole(model.RoleGuru))
	guru.Get("/materi", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data materi guru"})
	})

	siswa := protected.Group("/siswa", middleware.RequireRole(model.RoleSiswa))
	siswa.Get("/tugas", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data tugas siswa"})
	})

	return app
}
