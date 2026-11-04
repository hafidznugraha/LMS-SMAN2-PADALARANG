package handler

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
)

type LaporanHandler struct{}

func NewLaporanHandler() *LaporanHandler {
	return &LaporanHandler{}
}

func (h *LaporanHandler) GetLaporanSummary(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	semester := c.Query("semester", "Ganjil")
	tahunAjaran := c.Query("tahun_ajaran", "2026/2027")

	var listKelas []model.Kelas
	if err := db.Preload("WaliGuru.User").Order("tingkat asc, nama_kelas asc").Find(&listKelas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data kelas",
			Error:   err.Error(),
		})
	}

	var laporans []model.LaporanAkademik
	db.Preload("Siswa.Kelas").Where("semester = ? AND tahun_ajaran = ?", semester, tahunAjaran).Find(&laporans)

	totalSiswa := len(laporans)
	totalDisahkan := 0
	totalMenunggu := 0
	totalDraf := 0
	sumRataRata := 0.0
	validRataCount := 0

	laporanPerKelas := make(map[uuid.UUID][]model.LaporanAkademik)
	for _, lap := range laporans {
		switch lap.StatusLaporan {
		case model.StatusLaporanDisahkanKurikulum:
			totalDisahkan++
		case model.StatusLaporanDitinjauWali:
			totalMenunggu++
		default:
			totalDraf++
		}

		if lap.RataRataAkhir != nil && *lap.RataRataAkhir > 0 {
			sumRataRata += *lap.RataRataAkhir
			validRataCount++
		}

		if lap.Siswa != nil && lap.Siswa.KelasID != nil {
			laporanPerKelas[*lap.Siswa.KelasID] = append(laporanPerKelas[*lap.Siswa.KelasID], lap)
		}
	}

	rataSekolah := 0.0
	if validRataCount > 0 {
		rataSekolah = math.Round((sumRataRata/float64(validRataCount))*100) / 100
	}

	rombelStats := make([]model.RombelStatItem, 0, len(listKelas))
	for _, k := range listKelas {
		classLaps := laporanPerKelas[k.ID]
		classTotal := len(classLaps)
		classDisahkan := 0
		classSum := 0.0
		classValid := 0
		hasRevision := false

		for _, cl := range classLaps {
			if cl.StatusLaporan == model.StatusLaporanDisahkanKurikulum {
				classDisahkan++
			}
			if cl.StatusLaporan == model.StatusLaporanDraf || cl.CatatanRevisi != "" {
				hasRevision = true
			}
			if cl.RataRataAkhir != nil && *cl.RataRataAkhir > 0 {
				classSum += *cl.RataRataAkhir
				classValid++
			}
		}

		progres := 0.0
		if classTotal > 0 {
			progres = math.Round((float64(classDisahkan)/float64(classTotal))*1000) / 10
		}

		classAvg := 0.0
		if classValid > 0 {
			classAvg = math.Round((classSum/float64(classValid))*100) / 100
		}

		statusRombel := "Menunggu Kurikulum"
		if classTotal > 0 && classDisahkan == classTotal {
			statusRombel = "Disahkan (Terkunci)"
		} else if hasRevision {
			statusRombel = "Draf / Perlu Revisi"
		}

		waliNama := "-"
		if k.WaliGuru != nil && k.WaliGuru.User.NamaLengkap != "" {
			waliNama = k.WaliGuru.User.NamaLengkap
			if k.WaliGuru.Gelar != "" && !strings.Contains(waliNama, k.WaliGuru.Gelar) {
				waliNama = fmt.Sprintf("%s, %s", waliNama, k.WaliGuru.Gelar)
			}
		}

		rombelStats = append(rombelStats, model.RombelStatItem{
			KelasID:        k.ID.String(),
			NamaKelas:      k.NamaKelas,
			Jurusan:        k.Jurusan,
			Tingkat:        k.Tingkat,
			WaliKelas:      waliNama,
			TotalSiswa:     classTotal,
			DisahkanCount:  classDisahkan,
			ProgresPersen:  progres,
			RataRataRombel: classAvg,
			StatusRombel:   statusRombel,
		})
	}

	resp := model.LaporanSummaryResponse{
		TotalSiswa:      totalSiswa,
		TotalDisahkan:   totalDisahkan,
		TotalMenunggu:   totalMenunggu,
		TotalDraf:       totalDraf,
		RataRataSekolah: rataSekolah,
		Semester:        semester,
		TahunAjaran:     tahunAjaran,
		RombelStats:     rombelStats,
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data ringkasan verifikasi raport berhasil dimuat",
		Data:    resp,
	})
}

