package handler

import (
	"errors"
	"math"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/storage"
)

type SiswaHandler struct {
	store storage.Store
}

func NewSiswaHandler(cfg *config.Config) *SiswaHandler {
	return &SiswaHandler{store: newSubmissionStore(cfg)}
}

// currentSiswa mengambil data siswa milik user yang sedang login (dari klaim JWT).
// Jika gagal, response error sudah dikirim dan return value kedua adalah error
// yang harus langsung di-return oleh pemanggil.
func currentSiswa(c *fiber.Ctx) (*model.Siswa, *gorm.DB, error) {
	db := repository.GetDB()
	if db == nil {
		return nil, nil, c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	userIDStr, ok := c.Locals("user_id").(string)
	if !ok {
		return nil, nil, c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "Data sesi tidak ditemukan",
		})
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, nil, c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengguna pada token tidak valid",
		})
	}

	var siswa model.Siswa
	err = db.Preload("User").Preload("Kelas").Where("user_id = ?", userID).First(&siswa).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
				Success: false,
				Message: "Profil siswa untuk akun ini belum terdaftar",
			})
		}
		return nil, nil, c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data siswa",
			Error:   err.Error(),
		})
	}

	return &siswa, db, nil
}

// GET /api/v1/siswa/me
func (h *SiswaHandler) GetMe(c *fiber.Ctx) error {
	siswa, _, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Profil siswa berhasil dimuat",
		Data:    siswa,
	})
}

type dashboardTugasRow struct {
	Total    int      `gorm:"column:total"`
	Selesai  int      `gorm:"column:selesai"`
	Menunggu int      `gorm:"column:menunggu"`
	Mendesak int      `gorm:"column:mendesak"`
	Dinilai  int      `gorm:"column:dinilai"`
	RataRata *float64 `gorm:"column:rata_rata"`
}

type dashboardAbsensiRow struct {
	Status string `gorm:"column:status"`
	Jumlah int    `gorm:"column:jumlah"`
}

// GET /api/v1/siswa/dashboard
func (h *SiswaHandler) GetDashboard(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	wib := time.FixedZone("WIB", 7*3600)
	now := time.Now().In(wib)
	hariIni := now.Format("2006-01-02")
	awalBulan := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, wib).Format("2006-01-02")
	awalBulanDepan := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, wib).Format("2006-01-02")

	resp := model.SiswaDashboardResponse{
		NamaLengkap: siswa.User.NamaLengkap,
	}
	if siswa.Kelas != nil {
		resp.NamaKelas = siswa.Kelas.NamaKelas
	}

	var ta model.TahunAjaran
	if err := db.Where("is_aktif = ?", true).First(&ta).Error; err == nil {
		resp.Semester = ta.Semester
		resp.TahunAjaran = ta.Tahun
	}

	if siswa.KelasID != nil {
		kelasID := *siswa.KelasID

		// Materi untuk kelas siswa
		if err := db.Raw(
			"SELECT COUNT(*) AS materi, COUNT(DISTINCT mapel_id) AS mapel FROM materi WHERE kelas_id = ?",
			kelasID,
		).Row().Scan(&resp.MateriTersedia, &resp.JumlahMapel); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menghitung materi",
				Error:   err.Error(),
			})
		}

		// Tugas kelas + status pengumpulan milik siswa ini
		var tr dashboardTugasRow
		if err := db.Raw(`
			SELECT
				COUNT(t.id) AS total,
				COUNT(p.id) AS selesai,
				COUNT(*) FILTER (WHERE p.id IS NULL AND t.deadline > NOW()) AS menunggu,
				COUNT(*) FILTER (WHERE p.id IS NULL AND t.deadline > NOW() AND t.deadline <= NOW() + INTERVAL '48 hours') AS mendesak,
				COUNT(p.nilai) AS dinilai,
				AVG(p.nilai) AS rata_rata
			FROM tugas t
			LEFT JOIN pengumpulan_tugas p ON p.tugas_id = t.id AND p.siswa_id = ?
			WHERE t.kelas_id = ?`, siswa.ID, kelasID).Scan(&tr).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menghitung tugas",
				Error:   err.Error(),
			})
		}
		resp.TugasTotal = tr.Total
		resp.TugasSelesai = tr.Selesai
		resp.TugasMenunggu = tr.Menunggu
		resp.TugasMendesak = tr.Mendesak
		resp.TugasDinilai = tr.Dinilai
		if tr.RataRata != nil {
			v := math.Round(*tr.RataRata*10) / 10
			resp.RataRataNilai = &v
		}
	}

	// Kehadiran bulan berjalan
	var rows []dashboardAbsensiRow
	if err := db.Raw(`
		SELECT status, COUNT(*) AS jumlah
		FROM absensi
		WHERE siswa_id = ? AND tanggal >= ? AND tanggal < ?
		GROUP BY status`, siswa.ID, awalBulan, awalBulanDepan).Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghitung kehadiran",
			Error:   err.Error(),
		})
	}
	hadir := 0
	for _, r := range rows {
		resp.HariTercatat += r.Jumlah
		if r.Status == string(model.StatusHadir) || r.Status == string(model.StatusTerlambat) {
			hadir += r.Jumlah
		}
	}
	if resp.HariTercatat > 0 {
		resp.KehadiranPersen = int(math.Round(float64(hadir) / float64(resp.HariTercatat) * 100))
	}

	// Sudah absen hari ini?
	var absen model.Absensi
	if err := db.Where("siswa_id = ? AND tanggal = ?", siswa.ID, hariIni).First(&absen).Error; err == nil {
		resp.AbsenHariIni = model.SiswaAbsenHariIni{
			Sudah:      true,
			Status:     string(absen.Status),
			WaktuMasuk: absen.WaktuMasuk,
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Ringkasan dashboard siswa berhasil dimuat",
		Data:    resp,
	})
}
