package handler

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type AbsensiHandler struct {
	db *gorm.DB
}

func NewAbsensiHandler(db ...*gorm.DB) *AbsensiHandler {
	if len(db) > 0 && db[0] != nil {
		return &AbsensiHandler{db: db[0]}
	}
	return &AbsensiHandler{db: repository.GetDB()}
}

func (h *AbsensiHandler) getDB() *gorm.DB {
	if h.db != nil {
		return h.db
	}
	return repository.GetDB()
}

func (h *AbsensiHandler) GetRekapSekolah(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var totalSiswa int64
	db.Model(&model.Siswa{}).Count(&totalSiswa)

	tanggal := c.Query("tanggal")
	if tanggal == "" {
		var maxDate time.Time
		db.Model(&model.Absensi{}).Select("COALESCE(MAX(tanggal), CURRENT_DATE)").Scan(&maxDate)
		tanggal = maxDate.Format("2006-01-02")
	}

	var totalHadir, totalSakit, totalIzin, totalAlpa, totalTerlambat int64
	db.Model(&model.Absensi{}).Where("tanggal = ? AND status = ?", tanggal, "hadir").Count(&totalHadir)
	db.Model(&model.Absensi{}).Where("tanggal = ? AND status = ?", tanggal, "sakit").Count(&totalSakit)
	db.Model(&model.Absensi{}).Where("tanggal = ? AND status = ?", tanggal, "izin").Count(&totalIzin)
	db.Model(&model.Absensi{}).Where("tanggal = ? AND status = ?", tanggal, "alpa").Count(&totalAlpa)
	db.Model(&model.Absensi{}).Where("tanggal = ? AND status = ?", tanggal, "terlambat").Count(&totalTerlambat)

	var listKelas []model.Kelas
	db.Preload("WaliGuru.User").Order("tingkat asc, nama_kelas asc").Find(&listKelas)

	rombelRekap := make([]model.AbsensiRombelRekap, 0, len(listKelas))
	var sumPersen float64
	var countRombelWithStudents int

	for _, k := range listKelas {
		var classSiswaCount int64
		db.Model(&model.Siswa{}).Where("kelas_id = ?", k.ID).Count(&classSiswaCount)

		var hadir, sakit, izin, alpa, terlambat int64
		db.Model(&model.Absensi{}).Where("kelas_id = ? AND status = ?", k.ID, "hadir").Count(&hadir)
		db.Model(&model.Absensi{}).Where("kelas_id = ? AND status = ?", k.ID, "sakit").Count(&sakit)
		db.Model(&model.Absensi{}).Where("kelas_id = ? AND status = ?", k.ID, "izin").Count(&izin)
		db.Model(&model.Absensi{}).Where("kelas_id = ? AND status = ?", k.ID, "alpa").Count(&alpa)
		db.Model(&model.Absensi{}).Where("kelas_id = ? AND status = ?", k.ID, "terlambat").Count(&terlambat)

		totalRecords := hadir + sakit + izin + alpa + terlambat
		persen := 100.0
		if totalRecords > 0 {
			persen = math.Round((float64(hadir+terlambat)/float64(totalRecords))*1000) / 10
		}

		if classSiswaCount > 0 {
			sumPersen += persen
			countRombelWithStudents++
		}

		waliName := "-"
		if k.WaliGuru != nil && k.WaliGuru.User.NamaLengkap != "" {
			waliName = k.WaliGuru.User.NamaLengkap
			if k.WaliGuru.Gelar != "" {
				waliName = fmt.Sprintf("%s, %s", waliName, k.WaliGuru.Gelar)
			}
		}

		rombelRekap = append(rombelRekap, model.AbsensiRombelRekap{
			KelasID:         k.ID.String(),
			NamaKelas:       k.NamaKelas,
			Tingkat:         k.Tingkat,
			Jurusan:         k.Jurusan,
			WaliKelas:       waliName,
			TotalSiswa:      int(classSiswaCount),
			Hadir:           int(hadir),
			Sakit:           int(sakit),
			Izin:            int(izin),
			Alpa:            int(alpa),
			Terlambat:       int(terlambat),
			PersenKehadiran: persen,
		})
	}

	rataRataSekolah := 95.5
	if countRombelWithStudents > 0 {
		rataRataSekolah = math.Round((sumPersen/float64(countRombelWithStudents))*10) / 10
	}

	summary := model.AbsensiSummaryResponse{
		TotalSiswa:            int(totalSiswa),
		RataRataKehadiran:     rataRataSekolah,
		TotalHadirHariIni:     int(totalHadir),
		TotalSakitHariIni:     int(totalSakit),
		TotalIzinHariIni:      int(totalIzin),
		TotalAlpaHariIni:      int(totalAlpa),
		TotalTerlambatHariIni: int(totalTerlambat),
		TanggalHariIni:        tanggal,
		RombelRekap:           rombelRekap,
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Berhasil memuat ringkasan rekapitulasi presensi",
		Data:    summary,
	})
}