func (h *LaporanHandler) GetLaporanByKelas(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	idKelasParam := c.Params("id_kelas")
	statusParam := c.Query("status", "")
	searchParam := strings.ToLower(strings.TrimSpace(c.Query("search", "")))
	semester := c.Query("semester", "Ganjil")
	tahunAjaran := c.Query("tahun_ajaran", "2026/2027")

	query := db.Preload("Siswa.User").
		Preload("Siswa.Kelas.WaliGuru.User").
		Where("semester = ? AND tahun_ajaran = ?", semester, tahunAjaran)

	if idKelasParam != "" && idKelasParam != "all" {
		parsedKelasID, err := uuid.Parse(idKelasParam)
		if err == nil {
			query = query.Joins("JOIN siswa s ON s.id = laporan_akademik.id_siswa").
				Where("s.kelas_id = ?", parsedKelasID)
		}
	}

	if statusParam != "" && statusParam != "all" {
		query = query.Where("status_laporan = ?", statusParam)
	}

	var laporans []model.LaporanAkademik
	if err := query.Order("created_at desc").Find(&laporans).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data laporan akademik",
			Error:   err.Error(),
		})
	}

	var allMapel []model.MataPelajaran
	db.Find(&allMapel)

	results := make([]model.StudentRaportDetailResponse, 0, len(laporans))
	for _, lap := range laporans {
		if lap.Siswa == nil {
			continue
		}

		s := lap.Siswa
		namaSiswa := s.User.NamaLengkap
		if searchParam != "" {
			if !strings.Contains(strings.ToLower(namaSiswa), searchParam) &&
				!strings.Contains(strings.ToLower(s.NIS), searchParam) &&
				!strings.Contains(strings.ToLower(s.NISN), searchParam) {
				continue
			}
		}

		rombelNama := "-"
		kelasIDStr := ""
		tingkatVal := 12
		jurusanVal := "MIPA"
		waliNama := "Dr. Siti Aminah, M.Pd"
		waliNIP := "198505152010012001"

		if s.Kelas != nil {
			rombelNama = s.Kelas.NamaKelas
			kelasIDStr = s.Kelas.ID.String()
			tingkatVal = s.Kelas.Tingkat
			jurusanVal = s.Kelas.Jurusan
			if s.Kelas.WaliGuru != nil {
				waliNIP = s.Kelas.WaliGuru.NIP
				if s.Kelas.WaliGuru.User.NamaLengkap != "" {
					waliNama = s.Kelas.WaliGuru.User.NamaLengkap
					if s.Kelas.WaliGuru.Gelar != "" && !strings.Contains(waliNama, s.Kelas.WaliGuru.Gelar) {
						waliNama = fmt.Sprintf("%s, %s", waliNama, s.Kelas.WaliGuru.Gelar)
					}
				}
			}
		}

		pengetahuanVal := 0.0
		if lap.NilaiPengetahuan != nil {
			pengetahuanVal = *lap.NilaiPengetahuan
		}
		keterampilanVal := 0.0
		if lap.NilaiKeterampilan != nil {
			keterampilanVal = *lap.NilaiKeterampilan
		}
		rataRataVal := 0.0
		if lap.RataRataAkhir != nil {
			rataRataVal = *lap.RataRataAkhir
		}

		predikatVal := lap.PredikatAkhir
		if predikatVal == "" {
			if rataRataVal >= 85 {
				predikatVal = "A"
			} else if rataRataVal >= 75 {
				predikatVal = "B"
			} else if rataRataVal >= 65 {
				predikatVal = "C"
			} else {
				predikatVal = "D"
			}
		}

		var disahkanPadaStr *string
		if lap.DisahkanPada != nil {
			tStr := lap.DisahkanPada.Format(time.RFC3339)
			disahkanPadaStr = &tStr
		}

		var nilaiRows []model.Nilai
		db.Preload("Mapel").Where("siswa_id = ?", s.ID).Find(&nilaiRows)

		mapelDetails := make([]model.NilaiMapelDetail, 0)
		if len(nilaiRows) > 0 {
			mapelScores := make(map[uuid.UUID][]model.Nilai)
			for _, nr := range nilaiRows {
				mapelScores[nr.MapelID] = append(mapelScores[nr.MapelID], nr)
			}
			for _, m := range allMapel {
				scores, exists := mapelScores[m.ID]
				if !exists {
					continue
				}
				sumScore := 0.0
				for _, sc := range scores {
					sumScore += sc.SkorAngka
				}
				scoreAvg := math.Round((sumScore/float64(len(scores)))*10) / 10
				pScore := scoreAvg
				kScore := math.Min(100, scoreAvg+1.5)
				pred := "B"
				if scoreAvg >= 85 {
					pred = "A"
				} else if scoreAvg < 75 {
					pred = "C"
				}
				capaian := fmt.Sprintf("Menunjukkan penguasaan kompetensi yang baik pada materi %s.", m.NamaMapel)
				if pred == "A" {
					capaian = fmt.Sprintf("Sangat unggul dan teliti dalam menganalisis materi %s.", m.NamaMapel)
				}
				mapelDetails = append(mapelDetails, model.NilaiMapelDetail{
					KodeMapel:    m.KodeMapel,
					NamaMapel:    m.NamaMapel,
					Kategori:     m.Kategori,
					Pengetahuan:  pScore,
					Keterampilan: kScore,
					NilaiAkhir:   scoreAvg,
					Predikat:     pred,
					Capaian:      capaian,
				})
			}
		}

		if len(mapelDetails) == 0 {
			for _, m := range allMapel {
				pScore := pengetahuanVal
				kScore := keterampilanVal
				scoreAvg := rataRataVal
				pred := predikatVal
				capaian := fmt.Sprintf("Memiliki pemahaman dan keterampilan belajar memuaskan pada mata pelajaran %s.", m.NamaMapel)
				mapelDetails = append(mapelDetails, model.NilaiMapelDetail{
					KodeMapel:    m.KodeMapel,
					NamaMapel:    m.NamaMapel,
					Kategori:     m.Kategori,
					Pengetahuan:  pScore,
					Keterampilan: kScore,
					NilaiAkhir:   scoreAvg,
					Predikat:     pred,
					Capaian:      capaian,
				})
			}
		}

		kehadiranPercent := 95
		if rataRataVal >= 88 {
			kehadiranPercent = 98
		} else if rataRataVal < 82 {
			kehadiranPercent = 91
		}

		results = append(results, model.StudentRaportDetailResponse{
			IDLaporan:         lap.ID.String(),
			SiswaID:           s.ID.String(),
			NIS:               s.NIS,
			NISN:              s.NISN,
			NamaSiswa:         namaSiswa,
			JenisKelamin:      s.JenisKelamin,
			Rombel:            rombelNama,
			KelasID:           kelasIDStr,
			Tingkat:           tingkatVal,
			Jurusan:           jurusanVal,
			WaliKelas:         waliNama,
			WaliNIP:           waliNIP,
			NilaiPengetahuan:  pengetahuanVal,
			NilaiKeterampilan: keterampilanVal,
			RataRata:          rataRataVal,
			Predikat:          predikatVal,
			DeskripsiNilai:    lap.DeskripsiNilai,
			CatatanWali:       lap.CatatanWali,
			CatatanRevisi:     lap.CatatanRevisi,
			StatusLaporan:     string(lap.StatusLaporan),
			DisahkanPada:      disahkanPadaStr,
			DisahkanOleh:      lap.DisahkanOleh,
			IsLocked:          lap.StatusLaporan == model.StatusLaporanDisahkanKurikulum,
			Kehadiran: model.KehadiranDetail{
				Persen: kehadiranPercent,
				Sakit:  1,
				Izin:   1,
				Alfa:   0,
			},
			NilaiMapel: mapelDetails,
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar laporan raport berhasil dimuat",
		Data:    results,
	})
}

