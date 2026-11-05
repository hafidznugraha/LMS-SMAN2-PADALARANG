package app

import (
	"errors"
	"strings"

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
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			var e *fiber.Error
			if errors.As(err, &e) {
				code = e.Code
			}
			return c.Status(code).JSON(model.APIResponse{
				Success: false,
				Message: err.Error(),
			})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOriginsFunc: func(origin string) bool {
			if cfg.AllowedOrigins == "*" || cfg.Environment == "development" {
				return true
			}
			for _, o := range strings.Split(cfg.AllowedOrigins, ",") {
				if strings.TrimSpace(o) == origin {
					return true
				}
			}
			return false
		},
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-Requested-With",
		AllowMethods:     "GET, POST, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true,
		ExposeHeaders:    "Set-Cookie",
	}))

	// Handler Inisialisasi
	masterHandler := handler.NewMasterHandler()
	jadwalHandler := handler.NewJadwalHandler()
	guruHandler := handler.NewGuruHandler()
	laporanHandler := handler.NewLaporanHandler()
	pengaturanHandler := handler.NewPengaturanHandler()
	absensiHandler := handler.NewAbsensiHandler()

	api := app.Group("/api/v1")

	api.Get("/health", handler.HealthCheckHandler)

	api.Get("/siswa/tugas", guruHandler.GetTugasSiswa)

	// Auth Rute
	auth := api.Group("/auth")
	auth.Get("/altcha-challenge", handler.AltchaChallengeHandler(cfg))
	auth.Post("/login", handler.LoginHandler(cfg))
	auth.Post("/refresh", handler.RefreshTokenHandler(cfg))
	auth.Post("/logout", handler.LogoutHandler())
	auth.Get("/me", middleware.JWTProtected(cfg), handler.MeHandler())

	guru := api.Group("/guru")
	guru.Get("/kelas", masterHandler.GetKelasList)
	guru.Get("/materi", guruHandler.GetMateriList)
	guru.Post("/materi", guruHandler.CreateMateri)
	guru.Delete("/materi/:id", guruHandler.DeleteMateri)
	guru.Get("/tugas", guruHandler.GetTugasList)
	guru.Post("/tugas", guruHandler.CreateTugas)
	guru.Get("/tugas/:id/submissions", guruHandler.GetTugasSubmissions)
	guru.Put("/submissions/:id/grade", guruHandler.GradeSubmission)
	guru.Post("/submissions/:id/grade", guruHandler.GradeSubmission)
	// 3. Rekap & Koreksi Presensi/Absensi Siswa
	guru.Get("/absensi", guruHandler.GetAbsensiKelas)
	guru.Post("/absensi", guruHandler.SaveOrUpdateAbsensi)
	guru.Put("/absensi/:id", guruHandler.SaveOrUpdateAbsensi)

	// 4. Modul Penilaian Siswa
	guru.Get("/nilai", guruHandler.GetNilaiList)
	guru.Post("/nilai", guruHandler.SaveNilai)

	protected := api.Group("", middleware.JWTProtected(cfg))

	// Master Data
	master := protected.Group("/master")
	master.Get("/kelas", masterHandler.GetKelasList)
	master.Post("/kelas", middleware.RequireRole(model.RoleKurikulum), masterHandler.CreateKelas)
	master.Put("/kelas/:id", middleware.RequireRole(model.RoleKurikulum), masterHandler.UpdateKelas)
	master.Delete("/kelas/:id", middleware.RequireRole(model.RoleKurikulum), masterHandler.DeleteKelas)
	master.Get("/mapel", masterHandler.GetMapelList)
	master.Post("/mapel", middleware.RequireRole(model.RoleKurikulum), masterHandler.CreateMapel)
	master.Put("/mapel/:id", middleware.RequireRole(model.RoleKurikulum), masterHandler.UpdateMapel)
	master.Delete("/mapel/:id", middleware.RequireRole(model.RoleKurikulum), masterHandler.DeleteMapel)
	master.Get("/guru", masterHandler.GetGuruList)
	master.Get("/siswa", masterHandler.GetSiswaList)

	// User Management
	users := protected.Group("/users", middleware.RequireRole(model.RoleKurikulum))
	users.Get("/generate-credentials", masterHandler.GenerateCredentials)
	users.Get("/check-availability", masterHandler.CheckAvailability)
	users.Get("/", masterHandler.GetUsersList)
	users.Post("/", masterHandler.CreateUser)
	users.Put("/:id", masterHandler.UpdateUser)
	users.Delete("/:id", masterHandler.DeleteUser)

	// Jadwal Pelajaran
	jadwal := protected.Group("/jadwal")
	jadwal.Get("/", jadwalHandler.GetJadwalList)
	jadwal.Post("/", middleware.RequireRole(model.RoleKurikulum), jadwalHandler.CreateJadwal)
	jadwal.Put("/:id", middleware.RequireRole(model.RoleKurikulum), jadwalHandler.UpdateJadwal)
	jadwal.Delete("/:id", middleware.RequireRole(model.RoleKurikulum), jadwalHandler.DeleteJadwal)

	laporan := protected.Group("/laporan")
	laporan.Get("/summary", laporanHandler.GetLaporanSummary)
	laporan.Get("/kelas/:id_kelas", laporanHandler.GetLaporanByKelas)
	laporan.Get("/export-csv", laporanHandler.ExportLegerCSV)
	laporan.Post("/generate", middleware.RequireRole(model.RoleKurikulum), laporanHandler.GenerateLaporan)
	laporan.Put("/finalize-batch", middleware.RequireRole(model.RoleKurikulum), laporanHandler.FinalizeBatch)
	laporan.Put("/:id/finalize", middleware.RequireRole(model.RoleKurikulum), laporanHandler.FinalizeLaporan)
	laporan.Post("/revisi", middleware.RequireRole(model.RoleKurikulum), laporanHandler.RevisiLaporan)
	laporan.Put("/:id/catatan-wali", middleware.RequireRole(model.RoleKurikulum, model.RoleWaliKelas, model.RoleGuru), laporanHandler.UpdateCatatanWali)

	pengaturan := protected.Group("/pengaturan")
	pengaturan.Get("/", pengaturanHandler.GetPengaturan)
	pengaturan.Put("/", middleware.RequireRole(model.RoleKurikulum), pengaturanHandler.UpdatePengaturan)
	pengaturan.Post("/sinkron-dapodik", middleware.RequireRole(model.RoleKurikulum), pengaturanHandler.TriggerSinkronDapodik)

	absensi := protected.Group("/absensi")
	absensi.Get("/rekap", absensiHandler.GetRekapSekolah)
	absensi.Get("/peringatan", absensiHandler.GetPeringatanAbsensi)
	absensi.Get("/kelas/:id_kelas", absensiHandler.GetRekapRombelDetail)
	absensi.Get("/export-csv", absensiHandler.ExportAbsensiCSV)

	kurikulum := protected.Group("/kurikulum", middleware.RequireRole(model.RoleKurikulum))
	kurikulum.Get("/jadwal", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data jadwal kurikulum"})
	})

	wali := protected.Group("/wali-kelas", middleware.RequireRole(model.RoleGuru, model.RoleWaliKelas))
	wali.Get("/summary", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data pembinaan wali kelas"})
	})

	siswa := protected.Group("/siswa", middleware.RequireRole(model.RoleSiswa))
	siswa.Get("/tugas", func(c *fiber.Ctx) error {
		return c.JSON(model.APIResponse{Success: true, Message: "Data tugas siswa"})
	})

	return app
}