func (h *AbsensiHandler) GetPeringatanAbsensi(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var listSiswa []model.Siswa
	if err := db.Preload("User").Preload("Kelas.WaliGuru.User").Find(&listSiswa).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat data siswa untuk peringatan",
			Error:   err.Error(),
		})
	}

	var alerts []model.AbsensiPeringatanItem

	for _, s := range listSiswa {
		var hadir, sakit, izin, alpa, terlambat int64
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "hadir").Count(&hadir)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "sakit").Count(&sakit)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "izin").Count(&izin)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "alpa").Count(&alpa)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "terlambat").Count(&terlambat)

		totalDays := hadir + sakit + izin + alpa + terlambat
		if totalDays == 0 {
			continue
		}

		persen := math.Round((float64(hadir+terlambat)/float64(totalDays))*1000) / 10

		if alpa > 0 || persen < 85.0 || terlambat >= 2 {
			risk := "Perhatian (Pembinaan Wali Kelas)"
			if alpa >= 3 {
				risk = "Tinggi (Panggilan Orang Tua / SP 1)"
			} else if alpa >= 1 || persen < 80.0 {
				risk = "Sedang (Konseling Guru BK)"
			}

			var lastNote string
			db.Model(&model.Absensi{}).
				Where("siswa_id = ? AND status IN ('alpa', 'sakit', 'izin', 'terlambat')", s.ID).
				Order("tanggal desc").
				Limit(1).
				Pluck("catatan", &lastNote)

			namaSiswa := s.User.NamaLengkap
			if namaSiswa == "" {
				namaSiswa = "-"
			}

			namaKelas := "-"
			waliName := "-"
			kelasID := ""
			if s.Kelas != nil {
				namaKelas = s.Kelas.NamaKelas
				kelasID = s.Kelas.ID.String()
				if s.Kelas.WaliGuru != nil && s.Kelas.WaliGuru.User.NamaLengkap != "" {
					waliName = s.Kelas.WaliGuru.User.NamaLengkap
				}
			}

			alerts = append(alerts, model.AbsensiPeringatanItem{
				SiswaID:         s.ID.String(),
				NamaSiswa:       namaSiswa,
				NISN:            s.NISN,
				NIS:             s.NIS,
				KelasID:         kelasID,
				NamaKelas:       namaKelas,
				WaliKelas:       waliName,
				JumlahAlpa:      int(alpa),
				JumlahSakit:     int(sakit),
				JumlahIzin:      int(izin),
				JumlahTerlambat: int(terlambat),
				TotalHari:       int(totalDays),
				PersenKehadiran: persen,
				TingkatRisiko:   risk,
				CatatanTerakhir: lastNote,
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Berhasil memuat daftar deteksi dini presensi siswa",
		Data:    alerts,
	})
}