func (h *LaporanHandler) GenerateLaporan(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var req model.GenerateLaporanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	if req.Semester == "" {
		req.Semester = "Ganjil"
	}
	if req.TahunAjaran == "" {
		req.TahunAjaran = "2026/2027"
	}

	query := db.Model(&model.Siswa{})
	if req.KelasID != "" && req.KelasID != "all" {
		parsedKelasID, err := uuid.Parse(req.KelasID)
		if err == nil {
			query = query.Where("kelas_id = ?", parsedKelasID)
		}
	}

	var listSiswa []model.Siswa
	if err := query.Find(&listSiswa).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal membaca daftar siswa",
			Error:   err.Error(),
		})
	}

	generatedCount := 0
	for _, s := range listSiswa {
		var existing model.LaporanAkademik
		res := db.Where("id_siswa = ? AND semester = ? AND tahun_ajaran = ?", s.ID, req.Semester, req.TahunAjaran).First(&existing)
		if res.Error == nil {
			continue
		}

		var nilaiRows []model.Nilai
		db.Where("siswa_id = ?", s.ID).Find(&nilaiRows)

		sumNilai := 0.0
		for _, nr := range nilaiRows {
			sumNilai += nr.SkorAngka
		}

		pVal := 85.0
		kVal := 86.0
		rVal := 85.5
		if len(nilaiRows) > 0 {
			rVal = math.Round((sumNilai/float64(len(nilaiRows)))*100) / 100
			pVal = rVal
			kVal = math.Min(100, rVal+1.0)
		}

		predikat := "B"
		if rVal >= 85 {
			predikat = "A"
		} else if rVal < 75 {
			predikat = "C"
		}

		deskripsi := fmt.Sprintf("Telah menuntaskan kompetensi pembelajaran semester %s tahun ajaran %s dengan predikat %s.", req.Semester, req.TahunAjaran, predikat)
		catatanWali := "Menunjukkan dedikasi dan kesungguhan belajar yang baik, pertahankan konsistensi akademik."

		newLaporan := model.LaporanAkademik{
			SiswaID:           s.ID,
			Semester:          req.Semester,
			TahunAjaran:       req.TahunAjaran,
			NilaiPengetahuan:  &pVal,
			NilaiKeterampilan: &kVal,
			RataRataAkhir:     &rVal,
			PredikatAkhir:     predikat,
			DeskripsiNilai:    deskripsi,
			CatatanWali:       catatanWali,
			StatusLaporan:     model.StatusLaporanDraf,
		}

		if err := db.Create(&newLaporan).Error; err == nil {
			generatedCount++
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Berhasil mengompilasi draf laporan akademik untuk %d siswa", generatedCount),
		Data: fiber.Map{
			"generated_count": generatedCount,
			"semester":        req.Semester,
			"tahun_ajaran":    req.TahunAjaran,
		},
	})
}

