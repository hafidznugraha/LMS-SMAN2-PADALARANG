package handler

import (
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

type absensiSelfRequest struct {
	Status  string `json:"status"`
	Catatan string `json:"catatan"`
}

type jamKBMRow struct {
	JamMasuk  string `gorm:"column:jam_masuk"`
	JamPulang string `gorm:"column:jam_pulang"`
}

// jamKBM membaca jam masuk/pulang aktif (format HH:MM); memakai 07:00 dan
// 15:30 bila belum ada konfigurasi aktif.
func jamKBM(db *gorm.DB) (masuk, pulang string) {
	var row jamKBMRow
	res := db.Raw(`
		SELECT to_char(jam_masuk, 'HH24:MI') AS jam_masuk,
		       to_char(jam_pulang, 'HH24:MI') AS jam_pulang
		FROM konfigurasi_kbm
		WHERE is_aktif = true
		ORDER BY updated_at DESC
		LIMIT 1`).Scan(&row)
	if res.Error != nil || res.RowsAffected == 0 {
		return "07:00", "15:30"
	}
	return row.JamMasuk, row.JamPulang
}

// GET /api/v1/siswa/absensi?bulan=YYYY-MM
func (h *SiswaHandler) GetAbsensi(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	now := time.Now().In(wib)
	bulan, awal, akhir, ok := parseBulan(c.Query("bulan"), now)
	if !ok {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Parameter bulan harus berformat YYYY-MM",
		})
	}

	jamMasuk, jamPulang := jamKBM(db)
	resp := model.SiswaAbsensiResponse{
		Bulan:     bulan,
		Tanggal:   now.Format("2006-01-02"),
		JamMasuk:  jamMasuk,
		JamPulang: jamPulang,
		Riwayat:   []model.SiswaAbsensiRiwayat{},
	}

	if err := db.Raw(`
		SELECT
			id,
			to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
			status,
			COALESCE(to_char(waktu_masuk, 'HH24:MI'), '') AS waktu_masuk,
			COALESCE(catatan, '') AS catatan
		FROM absensi
		WHERE siswa_id = ? AND tanggal >= ?::date AND tanggal < ?::date
		ORDER BY tanggal DESC`, siswa.ID, awal, akhir).Scan(&resp.Riwayat).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat riwayat presensi",
			Error:   err.Error(),
		})
	}

	for _, r := range resp.Riwayat {
		resp.Rekap.Total++
		switch r.Status {
		case "hadir":
			resp.Rekap.Hadir++
		case "terlambat":
			resp.Rekap.Terlambat++
		case "sakit":
			resp.Rekap.Sakit++
		case "izin":
			resp.Rekap.Izin++
		case "alpa":
			resp.Rekap.Alpa++
		}
	}
	if resp.Rekap.Total > 0 {
		resp.Rekap.Persen = (resp.Rekap.Hadir + resp.Rekap.Terlambat) * 100 / resp.Rekap.Total
	}

	// Status presensi hari ini (terlepas dari bulan yang sedang dilihat).
	var hariIni []model.SiswaAbsensiRiwayat
	if err := db.Raw(`
		SELECT
			id,
			to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
			status,
			COALESCE(to_char(waktu_masuk, 'HH24:MI'), '') AS waktu_masuk,
			COALESCE(catatan, '') AS catatan
		FROM absensi
		WHERE siswa_id = ? AND tanggal = ?::date
		LIMIT 1`, siswa.ID, resp.Tanggal).Scan(&hariIni).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat presensi hari ini",
			Error:   err.Error(),
		})
	}

	if len(hariIni) > 0 {
		resp.HariIni = model.SiswaAbsensiHariIni{
			Sudah:      true,
			Status:     hariIni[0].Status,
			WaktuMasuk: hariIni[0].WaktuMasuk,
			Catatan:    hariIni[0].Catatan,
		}
	} else if alasan := alasanTidakBisaAbsen(now, parseJamMenit(jamPulang, defaultJamPulangMenit), siswa.KelasID != nil); alasan != "" {
		resp.HariIni.Alasan = alasan
	} else {
		resp.HariIni.BisaAbsen = true
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data presensi berhasil dimuat",
		Data:    resp,
	})
}

// POST /api/v1/siswa/absensi/self  {"status":"hadir|sakit|izin","catatan":"..."}
// Status "alpa" tidak bisa dipilih sendiri oleh siswa; itu ditetapkan guru.
func (h *SiswaHandler) AbsenMandiri(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	var req absensiSelfRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data tidak valid",
		})
	}
	req.Status = strings.ToLower(strings.TrimSpace(req.Status))
	req.Catatan = strings.TrimSpace(req.Catatan)

	if req.Status != "hadir" && req.Status != "sakit" && req.Status != "izin" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Status harus hadir, sakit, atau izin",
		})
	}
	if req.Status != "hadir" && len([]rune(req.Catatan)) < 3 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Keterangan wajib diisi untuk status sakit atau izin",
		})
	}
	if len([]rune(req.Catatan)) > 255 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Keterangan maksimal 255 karakter",
		})
	}

	now := time.Now().In(wib)
	jamMasuk, jamPulang := jamKBM(db)

	if alasan := alasanTidakBisaAbsen(now, parseJamMenit(jamPulang, defaultJamPulangMenit), siswa.KelasID != nil); alasan != "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: alasan,
			Error:   "ABSEN_TIDAK_TERSEDIA",
		})
	}

	status := req.Status
	if status == "hadir" {
		status = statusHadir(now, parseJamMenit(jamMasuk, defaultJamMasukMenit))
	}
	if status == "hadir" || status == "terlambat" {
		req.Catatan = "" // keterangan hanya untuk sakit/izin
	}

	var id uuid.UUID
	err = db.Raw(`
		INSERT INTO absensi (siswa_id, kelas_id, tanggal, waktu_masuk, status, catatan)
		VALUES (?, ?, ?::date, ?::time, ?, ?)
		RETURNING id`,
		siswa.ID, *siswa.KelasID, now.Format("2006-01-02"), now.Format("15:04:05"), status, req.Catatan,
	).Row().Scan(&id)
	if err != nil {
		if strings.Contains(err.Error(), "uq_absensi_siswa_hari") {
			return c.Status(fiber.StatusConflict).JSON(model.APIResponse{
				Success: false,
				Message: "Presensi hari ini sudah tercatat",
				Error:   "ALREADY_RECORDED",
			})
		}
		log.Printf("[ERROR] simpan presensi: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan presensi",
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Presensi berhasil dicatat",
		Data: model.SiswaAbsensiRiwayat{
			ID:         id,
			Tanggal:    now.Format("2006-01-02"),
			Status:     status,
			WaktuMasuk: now.Format("15:04"),
			Catatan:    req.Catatan,
		},
	})
}