func (h *AbsensiHandler) GetRekapRombelDetail(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	idKelas := c.Params("id_kelas")
	if idKelas == "" {
		idKelas = c.Query("kelas_id")
	}

	query := db.Model(&model.Absensi{})

	if idKelas != "" && idKelas != "all" {
		parsedKelas, err := uuid.Parse(idKelas)
		if err == nil {
			query = query.Where("kelas_id = ?", parsedKelas)
		}
	}

	var logs []model.Absensi
	if err := query.Order("tanggal desc, created_at desc").Limit(200).Find(&logs).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat log presensi",
			Error:   err.Error(),
		})
	}

	items := make([]model.AbsensiDetailItem, 0, len(logs))
	for _, l := range logs {
		var waktuStr *string
		if l.WaktuMasuk != nil {
			s := *l.WaktuMasuk
			if len(s) >= 5 {
				s = s[:5]
			}
			waktuStr = &s
		}

		namaSiswa := "-"
		nisn := "-"
		namaKelas := "-"

		if l.Siswa != nil {
			namaSiswa = l.Siswa.User.NamaLengkap
			nisn = l.Siswa.NISN
			if l.Siswa.Kelas != nil {
				namaKelas = l.Siswa.Kelas.NamaKelas
			}
		} else if l.Kelas != nil {
			namaKelas = l.Kelas.NamaKelas
		} else {
			var student model.Siswa
			if err := db.Preload("User").Preload("Kelas").First(&student, "id = ?", l.SiswaID).Error; err == nil {
				namaSiswa = student.User.NamaLengkap
				nisn = student.NISN
				if student.Kelas != nil {
					namaKelas = student.Kelas.NamaKelas
				}
			}
		}

		items = append(items, model.AbsensiDetailItem{
			ID:         l.ID.String(),
			SiswaID:    l.SiswaID.String(),
			NamaSiswa:  namaSiswa,
			NISN:       nisn,
			NamaKelas:  namaKelas,
			Tanggal:    l.Tanggal.Format("2006-01-02"),
			WaktuMasuk: waktuStr,
			Status:     string(l.Status),
			Catatan:    l.Catatan,
		})
	}

	return c.Status(fiber.StatusOK).JSON(model.APIResponse{
		Success: true,
		Message: "Berhasil memuat rincian log kehadiran",
		Data:    items,
	})
}

func (h *AbsensiHandler) ExportAbsensiCSV(c *fiber.Ctx) error {
	db := h.getDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasID := strings.TrimSpace(c.Query("kelas_id"))
	if kelasID == "" {
		kelasID = strings.TrimSpace(c.Query("id_kelas"))
	}

	query := db.Preload("User").Preload("Kelas")
	if kelasID != "" && kelasID != "all" {
		if parsedKelas, err := uuid.Parse(kelasID); err == nil {
			query = query.Where("kelas_id = ?", parsedKelas)
		}
	}

	var listSiswa []model.Siswa
	if err := query.Order("kelas_id asc").Find(&listSiswa).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat data siswa untuk ekspor",
			Error:   err.Error(),
		})
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	headers := []string{
		"No",
		"NISN",
		"NIS",
		"Nama Peserta Didik",
		"Rombel Kelas",
		"Hadir",
		"Sakit",
		"Izin",
		"Alpa",
		"Terlambat",
		"Total Hari",
		"Persentase Kehadiran",
	}
	_ = writer.Write(headers)

	for i, s := range listSiswa {
		var hadir, sakit, izin, alpa, terlambat int64
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "hadir").Count(&hadir)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "sakit").Count(&sakit)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "izin").Count(&izin)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "alpa").Count(&alpa)
		db.Model(&model.Absensi{}).Where("siswa_id = ? AND status = ?", s.ID, "terlambat").Count(&terlambat)

		totalDays := hadir + sakit + izin + alpa + terlambat
		persen := 100.0
		if totalDays > 0 {
			persen = math.Round((float64(hadir+terlambat)/float64(totalDays))*1000) / 10
		}

		namaSiswa := s.User.NamaLengkap
		if namaSiswa == "" {
			namaSiswa = "-"
		}

		namaKelas := "-"
		if s.Kelas != nil {
			namaKelas = s.Kelas.NamaKelas
		}

		row := []string{
			strconv.Itoa(i + 1),
			s.NISN,
			s.NIS,
			namaSiswa,
			namaKelas,
			strconv.FormatInt(hadir, 10),
			strconv.FormatInt(sakit, 10),
			strconv.FormatInt(izin, 10),
			strconv.FormatInt(alpa, 10),
			strconv.FormatInt(terlambat, 10),
			strconv.FormatInt(totalDays, 10),
			fmt.Sprintf("%.1f%%", persen),
		}
		_ = writer.Write(row)
	}

	writer.Flush()

	filename := fmt.Sprintf("rekap_presensi_sekolah_%s.csv", time.Now().Format("20060102_150405"))
	c.Set("Content-Type", "text/csv")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	return c.Send(buf.Bytes())
}