func (h *LaporanHandler) FinalizeLaporan(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	idParam := c.Params("id")
	laporanID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Laporan tidak valid",
			Error:   err.Error(),
		})
	}

	var laporan model.LaporanAkademik
	if err := db.First(&laporan, "id_laporan = ?", laporanID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data laporan akademik tidak ditemukan",
		})
	}

	officerName := "Drs. Herman Wijaya, M.M"
	now := time.Now()

	laporan.StatusLaporan = model.StatusLaporanDisahkanKurikulum
	laporan.DisahkanPada = &now
	laporan.DisahkanOleh = officerName
	laporan.CatatanRevisi = ""

	if err := db.Save(&laporan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengesahkan laporan akademik",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Rapor berhasil disahkan dan dikunci secara resmi",
		Data:    laporan,
	})
}

func (h *LaporanHandler) FinalizeBatch(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var req model.FinalizeBatchRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	officerName := "Drs. Herman Wijaya, M.M"
	now := time.Now()

	updateQuery := db.Model(&model.LaporanAkademik{})

	if len(req.LaporanIDs) > 0 {
		var validUUIDs []uuid.UUID
		for _, rawID := range req.LaporanIDs {
			if parsed, err := uuid.Parse(rawID); err == nil {
				validUUIDs = append(validUUIDs, parsed)
			}
		}
		if len(validUUIDs) > 0 {
			updateQuery = updateQuery.Where("id_laporan IN ?", validUUIDs)
		}
	} else if req.KelasID != "" && req.KelasID != "all" {
		parsedKelasID, err := uuid.Parse(req.KelasID)
		if err == nil {
			var studentIDs []uuid.UUID
			db.Model(&model.Siswa{}).Where("kelas_id = ?", parsedKelasID).Pluck("id", &studentIDs)
			if len(studentIDs) > 0 {
				updateQuery = updateQuery.Where("id_siswa IN ?", studentIDs)
			}
		}
	}

	if req.Semester != "" {
		updateQuery = updateQuery.Where("semester = ?", req.Semester)
	}
	if req.TahunAjaran != "" {
		updateQuery = updateQuery.Where("tahun_ajaran = ?", req.TahunAjaran)
	}

	res := updateQuery.Updates(map[string]interface{}{
		"status_laporan": model.StatusLaporanDisahkanKurikulum,
		"disahkan_pada":  now,
		"disahkan_oleh":  officerName,
		"catatan_revisi": "",
	})

	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengesahkan batch laporan akademik",
			Error:   res.Error.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Berhasil mengesahkan %d rapor secara kolektif", res.RowsAffected),
		Data: fiber.Map{
			"finalized_count": res.RowsAffected,
			"disahkan_oleh":   officerName,
			"disahkan_pada":   now.Format(time.RFC3339),
		},
	})
}

func (h *LaporanHandler) RevisiLaporan(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var req model.RevisiLaporanRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	laporanID, err := uuid.Parse(req.IDLaporan)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Laporan tidak valid",
			Error:   err.Error(),
		})
	}

	var laporan model.LaporanAkademik
	if err := db.First(&laporan, "id_laporan = ?", laporanID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data laporan akademik tidak ditemukan",
		})
	}

	laporan.StatusLaporan = model.StatusLaporanDraf
	laporan.CatatanRevisi = req.CatatanRevisi
	laporan.DisahkanPada = nil
	laporan.DisahkanOleh = ""

	if err := db.Save(&laporan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan pengembalian revisi",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Rapor berhasil dikembalikan ke Wali Kelas untuk perbaikan nilai",
		Data:    laporan,
	})
}

func (h *LaporanHandler) UpdateCatatanWali(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	idParam := c.Params("id")
	laporanID, err := uuid.Parse(idParam)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Laporan tidak valid",
			Error:   err.Error(),
		})
	}

	var req model.UpdateCatatanWaliRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format payload tidak valid",
			Error:   err.Error(),
		})
	}

	var laporan model.LaporanAkademik
	if err := db.First(&laporan, "id_laporan = ?", laporanID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data laporan akademik tidak ditemukan",
		})
	}

	if laporan.StatusLaporan == model.StatusLaporanDisahkanKurikulum {
		return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
			Success: false,
			Message: "Laporan telah disahkan dan dikunci oleh Kurikulum, tidak dapat diubah lagi",
		})
	}

	laporan.CatatanWali = req.CatatanWali
	laporan.StatusLaporan = model.StatusLaporanDitinjauWali

	if err := db.Save(&laporan).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui catatan wali kelas",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Catatan wali kelas berhasil disimpan dan diserahkan ke Kurikulum",
		Data:    laporan,
	})
}

func (h *LaporanHandler) ExportLegerCSV(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	semester := c.Query("semester", "Ganjil")
	tahunAjaran := c.Query("tahun_ajaran", "2026/2027")

	var laporans []model.LaporanAkademik
	if err := db.Preload("Siswa.User").
		Preload("Siswa.Kelas").
		Where("semester = ? AND tahun_ajaran = ?", semester, tahunAjaran).
		Order("created_at asc").
		Find(&laporans).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat data leger untuk ekspor",
			Error:   err.Error(),
		})
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)

	headers := []string{
		"No",
		"NISN",
		"NIS",
		"Nama Siswa",
		"Rombel",
		"Semester",
		"Tahun Ajaran",
		"Nilai Pengetahuan",
		"Nilai Keterampilan",
		"Rata-rata Akhir",
		"Predikat",
		"Status Pengesahan",
		"Catatan Wali",
	}
	if err := writer.Write(headers); err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Gagal menulis baris header CSV")
	}

	for idx, lap := range laporans {
		if lap.Siswa == nil {
			continue
		}
		rombel := "-"
		if lap.Siswa.Kelas != nil {
			rombel = lap.Siswa.Kelas.NamaKelas
		}
		pStr := "0.00"
		if lap.NilaiPengetahuan != nil {
			pStr = fmt.Sprintf("%.2f", *lap.NilaiPengetahuan)
		}
		kStr := "0.00"
		if lap.NilaiKeterampilan != nil {
			kStr = fmt.Sprintf("%.2f", *lap.NilaiKeterampilan)
		}
		rStr := "0.00"
		if lap.RataRataAkhir != nil {
			rStr = fmt.Sprintf("%.2f", *lap.RataRataAkhir)
		}

		record := []string{
			fmt.Sprintf("%d", idx+1),
			lap.Siswa.NISN,
			lap.Siswa.NIS,
			lap.Siswa.User.NamaLengkap,
			rombel,
			lap.Semester,
			lap.TahunAjaran,
			pStr,
			kStr,
			rStr,
			lap.PredikatAkhir,
			string(lap.StatusLaporan),
			lap.CatatanWali,
		}
		_ = writer.Write(record)
	}

	writer.Flush()

	c.Set("Content-Type", "text/csv; charset=utf-8")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"Leger_Nilai_%s_%s.csv\"", semester, strings.ReplaceAll(tahunAjaran, "/", "_")))
	return c.Send(buf.Bytes())
}
