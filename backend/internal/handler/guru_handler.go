package handler

import (
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/config"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/repository"
	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/service"
)

type GuruHandler struct {
	cfg *config.Config
}

func NewGuruHandler(cfg *config.Config) *GuruHandler {
	return &GuruHandler{cfg: cfg}
}

func (h *GuruHandler) isCallerKurikulum(c *fiber.Ctx) bool {
	authHeader := c.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		cfg := h.cfg
		if cfg == nil {
			cfg = config.LoadConfig()
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWTSecret), nil
		})
		if err == nil && token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if roleStr, ok := claims["role"].(string); ok && strings.EqualFold(roleStr, string(model.RoleKurikulum)) {
					return true
				}
			}
		}
	}
	return false
}

func (h *GuruHandler) getCallerGuruID(c *fiber.Ctx) (uuid.UUID, bool) {
	gStr := strings.TrimSpace(c.Query("guru_id"))
	if gStr != "" && gStr != "ALL" {
		if gUUID, err := uuid.Parse(gStr); err == nil {
			return gUUID, true
		}
	}

	if fStr := strings.TrimSpace(c.FormValue("guru_id")); fStr != "" && fStr != "ALL" {
		if gUUID, err := uuid.Parse(fStr); err == nil {
			return gUUID, true
		}
	}

	authHeader := c.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		cfg := h.cfg
		if cfg == nil {
			cfg = config.LoadConfig()
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWTSecret), nil
		})
		if err == nil && token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if roleStr, ok := claims["role"].(string); ok && roleStr == string(model.RoleKurikulum) {
					return uuid.Nil, false
				}
				if userIDStr, ok := claims["user_id"].(string); ok {
					if userUUID, err := uuid.Parse(userIDStr); err == nil {
						var g model.Guru
						if err := repository.GetDB().Where("user_id = ?", userUUID).First(&g).Error; err == nil {
							return g.ID, true
						}
					}
				}
			}
		}
	}

	return uuid.Nil, false
}

func (h *GuruHandler) GetKelasAjar(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	var activeTA model.TahunAjaran
	tahunAjaranStr := "2026/2027"
	if err := db.Where("is_aktif = ?", true).First(&activeTA).Error; err == nil && activeTA.Tahun != "" {
		tahunAjaranStr = activeTA.Tahun
	}

	guruUUID, hasCaller := h.getCallerGuruID(c)

	if !hasCaller || guruUUID == uuid.Nil {
		var list []model.Kelas
		if err := db.Select("kelas.*, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS total_siswa, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS jumlah_siswa, ? AS tahun_ajaran", tahunAjaranStr).
			Preload("WaliGuru.User").
			Order("tingkat asc, nama_kelas asc").
			Find(&list).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal mengambil data kelas",
				Error:   err.Error(),
			})
		}
		return c.JSON(model.APIResponse{
			Success: true,
			Message: "Data seluruh kelas master berhasil dimuat",
			Data:    list,
		})
	}

	var list []model.Kelas
	err := db.Select("DISTINCT kelas.*, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS total_siswa, (SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = kelas.id) AS jumlah_siswa, ? AS tahun_ajaran", tahunAjaranStr).
		Preload("WaliGuru.User").
		Joins("JOIN jadwal_pelajaran jp ON jp.kelas_id = kelas.id").
		Where("jp.guru_id = ?", guruUUID).
		Order("tingkat asc, nama_kelas asc").
		Find(&list).Error

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat kelas ajar yang dijadwalkan untuk guru",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data kelas ajar yang dijadwalkan berhasil dimuat",
		Data:    list,
	})
}

func (h *GuruHandler) GetMateriList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasID := c.Query("kelas_id")
	mapelID := c.Query("mapel_id")

	type MateriDetailResponse struct {
		ID            uuid.UUID `json:"id"`
		IDMateri      string    `json:"id_materi"`
		GuruID        uuid.UUID `json:"guru_id"`
		IDGuru        string    `json:"id_guru"`
		MapelID       uuid.UUID `json:"mapel_id"`
		IDMapel       string    `json:"id_mapel"`
		NamaMapel     string    `json:"nama_mapel"`
		KelasID       uuid.UUID `json:"kelas_id"`
		IDKelas       string    `json:"id_kelas"`
		NamaKelas     string    `json:"nama_kelas"`
		Judul         string    `json:"judul"`
		JudulMateri   string    `json:"judul_materi"`
		Deskripsi     string    `json:"deskripsi"`
		FileURL       string    `json:"file_url"`
		TipeFile      string    `json:"tipe_file"`
		FormatFile    string    `json:"format_file"`
		UkuranMB      float64   `json:"ukuran_mb"`
		JumlahMelihat int       `json:"jumlah_melihat"`
		UnduhanCount  int       `json:"unduhan_count"`
		TanggalUnggah string    `json:"tanggal_unggah"`
		CreatedAt     time.Time `json:"created_at"`
	}

	query := db.Table("materi m").
		Select(`
			m.id,
			m.id as id_materi,
			m.guru_id,
			m.guru_id as id_guru,
			m.mapel_id,
			m.mapel_id as id_mapel,
			COALESCE(mp.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			m.kelas_id,
			m.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Semua Kelas') as nama_kelas,
			m.judul,
			m.judul as judul_materi,
			m.deskripsi,
			m.file_url,
			COALESCE(m.tipe_file, 'PDF') as tipe_file,
			COALESCE(m.tipe_file, 'PDF') as format_file,
			COALESCE(m.ukuran_mb, 0) as ukuran_mb,
			COALESCE((SELECT COUNT(DISTINCT mus.siswa_id) FROM materi_unduhan_siswa mus WHERE mus.materi_id = m.id), m.jumlah_melihat, 0) as jumlah_melihat,
			COALESCE((SELECT COUNT(DISTINCT mus.siswa_id) FROM materi_unduhan_siswa mus WHERE mus.materi_id = m.id), m.jumlah_melihat, 0) as unduhan_count,
			to_char(m.created_at, 'YYYY-MM-DD HH24:MI') as tanggal_unggah,
			m.created_at
		`).
		Joins("LEFT JOIN mata_pelajaran mp ON mp.id = m.mapel_id").
		Joins("LEFT JOIN kelas k ON k.id = m.kelas_id")

	if kelasUUID, err := uuid.Parse(kelasID); err == nil {
		query = query.Where("m.kelas_id = ?", kelasUUID)
	}
	if mapelUUID, err := uuid.Parse(mapelID); err == nil {
		query = query.Where("m.mapel_id = ?", mapelUUID)
	}
	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		query = query.Where("m.guru_id = ?", callerGuruUUID)
	}

	var materiList []MateriDetailResponse
	if err := query.Order("m.created_at DESC").Scan(&materiList).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar materi dari Supabase",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar materi berhasil dimuat",
		Data:    materiList,
	})
}

func (h *GuruHandler) CreateMateri(c *fiber.Ctx) error {
	var req model.CreateMateriRequest
	_ = c.BodyParser(&req)

	if v := strings.TrimSpace(c.FormValue("judul")); v != "" && req.Judul == "" {
		req.Judul = v
	}
	if v := c.FormValue("deskripsi"); v != "" && req.Deskripsi == "" {
		req.Deskripsi = v
	}
	if v := strings.TrimSpace(c.FormValue("kelas_id")); v != "" && req.KelasID == "" {
		req.KelasID = v
	}
	if v := strings.TrimSpace(c.FormValue("guru_id")); v != "" && req.GuruID == "" {
		req.GuruID = v
	}
	if v := strings.TrimSpace(c.FormValue("mapel_id")); v != "" && req.MapelID == "" {
		req.MapelID = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe_file")); v != "" && req.TipeFile == "" {
		req.TipeFile = v
	}
	if v := strings.TrimSpace(c.FormValue("tipe")); v != "" && req.Tipe == "" {
		req.Tipe = v
	}
	if v := strings.TrimSpace(c.FormValue("file_url")); v != "" && req.FileURL == "" {
		req.FileURL = v
	}

	if strings.TrimSpace(req.Judul) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul materi wajib diisi",
		})
	}

	db := repository.GetDB()

	callerGuruUUID, hasCaller := h.getCallerGuruID(c)
	guruUUID, err := uuid.Parse(req.GuruID)
	if hasCaller {
		guruUUID = callerGuruUUID
	} else if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil || kelasUUID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Target rombel/kelas wajib dipilih",
		})
	}

	if !h.isCallerKurikulum(c) {
		var countJadwal int64
		if err := db.Model(&model.JadwalPelajaran{}).Where("guru_id = ? AND kelas_id = ?", guruUUID, kelasUUID).Count(&countJadwal).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal memverifikasi wewenang kelas mengajar",
				Error:   err.Error(),
			})
		}
		if countJadwal == 0 {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki jadwal mengajar resmi pada kelas yang dipilih",
			})
		}
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil || mapelUUID == uuid.Nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001")
		}
	}

	tipeFile := strings.TrimSpace(req.TipeFile)
	if tipeFile == "" {
		tipeFile = strings.TrimSpace(req.Tipe)
	}
	if tipeFile == "" {
		tipeFile = "PDF"
	}
	tipeFile = strings.ToUpper(tipeFile)

	ukuran := req.UkuranMB
	if ukuran <= 0 {
		ukuran = 3.5
	}

	fileURL := strings.TrimSpace(req.FileURL)
	if fileURL == "" {
		fileURL = "https://storage.sman2padalarang.sch.id/materi/berkas_materi_ajar.pdf"
	}

	materiID := uuid.New()

	if savedURL, mb, detectedTipe, ok := processMateriUpload(c, h.cfg, materiID, tipeFile); ok {
		fileURL = savedURL
		ukuran = mb
		if detectedTipe != "" {
			tipeFile = detectedTipe
		}
	}

	newMateri := model.Materi{
		ID:            materiID,
		GuruID:        guruUUID,
		MapelID:       mapelUUID,
		KelasID:       kelasUUID,
		Judul:         req.Judul,
		Deskripsi:     req.Deskripsi,
		FileURL:       fileURL,
		TipeFile:      tipeFile,
		UkuranMB:      ukuran,
		JumlahMelihat: 0,
		CreatedAt:     time.Now(),
	}

	if err := db.Create(&newMateri).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan materi ke Supabase: " + err.Error(),
			Error:   err.Error(),
		})
	}

	namaGuru := service.FormatNamaGuruWithGelar(db, guruUUID)
	var namaMapel string
	var mapel model.MataPelajaran
	if err := db.Where("id = ?", mapelUUID).First(&mapel).Error; err == nil && mapel.NamaMapel != "" {
		namaMapel = mapel.NamaMapel
	} else {
		namaMapel = "Mata Pelajaran"
	}

	judulNotif := fmt.Sprintf("Materi Baru: %s", newMateri.Judul)
	pesanNotif := fmt.Sprintf("%s mengunggah materi baru untuk mata pelajaran %s.", namaGuru, namaMapel)
	if _, errNotif := service.KirimKeKelas(db, kelasUUID, judulNotif, pesanNotif, "materi", "/siswa/materi"); errNotif != nil {
		log.Printf("[WARN] Gagal mengirim notifikasi materi ke kelas %s: %v\n", kelasUUID, errNotif)
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Materi berhasil ditambahkan ke Supabase",
		Data:    newMateri,
	})
}

func (h *GuruHandler) DeleteMateri(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID materi tidak valid",
		})
	}

	db := repository.GetDB()

	var materi model.Materi
	if err := db.Where("id = ?", targetID).First(&materi).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Materi tidak ditemukan",
		})
	}

	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		if materi.GuruID != callerGuruUUID {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki izin untuk menghapus materi milik guru lain",
			})
		}
	}

	if matches, errGlob := filepath.Glob(filepath.Join("uploads", "materi", targetID.String()+".*")); errGlob == nil {
		for _, m := range matches {
			_ = os.Remove(m)
		}
	}

	if strings.Contains(materi.FileURL, "/storage/v1/object/public/materi-pelajaran/") {
		parts := strings.Split(materi.FileURL, "/storage/v1/object/public/materi-pelajaran/")
		if len(parts) == 2 && parts[1] != "" {
			deleteFileFromSupabaseStorage(h.cfg, parts[1])
		}
	}

	res := db.Delete(&model.Materi{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus materi",
			Error:   res.Error.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Materi berhasil dihapus",
	})
}

func (h *GuruHandler) GetTugasList(c *fiber.Ctx) error {
	db := repository.GetDB()
	kelasID := c.Query("kelas_id")

	var list []model.TugasDetailResponse
	query := db.Table("tugas t").
		Select(`
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			COALESCE(u.nama_lengkap, '') as nama_guru,
			COALESCE(g.gelar, '') as gelar_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			COALESCE(t.format_file, 'pdf, docx') as format_file,
			COALESCE(t.file_lampiran, '') as file_lampiran,
			COALESCE(t.topik, '') as topik,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) as jumlah_mengumpulkan,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id AND pt.status = 'dinilai') as jumlah_dinilai,
			t.created_at
		`).
		Joins("LEFT JOIN guru g ON g.id = t.guru_id").
		Joins("LEFT JOIN users u ON u.id = g.user_id").
		Joins("LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id").
		Joins("LEFT JOIN kelas k ON k.id = t.kelas_id")

	if kelasUUID, err := uuid.Parse(kelasID); err == nil {
		query = query.Where("t.kelas_id = ?", kelasUUID)
	}

	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		query = query.Where("t.guru_id = ?", callerGuruUUID)
	}

	if err := query.Order("t.created_at DESC").Scan(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar tugas",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar tugas berhasil dimuat",
		Data:    list,
	})
}

func (h *GuruHandler) GetTugasDetail(c *fiber.Ctx) error {
	idStr := strings.TrimSpace(c.Params("id"))
	tugasUUID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	db := repository.GetDB()
	var detail model.TugasDetailResponse
	query := `
		SELECT 
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			COALESCE(u.nama_lengkap, '') as nama_guru,
			COALESCE(g.gelar, '') as gelar_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			COALESCE(t.format_file, 'pdf, docx') as format_file,
			COALESCE(t.file_lampiran, '') as file_lampiran,
			COALESCE(t.topik, '') as topik,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) as jumlah_mengumpulkan,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id AND pt.status = 'dinilai') as jumlah_dinilai,
			t.created_at
		FROM tugas t
		LEFT JOIN guru g ON g.id = t.guru_id
		LEFT JOIN users u ON u.id = g.user_id
		LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id
		LEFT JOIN kelas k ON k.id = t.kelas_id
		WHERE t.id = ?
	`

	if err := db.Raw(query, tugasUUID).Scan(&detail).Error; err != nil || detail.ID == uuid.Nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Detail tugas berhasil dimuat",
		Data:    detail,
	})
}

func (h *GuruHandler) CreateTugas(c *fiber.Ctx) error {
	var req model.CreateTugasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data tugas tidak valid: " + err.Error(),
		})
	}

	if strings.TrimSpace(req.Judul) == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Judul tugas wajib diisi",
		})
	}

	db := repository.GetDB()

	callerGuruUUID, hasCaller := h.getCallerGuruID(c)
	guruUUID, err := uuid.Parse(req.GuruID)
	if hasCaller {
		guruUUID = callerGuruUUID
	} else if err != nil {
		guruUUID = uuid.MustParse("298257fb-b4aa-4710-afaa-bbfd63abd5c5")
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil || kelasUUID == uuid.Nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Target rombel/kelas wajib dipilih",
		})
	}

	if !h.isCallerKurikulum(c) {
		var countJadwal int64
		if err := db.Model(&model.JadwalPelajaran{}).Where("guru_id = ? AND kelas_id = ?", guruUUID, kelasUUID).Count(&countJadwal).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal memverifikasi wewenang kelas mengajar",
				Error:   err.Error(),
			})
		}
		if countJadwal == 0 {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki jadwal mengajar resmi pada kelas yang dipilih",
			})
		}
	}

	mapelUUID, err := uuid.Parse(req.MapelID)
	if err != nil || mapelUUID == uuid.Nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		} else {
			mapelUUID = uuid.MustParse("20000000-0000-0000-0000-000000000001")
		}
	}

	deadlineStr := strings.TrimSpace(req.Deadline)
	if deadlineStr == "" {
		deadlineStr = strings.TrimSpace(req.TenggatWaktu)
	}

	if deadlineStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Tenggat waktu (deadline) wajib ditentukan",
		})
	}

	var deadlineTime time.Time
	layouts := []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04",
		"2006-01-02T15:04:05Z07:00",
		"2006-01-02T15:04:05.000Z",
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04",
		"2006-01-02",
	}
	for _, layout := range layouts {
		t, errParse := time.Parse(layout, deadlineStr)
		if errParse == nil {
			deadlineTime = t
			break
		}
	}

	if deadlineTime.IsZero() {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format tenggat waktu tidak valid. Gunakan pemilih tanggal dan jam yang benar",
		})
	}

	if deadlineTime.Before(time.Now().Add(-5 * time.Minute)) {
		return c.Status(fiber.StatusUnprocessableEntity).JSON(model.APIResponse{
			Success: false,
			Message: "Tenggat waktu penugasan tidak boleh berada di masa lalu",
		})
	}

	deskripsi := strings.TrimSpace(req.Deskripsi)
	if deskripsi == "" {
		deskripsi = strings.TrimSpace(req.Instruksi)
	}

	formatFile := strings.TrimSpace(req.FormatFile)
	if formatFile == "" {
		formatFile = "pdf, docx"
	}

	topik := strings.TrimSpace(req.Topik)
	if topik == "Tidak ada topik" {
		topik = ""
	}
	if topik != "" {
		var existingTopik model.TopikTugas
		if err := db.Where("kelas_id = ? AND mapel_id = ? AND LOWER(nama_topik) = LOWER(?)", kelasUUID, mapelUUID, topik).First(&existingTopik).Error; err != nil {
			_ = db.Create(&model.TopikTugas{
				ID:        uuid.New(),
				KelasID:   kelasUUID,
				MapelID:   mapelUUID,
				GuruID:    &guruUUID,
				NamaTopik: topik,
				CreatedAt: time.Now(),
			})
		}
	}

	newID := uuid.New()
	now := time.Now()
	newTugas := model.Tugas{
		ID:           newID,
		GuruID:       guruUUID,
		MapelID:      mapelUUID,
		KelasID:      kelasUUID,
		Judul:        req.Judul,
		Deskripsi:    deskripsi,
		FormatFile:   formatFile,
		FileLampiran: strings.TrimSpace(req.FileLampiran),
		Topik:        topik,
		Deadline:     deadlineTime,
		CreatedAt:    now,
	}

	if err := db.Create(&newTugas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan tugas ke Supabase: " + err.Error(),
			Error:   err.Error(),
		})
	}

	namaGuru := service.FormatNamaGuruWithGelar(db, guruUUID)
	var namaMapel string
	var mapel model.MataPelajaran
	if err := db.Where("id = ?", mapelUUID).First(&mapel).Error; err == nil && mapel.NamaMapel != "" {
		namaMapel = mapel.NamaMapel
	} else {
		namaMapel = "Mata Pelajaran"
	}

	deadlineIndo := service.FormatDeadlineIndo(newTugas.Deadline)
	judulNotif := fmt.Sprintf("Tugas Baru: %s", newTugas.Judul)
	pesanNotif := fmt.Sprintf("%s menerbitkan tugas baru untuk mata pelajaran %s. Tenggat waktu: %s.", namaGuru, namaMapel, deadlineIndo)
	if _, errNotif := service.KirimKeKelas(db, kelasUUID, judulNotif, pesanNotif, "tugas", "/siswa/tugas"); errNotif != nil {
		log.Printf("[WARN] Gagal mengirim notifikasi tugas ke kelas %s: %v\n", kelasUUID, errNotif)
	}

	var detail model.TugasDetailResponse
	queryDetail := `
		SELECT 
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			COALESCE(t.format_file, 'pdf, docx') as format_file,
			COALESCE(t.file_lampiran, '') as file_lampiran,
			COALESCE(t.topik, '') as topik,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			0 as jumlah_mengumpulkan,
			0 as jumlah_dinilai,
			t.created_at
		FROM tugas t
		LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id
		LEFT JOIN kelas k ON k.id = t.kelas_id
		WHERE t.id = ?
	`
	_ = db.Raw(queryDetail, newID).Scan(&detail)

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil diterbitkan dan masuk ke Supabase",
		Data:    detail,
	})
}

func (h *GuruHandler) UpdateTugas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	var req model.UpdateTugasRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data tugas tidak valid: " + err.Error(),
		})
	}

	db := repository.GetDB()
	var existing model.Tugas
	if err := db.Where("id = ?", targetID).First(&existing).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		if existing.GuruID != callerGuruUUID {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki izin untuk mengedit tugas milik guru lain",
			})
		}
	}

	if strings.TrimSpace(req.Judul) != "" {
		existing.Judul = strings.TrimSpace(req.Judul)
	}
	deskripsi := strings.TrimSpace(req.Deskripsi)
	if deskripsi == "" {
		deskripsi = strings.TrimSpace(req.Instruksi)
	}
	if deskripsi != "" {
		existing.Deskripsi = deskripsi
	}
	if strings.TrimSpace(req.KelasID) != "" {
		kelasUUID, err := uuid.Parse(req.KelasID)
		if err != nil || kelasUUID == uuid.Nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "ID kelas tidak valid",
			})
		}
		if !h.isCallerKurikulum(c) {
			checkGuruUUID := existing.GuruID
			if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
				checkGuruUUID = callerGuruUUID
			}
			var countJadwal int64
			if err := db.Model(&model.JadwalPelajaran{}).Where("guru_id = ? AND kelas_id = ?", checkGuruUUID, kelasUUID).Count(&countJadwal).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal memverifikasi wewenang kelas mengajar",
					Error:   err.Error(),
				})
			}
			if countJadwal == 0 {
				return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
					Success: false,
					Message: "Anda tidak memiliki jadwal mengajar resmi pada kelas yang dipilih",
				})
			}
		}
		existing.KelasID = kelasUUID
	}
	if mapelUUID, err := uuid.Parse(req.MapelID); err == nil && mapelUUID != uuid.Nil {
		existing.MapelID = mapelUUID
	}
	if strings.TrimSpace(req.FormatFile) != "" {
		existing.FormatFile = strings.TrimSpace(req.FormatFile)
	}
	if req.FileLampiran != "" || strings.Contains(string(c.Body()), "file_lampiran") {
		existing.FileLampiran = strings.TrimSpace(req.FileLampiran)
	}
	if req.Topik != "" || strings.Contains(string(c.Body()), "topik") {
		topik := strings.TrimSpace(req.Topik)
		if topik == "Tidak ada topik" {
			topik = ""
		}
		existing.Topik = topik
		if topik != "" {
			var existingTopik model.TopikTugas
			if err := db.Where("kelas_id = ? AND mapel_id = ? AND LOWER(nama_topik) = LOWER(?)", existing.KelasID, existing.MapelID, topik).First(&existingTopik).Error; err != nil {
				_ = db.Create(&model.TopikTugas{
					ID:        uuid.New(),
					KelasID:   existing.KelasID,
					MapelID:   existing.MapelID,
					GuruID:    &existing.GuruID,
					NamaTopik: topik,
					CreatedAt: time.Now(),
				})
			}
		}
	}

	deadlineStr := strings.TrimSpace(req.Deadline)
	if deadlineStr == "" {
		deadlineStr = strings.TrimSpace(req.TenggatWaktu)
	}
	if deadlineStr != "" {
		layouts := []string{
			"2006-01-02 15:04:05",
			"2006-01-02 15:04",
			"2006-01-02T15:04:05Z07:00",
			"2006-01-02T15:04:05.000Z",
			"2006-01-02T15:04:05Z",
			"2006-01-02T15:04",
			"2006-01-02",
		}
		var parsedDeadline time.Time
		for _, layout := range layouts {
			t, errParse := time.Parse(layout, deadlineStr)
			if errParse == nil {
				parsedDeadline = t
				break
			}
		}
		if parsedDeadline.IsZero() {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Format tenggat waktu tidak valid. Gunakan pemilih tanggal dan jam yang benar",
			})
		}
		existing.Deadline = parsedDeadline
	}

	if err := db.Save(&existing).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memperbarui tugas: " + err.Error(),
			Error:   err.Error(),
		})
	}

	var detail model.TugasDetailResponse
	queryDetail := `
		SELECT 
			t.id,
			t.id as id_tugas_kuis,
			t.guru_id,
			t.guru_id as id_guru,
			t.mapel_id,
			t.mapel_id as id_mapel,
			COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel,
			COALESCE(m.kode_mapel, '') as kode_mapel,
			t.kelas_id,
			t.kelas_id as id_kelas,
			COALESCE(k.nama_kelas, 'Kelas') as nama_kelas,
			t.judul,
			t.deskripsi,
			t.deskripsi as instruksi,
			CASE 
				WHEN LOWER(t.judul) LIKE '%proyek%' THEN 'Proyek'
				ELSE 'Tugas'
			END as jenis,
			to_char(t.deadline, 'YYYY-MM-DD HH24:MI:SS') as tenggat_waktu,
			t.deadline,
			COALESCE(t.format_file, 'pdf, docx') as format_file,
			COALESCE(t.file_lampiran, '') as file_lampiran,
			COALESCE(t.topik, '') as topik,
			'1. Ketepatan konsep keilmuan (40%)\n2. Sistematika dan kerapian langkah (30%)\n3. Kesimpulan jawaban akhir (30%)' as rubrik_penilaian,
			(SELECT COUNT(*) FROM siswa s WHERE s.kelas_id = t.kelas_id) as total_siswa,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id) as jumlah_mengumpulkan,
			(SELECT COUNT(*) FROM pengumpulan_tugas pt WHERE pt.tugas_id = t.id AND pt.status = 'dinilai') as jumlah_dinilai,
			t.created_at
		FROM tugas t
		LEFT JOIN mata_pelajaran m ON m.id = t.mapel_id
		LEFT JOIN kelas k ON k.id = t.kelas_id
		WHERE t.id = ?
	`
	_ = db.Raw(queryDetail, targetID).Scan(&detail)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil diperbarui",
		Data:    detail,
	})
}

func (h *GuruHandler) DeleteTugas(c *fiber.Ctx) error {
	idStr := c.Params("id")
	targetID, err := uuid.Parse(idStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	db := repository.GetDB()

	var existing model.Tugas
	if err := db.Where("id = ?", targetID).First(&existing).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		if existing.GuruID != callerGuruUUID {
			return c.Status(fiber.StatusForbidden).JSON(model.APIResponse{
				Success: false,
				Message: "Anda tidak memiliki izin untuk menghapus tugas milik guru lain",
			})
		}
	}

	_ = db.Where("tugas_id = ?", targetID).Delete(&model.PengumpulanTugas{}).Error

	res := db.Delete(&model.Tugas{}, "id = ?", targetID)
	if res.Error != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus tugas: " + res.Error.Error(),
			Error:   res.Error.Error(),
		})
	}
	if res.RowsAffected == 0 {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Tugas berhasil dihapus",
	})
}

func (h *GuruHandler) GetTopikList(c *fiber.Ctx) error {
	kelasIDStr := strings.TrimSpace(c.Query("kelas_id"))
	mapelIDStr := strings.TrimSpace(c.Query("mapel_id"))

	db := repository.GetDB()
	query := db.Model(&model.TopikTugas{})

	if kelasIDStr != "" {
		if kUUID, err := uuid.Parse(kelasIDStr); err == nil {
			query = query.Where("kelas_id = ?", kUUID)
		}
	}
	if mapelIDStr != "" {
		if mUUID, err := uuid.Parse(mapelIDStr); err == nil {
			query = query.Where("mapel_id = ?", mUUID)
		}
	}

	var topics []model.TopikTugas
	if err := query.Order("created_at ASC").Find(&topics).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat daftar topik",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar topik berhasil dimuat",
		Data:    topics,
	})
}

func (h *GuruHandler) CreateTopik(c *fiber.Ctx) error {
	var req model.CreateTopikRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data topik tidak valid",
		})
	}

	namaTopik := strings.TrimSpace(req.NamaTopik)
	if namaTopik == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Nama topik tidak boleh kosong",
		})
	}
	if len(namaTopik) > 100 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Nama topik maksimal 100 karakter",
		})
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Kelas ID tidak valid",
		})
	}

	var mapelUUID uuid.UUID
	if strings.TrimSpace(req.MapelID) != "" {
		mUUID, err := uuid.Parse(req.MapelID)
		if err == nil {
			mapelUUID = mUUID
		}
	}

	var callerGuruUUID *uuid.UUID
	if gUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		callerGuruUUID = &gUUID
	}

	db := repository.GetDB()

	if mapelUUID == uuid.Nil {
		var existingTugas model.Tugas
		if err := db.Where("kelas_id = ?", kelasUUID).First(&existingTugas).Error; err == nil {
			mapelUUID = existingTugas.MapelID
		} else {
			var guruModel model.Guru
			if callerGuruUUID != nil && db.Where("id = ?", *callerGuruUUID).First(&guruModel).Error == nil && guruModel.MapelID != nil {
				mapelUUID = *guruModel.MapelID
			}
		}
	}

	var existing model.TopikTugas
	checkQuery := db.Where("kelas_id = ? AND LOWER(nama_topik) = LOWER(?)", kelasUUID, namaTopik)
	if mapelUUID != uuid.Nil {
		checkQuery = checkQuery.Where("mapel_id = ?", mapelUUID)
	}
	if err := checkQuery.First(&existing).Error; err == nil {
		return c.JSON(model.APIResponse{
			Success: true,
			Message: "Topik sudah tersedia",
			Data:    existing,
		})
	}

	newTopik := model.TopikTugas{
		ID:        uuid.New(),
		KelasID:   kelasUUID,
		MapelID:   mapelUUID,
		GuruID:    callerGuruUUID,
		NamaTopik: namaTopik,
		CreatedAt: time.Now(),
	}

	if err := db.Create(&newTopik).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal membuat topik: " + err.Error(),
			Error:   err.Error(),
		})
	}

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Topik berhasil dibuat",
		Data:    newTopik,
	})
}

func (h *GuruHandler) UploadLampiranTugas(c *fiber.Ctx) error {
	fileHeader, err := c.FormFile("file")
	if err != nil || fileHeader == nil || fileHeader.Size == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Berkas lampiran tidak ditemukan atau kosong",
		})
	}

	if fileHeader.Size > 50*1024*1024 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Ukuran berkas lampiran melebihi batas maksimal 50 MB",
		})
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		ext = ".pdf"
	}

	file, err := fileHeader.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal membuka berkas lampiran: " + err.Error(),
		})
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil || len(data) == 0 {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal membaca isi berkas lampiran",
		})
	}

	storageFilename := fmt.Sprintf("lampiran_%s%s", uuid.New().String(), ext)
	mime := mimeTypeByExt(ext)

	uploadDir := filepath.Join("uploads", "lampiran")
	if err := os.MkdirAll(uploadDir, 0755); err == nil {
		destPath := filepath.Join(uploadDir, storageFilename)
		_ = os.WriteFile(destPath, data, 0644)
	}

	fileURL := "/uploads/lampiran/" + storageFilename
	supabasePublicURL, errSupabase := uploadFileToSupabaseStorage(h.cfg, storageFilename, data, mime)
	if errSupabase == nil && supabasePublicURL != "" {
		fileURL = supabasePublicURL
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Berkas lampiran berhasil diunggah",
		Data: fiber.Map{
			"file_url":  fileURL,
			"file_name": fileHeader.Filename,
			"file_size": fileHeader.Size,
			"mime_type": mime,
		},
	})
}

func (h *GuruHandler) GetTugasSubmissions(c *fiber.Ctx) error {
	tugasIDStr := c.Params("id")
	tugasUUID, err := uuid.Parse(tugasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas tidak valid",
		})
	}

	db := repository.GetDB()
	var results []model.SubmissionWithSiswa

	query := `
		SELECT 
			COALESCE(pt.id, gen_random_uuid()) as id,
			COALESCE(pt.id, gen_random_uuid()) as id_pengumpulan,
			t.id as tugas_id,
			t.id as id_tugas_kuis,
			s.id as siswa_id,
			s.id as id_siswa,
			u.nama_lengkap as nama_siswa,
			s.nis,
			k.nama_kelas,
			COALESCE(pt.file_url, '') as file_tugas,
			COALESCE(NULLIF(regexp_replace(pt.file_url, '^.*/', ''), ''), '') as file_name,
			COALESCE(pt.catatan, '') as catatan_siswa,
			COALESCE(pt.submitted_at, t.created_at) as waktu_kirim,
			COALESCE(to_char(pt.submitted_at, 'YYYY-MM-DD HH24:MI:SS'), '') as tanggal_kumpul,
			pt.nilai,
			COALESCE(pt.feedback_guru, '') as catatan_guru,
			COALESCE(pt.feedback_guru, '') as feedback_guru,
			COALESCE(pt.feedback_guru, '') as feedback,
			CASE 
				WHEN pt.id IS NULL THEN 'Belum Mengumpulkan'
				WHEN pt.submitted_at <= t.deadline THEN 'Tepat Waktu'
				ELSE 'Terlambat'
			END as status_penilaian,
			CASE 
				WHEN pt.id IS NULL THEN 'Belum Mengumpulkan'
				WHEN pt.submitted_at <= t.deadline THEN 'Tepat Waktu'
				ELSE 'Terlambat'
			END as status_kumpul
		FROM tugas t
		JOIN kelas k ON k.id = t.kelas_id
		JOIN siswa s ON s.kelas_id = t.kelas_id
		JOIN users u ON u.id = s.user_id
		LEFT JOIN pengumpulan_tugas pt ON pt.tugas_id = t.id AND pt.siswa_id = s.id
		WHERE t.id = ?
		ORDER BY u.nama_lengkap ASC
	`

	if err := db.Raw(query, tugasUUID).Scan(&results).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat lembar jawaban siswa",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data pengumpulan tugas berhasil dimuat",
		Data:    results,
	})
}

func (h *GuruHandler) GetTugasSiswa(c *fiber.Ctx) error {
	kelasIDStr := c.Query("kelas_id")
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas siswa wajib disertakan",
		})
	}

	db := repository.GetDB()
	var listTugas []model.Tugas

	if err := db.Where("kelas_id = ?", kelasUUID).Order("deadline ASC").Find(&listTugas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat tugas siswa",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar tugas kelas siswa berhasil dimuat",
		Data:    listTugas,
	})
}

func (h *GuruHandler) GradeSubmission(c *fiber.Ctx) error {
	subIDStr := c.Params("id")
	subUUID, err := uuid.Parse(subIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID pengumpulan tidak valid",
		})
	}

	var req model.GradeSubmissionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload penilaian tidak valid",
		})
	}

	if req.Nilai < 0 || req.Nilai > 100 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Skor nilai harus berada pada rentang 0 sampai 100",
		})
	}

	feedback := strings.TrimSpace(req.FeedbackGuru)
	if feedback == "" {
		feedback = strings.TrimSpace(req.Feedback)
	}
	if feedback == "" {
		feedback = strings.TrimSpace(req.CatatanGuru)
	}
	if feedback == "" {
		feedback = strings.TrimSpace(req.Catatan)
	}

	now := time.Now()
	db := repository.GetDB()

	var existing model.PengumpulanTugas
	checkErr := db.Where("id = ?", subUUID).First(&existing).Error

	if checkErr != nil {
		tugasUUID, errT := uuid.Parse(req.TugasID)
		siswaUUID, errS := uuid.Parse(req.SiswaID)
		if errT == nil && errS == nil {
			var bySiswa model.PengumpulanTugas
			if db.Where("tugas_id = ? AND siswa_id = ?", tugasUUID, siswaUUID).First(&bySiswa).Error == nil {
				subUUID = bySiswa.ID
				existing = bySiswa
				checkErr = nil
			} else {
				return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
					Success: false,
					Message: "Siswa belum mengumpulkan tugas. Penilaian hanya dapat diberikan setelah siswa mengumpulkan tugas.",
				})
			}
		} else {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Data pengumpulan tugas tidak ditemukan atau siswa belum mengumpulkan tugas",
			})
		}
	}

	if checkErr == nil {
		res := db.Model(&model.PengumpulanTugas{}).
			Where("id = ?", subUUID).
			Updates(map[string]interface{}{
				"nilai":         req.Nilai,
				"feedback_guru": feedback,
				"status":        "dinilai",
				"graded_at":     &now,
			})
		if res.Error != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
				Success: false,
				Message: "Gagal menyimpan penilaian: " + res.Error.Error(),
			})
		}
	} else {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data pengumpulan tugas tidak ditemukan",
		})
	}

	var tugas model.Tugas
	if err := db.Where("id = ?", existing.TugasID).First(&tugas).Error; err == nil {
		var nilaiRecord model.Nilai
		skorHuruf := "E"
		switch {
		case req.Nilai >= 85:
			skorHuruf = "A"
		case req.Nilai >= 75:
			skorHuruf = "B"
		case req.Nilai >= 65:
			skorHuruf = "C"
		case req.Nilai >= 50:
			skorHuruf = "D"
		}

		errNilai := db.Where("siswa_id = ? AND mapel_id = ? AND jenis_penilaian = ?", existing.SiswaID, tugas.MapelID, model.PenilaianTugas).First(&nilaiRecord).Error
		if errNilai == nil {
			db.Model(&nilaiRecord).Updates(map[string]interface{}{
				"skor_angka": req.Nilai,
				"skor_huruf": skorHuruf,
				"feedback":   feedback,
				"updated_at": now,
			})
		} else {
			newNilai := model.Nilai{
				ID:             uuid.New(),
				SiswaID:        existing.SiswaID,
				GuruID:         tugas.GuruID,
				MapelID:        tugas.MapelID,
				JenisPenilaian: model.PenilaianTugas,
				SkorAngka:      req.Nilai,
				SkorHuruf:      skorHuruf,
				Feedback:       feedback,
				CreatedAt:      now,
				UpdatedAt:      now,
			}
			_ = db.Create(&newNilai).Error
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai dan umpan balik berhasil disimpan",
		Data: map[string]interface{}{
			"id":            subUUID,
			"nilai":         req.Nilai,
			"feedback_guru": feedback,
			"status":        "dinilai",
			"graded_at":     now,
		},
	})
}

func (h *GuruHandler) GetAbsensiKelas(c *fiber.Ctx) error {
	kelasIDStr := c.Params("kelas_id")
	if kelasIDStr == "" {
		kelasIDStr = c.Query("kelas_id")
	}
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001")
	}

	tanggal := c.Query("tanggal", time.Now().Format("2006-01-02"))
	tglParsed, errParse := time.Parse("2006-01-02", tanggal)
	if errParse != nil {
		tglParsed = time.Now()
		tanggal = tglParsed.Format("2006-01-02")
	}

	isWeekend := tglParsed.Weekday() == time.Sunday || tglParsed.Weekday() == time.Saturday

	db := repository.GetDB()
	type AbsensiRow struct {
		ID                   uuid.UUID `json:"id"`
		IDAbsensi            string    `json:"id_absensi"`
		SiswaID              uuid.UUID `json:"siswa_id"`
		IDSiswa              string    `json:"id_siswa"`
		NamaSiswa            string    `json:"nama_siswa"`
		NIS                  string    `json:"nis"`
		KelasID              uuid.UUID `json:"kelas_id"`
		IDKelas              string    `json:"id_kelas"`
		Tanggal              string    `json:"tanggal"`
		Waktu                string    `json:"waktu"`
		StatusKehadiran      string    `json:"status_kehadiran"`
		Keterangan           string    `json:"keterangan"`
		DiverifikasiOlehGuru bool      `json:"diverifikasi_oleh_guru"`
	}

	var rows []AbsensiRow
	errQuery := db.Raw(`
		SELECT 
			a.id,
			a.id as id_absensi,
			a.siswa_id,
			a.siswa_id as id_siswa,
			u.nama_lengkap as nama_siswa,
			s.nis,
			a.kelas_id,
			a.kelas_id as id_kelas,
			a.tanggal,
			COALESCE(to_char(a.waktu_masuk, 'HH24:MI:SS'), to_char(a.created_at, 'HH24:MI:SS')) as waktu,
			CASE 
				WHEN LOWER(a.status) = 'hadir' THEN 'Hadir'
				WHEN LOWER(a.status) = 'sakit' THEN 'Sakit'
				WHEN LOWER(a.status) = 'izin' THEN 'Izin'
				ELSE 'Alfa'
			END as status_kehadiran,
			COALESCE(a.catatan, '') as keterangan,
			COALESCE(a.is_verified, false) as diverifikasi_oleh_guru
		FROM absensi a
		JOIN siswa s ON s.id = a.siswa_id
		JOIN users u ON u.id = s.user_id
		WHERE a.kelas_id = ? AND a.tanggal = ?
		ORDER BY u.nama_lengkap ASC
	`, kelasUUID, tanggal).Scan(&rows).Error

	if errQuery != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil data absensi kelas",
			Error:   errQuery.Error(),
		})
	}

	if isWeekend && len(rows) == 0 {
		namaHari := "Minggu"
		if tglParsed.Weekday() == time.Saturday {
			namaHari = "Sabtu"
		}
		return c.JSON(model.APIResponse{
			Success: true,
			Message: fmt.Sprintf("Hari %s adalah hari libur akhir pekan. Tidak ada sesi kegiatan belajar mengajar atau presensi siswa.", namaHari),
			Data:    []AbsensiRow{},
		})
	}

	if len(rows) == 0 {
		var siswaInKelas []struct {
			ID        uuid.UUID `json:"id"`
			NamaSiswa string    `json:"nama_siswa"`
			NIS       string    `json:"nis"`
		}
		db.Raw(`
			SELECT s.id, u.nama_lengkap as nama_siswa, s.nis
			FROM siswa s
			JOIN users u ON u.id = s.user_id
			WHERE s.kelas_id = ?
			ORDER BY u.nama_lengkap ASC
		`, kelasUUID).Scan(&siswaInKelas)

		for _, s := range siswaInKelas {
			newID := uuid.New()
			rows = append(rows, AbsensiRow{
				ID:                   newID,
				IDAbsensi:            newID.String(),
				SiswaID:              s.ID,
				IDSiswa:              s.ID.String(),
				NamaSiswa:            s.NamaSiswa,
				NIS:                  s.NIS,
				KelasID:              kelasUUID,
				IDKelas:              kelasUUID.String(),
				Tanggal:              tanggal,
				Waktu:                "00:00:00",
				StatusKehadiran:      "Alfa",
				Keterangan:           "-",
				DiverifikasiOlehGuru: false,
			})
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data absensi kelas berhasil dimuat",
		Data:    rows,
	})
}

func (h *GuruHandler) SaveOrUpdateAbsensi(c *fiber.Ctx) error {
	var req struct {
		AbsensiID  string `json:"absensi_id"`
		SiswaID    string `json:"siswa_id"`
		KelasID    string `json:"kelas_id"`
		Tanggal    string `json:"tanggal"`
		Status     string `json:"status"`
		Catatan    string `json:"catatan"`
		IsVerified *bool  `json:"is_verified,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload presensi tidak valid",
		})
	}

	statusClean := strings.ToLower(strings.TrimSpace(req.Status))
	if statusClean == "alfa" {
		statusClean = "alpa"
	}

	tanggalStr := strings.TrimSpace(req.Tanggal)
	if tanggalStr == "" {
		tanggalStr = time.Now().Format("2006-01-02")
	}
	tglParsed, _ := time.Parse("2006-01-02", tanggalStr)

	db := repository.GetDB()

	if req.AbsensiID == "" {
		req.AbsensiID = c.Params("id")
	}

	updates := map[string]interface{}{
		"status":  statusClean,
		"catatan": req.Catatan,
	}
	if req.IsVerified != nil {
		updates["is_verified"] = *req.IsVerified
	}

	if req.AbsensiID != "" {
		if absenUUID, err := uuid.Parse(req.AbsensiID); err == nil {
			resUpdate := db.Model(&model.Absensi{}).
				Where("id = ?", absenUUID).
				Updates(updates)

			if resUpdate.Error == nil && resUpdate.RowsAffected > 0 {
				return c.JSON(model.APIResponse{
					Success: true,
					Message: "Status presensi berhasil diperbarui di Supabase",
				})
			}
		}
	}

	siswaUUID, errSiswa := uuid.Parse(req.SiswaID)
	kelasUUID, errKelas := uuid.Parse(req.KelasID)
	if errKelas != nil {
		kelasUUID = uuid.MustParse("f0000000-0000-0000-0000-000000000001")
	}

	if errSiswa == nil {
		var existing model.Absensi
		errFind := db.Where("siswa_id = ? AND kelas_id = ? AND tanggal = ?", siswaUUID, kelasUUID, tglParsed).First(&existing).Error

		if errFind == nil {
			db.Model(&existing).Updates(updates)
			return c.JSON(model.APIResponse{
				Success: true,
				Message: "Presensi siswa berhasil diperbarui",
				Data:    existing,
			})
		} else {
			nowTime := time.Now().Format("15:04:05")
			isVer := false
			if req.IsVerified != nil {
				isVer = *req.IsVerified
			}
			newAbsen := model.Absensi{
				ID:         uuid.New(),
				SiswaID:    siswaUUID,
				KelasID:    kelasUUID,
				Tanggal:    tglParsed,
				WaktuMasuk: &nowTime,
				Status:     model.AbsensiStatus(statusClean),
				Catatan:    req.Catatan,
				IsVerified: isVer,
				CreatedAt:  time.Now(),
			}
			if err := db.Create(&newAbsen).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
					Success: false,
					Message: "Gagal menyimpan presensi baru: " + err.Error(),
				})
			}
			return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
				Success: true,
				Message: "Presensi baru siswa berhasil masuk ke Supabase",
				Data:    newAbsen,
			})
		}
	}

	return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
		Success: false,
		Message: "ID Siswa wajib valid",
	})
}

func (h *GuruHandler) VerifyAbsensiKelas(c *fiber.Ctx) error {
	var req struct {
		KelasID string `json:"kelas_id"`
		Tanggal string `json:"tanggal"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload verifikasi tidak valid",
		})
	}

	kelasUUID, err := uuid.Parse(req.KelasID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID kelas tidak valid",
		})
	}

	tanggalStr := strings.TrimSpace(req.Tanggal)
	if tanggalStr == "" {
		tanggalStr = time.Now().Format("2006-01-02")
	}
	tglParsed, err := time.Parse("2006-01-02", tanggalStr)
	if err != nil {
		tglParsed = time.Now()
		tanggalStr = tglParsed.Format("2006-01-02")
	}

	db := repository.GetDB()

	var siswaInKelas []model.Siswa
	if err := db.Where("kelas_id = ?", kelasUUID).Find(&siswaInKelas).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat siswa kelas",
			Error:   err.Error(),
		})
	}

	if len(siswaInKelas) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Tidak ada siswa yang terdaftar di kelas ini",
		})
	}

	nowTime := time.Now().Format("15:04:05")
	for _, s := range siswaInKelas {
		var existing model.Absensi
		errFind := db.Where("siswa_id = ? AND kelas_id = ? AND tanggal = ?", s.ID, kelasUUID, tglParsed).First(&existing).Error
		if errFind == nil {
			db.Model(&existing).Update("is_verified", true)
		} else {
			newAbsen := model.Absensi{
				ID:         uuid.New(),
				SiswaID:    s.ID,
				KelasID:    kelasUUID,
				Tanggal:    tglParsed,
				WaktuMasuk: &nowTime,
				Status:     model.StatusAlpa,
				Catatan:    "Diverifikasi oleh Wali Kelas",
				IsVerified: true,
				CreatedAt:  time.Now(),
			}
			db.Create(&newAbsen)
		}
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Seluruh presensi harian rombel berhasil diverifikasi oleh Wali Kelas",
	})
}

type NilaiSiswaResponse struct {
	IDNilai     string  `json:"id_nilai"`
	IDSiswa     string  `json:"id_siswa"`
	NamaSiswa   string  `json:"nama_siswa"`
	NIS         string  `json:"nis"`
	IDGuru      string  `json:"id_guru"`
	IDMapel     string  `json:"id_mapel"`
	IDKelas     string  `json:"id_kelas"`
	NilaiTugas  float64 `json:"nilai_tugas"`
	NilaiUH     float64 `json:"nilai_uh"`
	NilaiUTS    float64 `json:"nilai_uts"`
	NilaiUAS    float64 `json:"nilai_uas"`
	NilaiAkhir  float64 `json:"nilai_akhir"`
	SkorHuruf   string  `json:"skor_huruf"`
	Feedback    string  `json:"feedback"`
	StatusKunci string  `json:"status_kunci"`
}

func (h *GuruHandler) GetNilaiList(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasIDStr := c.Query("kelas_id")
	if kelasIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Parameter kelas_id wajib disertakan",
		})
	}
	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format kelas_id tidak valid",
		})
	}

	mapelIDStr := c.Query("mapel_id")
	guruIDStr := c.Query("guru_id")

	type StudentRow struct {
		ID        uuid.UUID `json:"id"`
		NamaSiswa string    `json:"nama_siswa"`
		NIS       string    `json:"nis"`
		KelasID   uuid.UUID `json:"kelas_id"`
	}

	var students []StudentRow
	if err := db.Table("siswa s").
		Select("s.id, u.nama_lengkap as nama_siswa, s.nis, s.kelas_id").
		Joins("JOIN users u ON u.id = s.user_id").
		Where("s.kelas_id = ?", kelasUUID).
		Order("u.nama_lengkap ASC").
		Scan(&students).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat siswa kelas",
			Error:   err.Error(),
		})
	}

	callerGuruUUID, hasCaller := h.getCallerGuruID(c)

	cfgPenilaian := service.GetKonfigurasiPenilaian(db)

	results := make([]NilaiSiswaResponse, 0, len(students))
	for _, st := range students {
		var nilaiList []model.Nilai
		q := db.Where("siswa_id = ?", st.ID)
		if mUUID, err := uuid.Parse(mapelIDStr); err == nil {
			q = q.Where("mapel_id = ?", mUUID)
		}
		if hasCaller {
			q = q.Where("guru_id = ?", callerGuruUUID)
		} else if gUUID, err := uuid.Parse(guruIDStr); err == nil {
			q = q.Where("guru_id = ?", gUUID)
		}
		_ = q.Find(&nilaiList).Error

		var tugas, uh, uts, uas float64
		var feedback string
		var firstID uuid.UUID
		for _, n := range nilaiList {
			if firstID == uuid.Nil {
				firstID = n.ID
			}
			switch n.JenisPenilaian {
			case model.PenilaianTugas:
				tugas = n.SkorAngka
			case model.PenilaianUlanganHarian:
				uh = n.SkorAngka
			case model.PenilaianUTS:
				uts = n.SkorAngka
			case model.PenilaianUAS:
				uas = n.SkorAngka
			}
			if n.Feedback != "" {
				feedback = n.Feedback
			}
		}

		if tugas == 0 {
			var avgTugas float64
			db.Raw(`
				SELECT COALESCE(AVG(pt.nilai), 0)
				FROM pengumpulan_tugas pt
				JOIN tugas t ON t.id = pt.tugas_id
				WHERE pt.siswa_id = ? AND pt.nilai IS NOT NULL
			`, st.ID).Scan(&avgTugas)
			if avgTugas > 0 {
				tugas = math.Round(avgTugas*10) / 10
			}
		}

		finalScore, skorHuruf := service.HitungNilaiDanPredikat(tugas, uh, uts, uas, cfgPenilaian)

		if firstID == uuid.Nil {
			firstID = uuid.New()
		}

		results = append(results, NilaiSiswaResponse{
			IDNilai:     firstID.String(),
			IDSiswa:     st.ID.String(),
			NamaSiswa:   st.NamaSiswa,
			NIS:         st.NIS,
			IDGuru:      guruIDStr,
			IDMapel:     mapelIDStr,
			IDKelas:     st.KelasID.String(),
			NilaiTugas:  tugas,
			NilaiUH:     uh,
			NilaiUTS:    uts,
			NilaiUAS:    uas,
			NilaiAkhir:  finalScore,
			SkorHuruf:   skorHuruf,
			Feedback:    feedback,
			StatusKunci: "Draf",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar nilai berhasil dimuat",
		Data:    results,
	})
}

type UpdateNilaiRequest struct {
	SiswaID    string  `json:"siswa_id"`
	GuruID     string  `json:"guru_id"`
	MapelID    string  `json:"mapel_id"`
	NilaiTugas float64 `json:"nilai_tugas"`
	NilaiUH    float64 `json:"nilai_uh"`
	NilaiUTS   float64 `json:"nilai_uts"`
	NilaiUAS   float64 `json:"nilai_uas"`
	Feedback   string  `json:"feedback"`
}

func (h *GuruHandler) UpdateNilai(c *fiber.Ctx) error {
	var req UpdateNilaiRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Payload tidak valid",
		})
	}

	siswaUUID, errS := uuid.Parse(req.SiswaID)
	if errS != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID Siswa tidak valid",
		})
	}

	db := repository.GetDB()
	var guruUUID, mapelUUID uuid.UUID
	var errG, errM error
	if callerGuruUUID, hasCaller := h.getCallerGuruID(c); hasCaller {
		guruUUID = callerGuruUUID
	} else if req.GuruID != "" {
		guruUUID, errG = uuid.Parse(req.GuruID)
	}
	if req.MapelID != "" {
		mapelUUID, errM = uuid.Parse(req.MapelID)
	}

	if (errG != nil || guruUUID == uuid.Nil) && guruUUID == uuid.Nil {
		var guru model.Guru
		if err := db.First(&guru).Error; err == nil {
			guruUUID = guru.ID
			if guru.MapelID != nil && mapelUUID == uuid.Nil {
				mapelUUID = *guru.MapelID
			}
		}
	} else if mapelUUID == uuid.Nil {
		var guru model.Guru
		if err := db.Where("id = ?", guruUUID).First(&guru).Error; err == nil && guru.MapelID != nil {
			mapelUUID = *guru.MapelID
		}
	}

	if errM != nil || mapelUUID == uuid.Nil {
		var mapel model.MataPelajaran
		if err := db.First(&mapel).Error; err == nil {
			mapelUUID = mapel.ID
		}
	}

	cfgPenilaian := service.GetKonfigurasiPenilaian(db)

	saveOrUpdate := func(jp model.JenisPenilaian, skor float64) {
		skorHuruf := service.TentukanPredikat(skor, cfgPenilaian)

		var existing model.Nilai
		if err := db.Where("siswa_id = ? AND mapel_id = ? AND jenis_penilaian = ?", siswaUUID, mapelUUID, jp).First(&existing).Error; err == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"skor_angka": skor,
				"skor_huruf": skorHuruf,
				"feedback":   req.Feedback,
				"updated_at": time.Now(),
			})
		} else {
			db.Create(&model.Nilai{
				ID:             uuid.New(),
				SiswaID:        siswaUUID,
				GuruID:         guruUUID,
				MapelID:        mapelUUID,
				JenisPenilaian: jp,
				SkorAngka:      skor,
				SkorHuruf:      skorHuruf,
				Feedback:       req.Feedback,
				CreatedAt:      time.Now(),
				UpdatedAt:      time.Now(),
			})
		}
	}

	saveOrUpdate(model.PenilaianTugas, req.NilaiTugas)
	saveOrUpdate(model.PenilaianUlanganHarian, req.NilaiUH)
	saveOrUpdate(model.PenilaianUTS, req.NilaiUTS)
	saveOrUpdate(model.PenilaianUAS, req.NilaiUAS)

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Nilai siswa berhasil disimpan",
	})
}

type AnggotaPengajarItem struct {
	ID          string `json:"id"`
	NamaLengkap string `json:"nama_lengkap"`
	Gelar       string `json:"gelar"`
	NIP         string `json:"nip"`
	Email       string `json:"email"`
	Peran       string `json:"peran"`
	Mapel       string `json:"mapel"`
}

func formatNamaGuruGelar(nama, gelar string) string {
	nama = strings.TrimSpace(nama)
	gelar = strings.TrimSpace(gelar)
	gelar = strings.TrimPrefix(gelar, ",")
	gelar = strings.TrimSpace(gelar)
	if gelar != "" && !strings.Contains(strings.ToLower(nama), strings.ToLower(gelar)) {
		return fmt.Sprintf("%s, %s", nama, gelar)
	}
	return nama
}

type AnggotaSiswaItem struct {
	ID           string `json:"id"`
	UserID       string `json:"user_id"`
	NamaLengkap  string `json:"nama_lengkap"`
	NIS          string `json:"nis"`
	NISN         string `json:"nisn"`
	Email        string `json:"email"`
	JenisKelamin string `json:"jenis_kelamin"`
}

type AnggotaKelasData struct {
	Pengajar   []AnggotaPengajarItem `json:"pengajar"`
	Siswa      []AnggotaSiswaItem    `json:"siswa"`
	TotalSiswa int                   `json:"total_siswa"`
	NamaKelas  string                `json:"nama_kelas"`
}

func (h *GuruHandler) GetAnggotaKelas(c *fiber.Ctx) error {
	db := repository.GetDB()
	if db == nil {
		return c.Status(fiber.StatusServiceUnavailable).JSON(model.APIResponse{
			Success: false,
			Message: "Layanan database tidak tersedia",
		})
	}

	kelasIDStr := c.Params("id")
	if kelasIDStr == "" {
		kelasIDStr = c.Query("kelas_id")
	}

	if kelasIDStr == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			cfg := h.cfg
			if cfg == nil {
				cfg = config.LoadConfig()
			}
			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWTSecret), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if uidStr, ok := claims["user_id"].(string); ok && uidStr != "" {
						var s model.Siswa
						if err := db.Where("user_id = ?", uidStr).First(&s).Error; err == nil && s.KelasID != nil {
							kelasIDStr = s.KelasID.String()
						}
					}
				}
			}
		}
	}

	if kelasIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Parameter kelas_id wajib disertakan",
		})
	}

	kelasUUID, err := uuid.Parse(kelasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format kelas_id tidak valid",
		})
	}

	var kelas model.Kelas
	if err := db.Where("id = ?", kelasUUID).First(&kelas).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Data kelas tidak ditemukan",
		})
	}

	guruIDStr := c.Query("guru_id")
	mapelIDStr := c.Query("mapel_id")
	mapelName := strings.TrimSpace(c.Query("mapel"))

	if guruIDStr == "" {
		authHeader := c.Get("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			cfg := h.cfg
			if cfg == nil {
				cfg = config.LoadConfig()
			}
			token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
				return []byte(cfg.JWTSecret), nil
			})
			if err == nil && token.Valid {
				if claims, ok := token.Claims.(jwt.MapClaims); ok {
					if gid, ok := claims["guru_id"].(string); ok && gid != "" {
						guruIDStr = gid
					} else if uid, ok := claims["user_id"].(string); ok && uid != "" {
						var g model.Guru
						if err := db.Where("user_id = ?", uid).First(&g).Error; err == nil {
							guruIDStr = g.ID.String()
						}
					}
				}
			}
		}
	}

	pengajarList := make([]AnggotaPengajarItem, 0)

	type JadwalPengajarRow struct {
		ID          uuid.UUID `json:"id"`
		NamaLengkap string    `json:"nama_lengkap"`
		Gelar       string    `json:"gelar"`
		NIP         string    `json:"nip"`
		Email       string    `json:"email"`
		NamaMapel   string    `json:"nama_mapel"`
	}
	var jadwalPengajar []JadwalPengajarRow

	querySQL := `
		SELECT DISTINCT g.id, u.nama_lengkap, COALESCE(g.gelar, '') as gelar, COALESCE(g.nip, '') as nip, COALESCE(u.email, '') as email, COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel
		FROM jadwal_pelajaran jp
		JOIN guru g ON g.id = jp.guru_id
		JOIN users u ON u.id = g.user_id
		LEFT JOIN mata_pelajaran m ON m.id = jp.mapel_id
		WHERE jp.kelas_id = ?
	`
	queryArgs := []interface{}{kelasUUID}

	if guruIDStr != "" {
		if gUUID, err := uuid.Parse(guruIDStr); err == nil {
			querySQL += " AND jp.guru_id = ?"
			queryArgs = append(queryArgs, gUUID)
		}
	} else if mapelIDStr != "" {
		if mUUID, err := uuid.Parse(mapelIDStr); err == nil {
			querySQL += " AND jp.mapel_id = ?"
			queryArgs = append(queryArgs, mUUID)
		}
	} else if mapelName != "" {
		querySQL += " AND LOWER(m.nama_mapel) LIKE LOWER(?)"
		queryArgs = append(queryArgs, "%"+mapelName+"%")
	}

	querySQL += " ORDER BY u.nama_lengkap ASC"
	db.Raw(querySQL, queryArgs...).Scan(&jadwalPengajar)

	if len(jadwalPengajar) > 0 {
		jp := jadwalPengajar[0]
		pengajarList = append(pengajarList, AnggotaPengajarItem{
			ID:          jp.ID.String(),
			NamaLengkap: formatNamaGuruGelar(jp.NamaLengkap, jp.Gelar),
			Gelar:       jp.Gelar,
			NIP:         jp.NIP,
			Email:       jp.Email,
			Peran:       "Guru Pengampu",
			Mapel:       jp.NamaMapel,
		})
	} else if guruIDStr != "" {
		if gUUID, err := uuid.Parse(guruIDStr); err == nil {
			type SingleGuruRow struct {
				ID          uuid.UUID `json:"id"`
				NamaLengkap string    `json:"nama_lengkap"`
				Gelar       string    `json:"gelar"`
				NIP         string    `json:"nip"`
				Email       string    `json:"email"`
				NamaMapel   string    `json:"nama_mapel"`
			}
			var sg SingleGuruRow
			if err := db.Raw(`
				SELECT g.id, u.nama_lengkap, COALESCE(g.gelar, '') as gelar, COALESCE(g.nip, '') as nip, COALESCE(u.email, '') as email, COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel
				FROM guru g
				JOIN users u ON u.id = g.user_id
				LEFT JOIN mata_pelajaran m ON m.id = g.mapel_id
				WHERE g.id = ?
			`, gUUID).Scan(&sg).Error; err == nil && sg.ID != uuid.Nil {
				pengajarList = append(pengajarList, AnggotaPengajarItem{
					ID:          sg.ID.String(),
					NamaLengkap: formatNamaGuruGelar(sg.NamaLengkap, sg.Gelar),
					Gelar:       sg.Gelar,
					NIP:         sg.NIP,
					Email:       sg.Email,
					Peran:       "Guru Pengampu",
					Mapel:       sg.NamaMapel,
				})
			}
		}
	}

	if len(pengajarList) == 0 {
		type DefaultGuruRow struct {
			ID          uuid.UUID `json:"id"`
			NamaLengkap string    `json:"nama_lengkap"`
			Gelar       string    `json:"gelar"`
			NIP         string    `json:"nip"`
			Email       string    `json:"email"`
			NamaMapel   string    `json:"nama_mapel"`
		}
		var defGuru DefaultGuruRow
		if err := db.Raw(`
			SELECT g.id, u.nama_lengkap, COALESCE(g.gelar, '') as gelar, COALESCE(g.nip, '') as nip, COALESCE(u.email, '') as email, COALESCE(m.nama_mapel, 'Mata Pelajaran') as nama_mapel
			FROM guru g
			JOIN users u ON u.id = g.user_id
			LEFT JOIN mata_pelajaran m ON m.id = g.mapel_id
			LIMIT 1
		`).Scan(&defGuru).Error; err == nil && defGuru.ID != uuid.Nil {
			pengajarList = append(pengajarList, AnggotaPengajarItem{
				ID:          defGuru.ID.String(),
				NamaLengkap: formatNamaGuruGelar(defGuru.NamaLengkap, defGuru.Gelar),
				Gelar:       defGuru.Gelar,
				NIP:         defGuru.NIP,
				Email:       defGuru.Email,
				Peran:       "Guru Pengampu",
				Mapel:       defGuru.NamaMapel,
			})
		}
	}

	type SiswaRow struct {
		ID           uuid.UUID `json:"id"`
		UserID       uuid.UUID `json:"user_id"`
		NamaLengkap  string    `json:"nama_lengkap"`
		NIS          string    `json:"nis"`
		NISN         string    `json:"nisn"`
		Email        string    `json:"email"`
		JenisKelamin string    `json:"jenis_kelamin"`
	}
	var siswaRows []SiswaRow
	db.Raw(`
		SELECT 
			s.id,
			s.user_id,
			u.nama_lengkap,
			COALESCE(s.nis, '') as nis,
			COALESCE(s.nisn, '') as nisn,
			COALESCE(u.email, '') as email,
			COALESCE(s.jenis_kelamin, '-') as jenis_kelamin
		FROM siswa s
		JOIN users u ON u.id = s.user_id
		WHERE s.kelas_id = ?
		ORDER BY u.nama_lengkap ASC
	`, kelasUUID).Scan(&siswaRows)

	siswaList := make([]AnggotaSiswaItem, 0)
	for _, sr := range siswaRows {
		siswaList = append(siswaList, AnggotaSiswaItem{
			ID:           sr.ID.String(),
			UserID:       sr.UserID.String(),
			NamaLengkap:  sr.NamaLengkap,
			NIS:          sr.NIS,
			NISN:         sr.NISN,
			Email:        sr.Email,
			JenisKelamin: sr.JenisKelamin,
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Data anggota kelas berhasil dimuat",
		Data: AnggotaKelasData{
			Pengajar:   pengajarList,
			Siswa:      siswaList,
			TotalSiswa: len(siswaList),
			NamaKelas:  kelas.NamaKelas,
		},
	})
}

func (h *GuruHandler) GetKomentarTugas(c *fiber.Ctx) error {
	tugasIDStr := strings.TrimSpace(c.Params("id"))
	if tugasIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas diperlukan",
		})
	}
	tugasUUID, err := uuid.Parse(tugasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format ID tugas tidak valid",
		})
	}

	db := repository.GetDB()

	var tugas model.Tugas
	if err := db.Select("id").First(&tugas, "id = ?", tugasUUID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	type KomentarRow struct {
		ID          uuid.UUID `gorm:"column:id"`
		TugasID     uuid.UUID `gorm:"column:tugas_id"`
		UserID      uuid.UUID `gorm:"column:user_id"`
		Pesan       string    `gorm:"column:pesan"`
		CreatedAt   time.Time `gorm:"column:created_at"`
		NamaLengkap string    `gorm:"column:nama_lengkap"`
		Username    string    `gorm:"column:username"`
		Role        string    `gorm:"column:role"`
		Gelar       string    `gorm:"column:gelar"`
	}

	var rows []KomentarRow
	query := `
		SELECT 
			kt.id,
			kt.tugas_id,
			kt.user_id,
			kt.pesan,
			kt.created_at,
			COALESCE(u.nama_lengkap, '') as nama_lengkap,
			COALESCE(u.username, '') as username,
			COALESCE(u.role, '') as role,
			COALESCE(g.gelar, '') as gelar
		FROM komentar_tugas kt
		JOIN users u ON u.id = kt.user_id
		LEFT JOIN guru g ON g.user_id = u.id
		WHERE kt.tugas_id = ?
		ORDER BY kt.created_at ASC
	`
	if err := db.Raw(query, tugasUUID).Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil daftar komentar tugas",
		})
	}

	bulanIndo := []string{"", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
	result := make([]model.KomentarTugasResponse, 0, len(rows))
	for _, r := range rows {
		nama := r.NamaLengkap
		if nama == "" {
			nama = r.Username
		}
		if nama == "" {
			nama = "Pengguna"
		}

		peran := "Pengguna"
		switch strings.ToLower(r.Role) {
		case "guru":
			peran = "Guru"
		case "siswa":
			peran = "Siswa"
		case "kurikulum":
			peran = "Kurikulum"
		case "wali_kelas":
			peran = "Wali Kelas"
		}

		waktuFormat := fmt.Sprintf("%d %s %d, %02d:%02d",
			r.CreatedAt.Day(),
			bulanIndo[r.CreatedAt.Month()],
			r.CreatedAt.Year(),
			r.CreatedAt.Hour(),
			r.CreatedAt.Minute(),
		)

		result = append(result, model.KomentarTugasResponse{
			ID:          r.ID,
			TugasID:     r.TugasID,
			UserID:      r.UserID,
			NamaUser:    nama,
			GelarUser:   r.Gelar,
			PeranUser:   peran,
			Pesan:       r.Pesan,
			CreatedAt:   r.CreatedAt,
			WaktuFormat: waktuFormat,
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Komentar tugas berhasil dimuat",
		Data:    result,
	})
}

func (h *GuruHandler) CreateKomentarTugas(c *fiber.Ctx) error {
	tugasIDStr := strings.TrimSpace(c.Params("id"))
	if tugasIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID tugas diperlukan",
		})
	}
	tugasUUID, err := uuid.Parse(tugasIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format ID tugas tidak valid",
		})
	}

	var req model.CreateKomentarRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format data request tidak valid",
		})
	}

	pesan := strings.TrimSpace(req.Pesan)
	if pesan == "" {
		pesan = strings.TrimSpace(req.Komentar)
	}
	if pesan == "" {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Pesan komentar tidak boleh kosong",
		})
	}

	db := repository.GetDB()

	var tugas model.Tugas
	if err := db.Preload("Guru").First(&tugas, "id = ?", tugasUUID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Tugas tidak ditemukan",
		})
	}

	var callerUserID uuid.UUID
	authHeader := c.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		cfg := h.cfg
		if cfg == nil {
			cfg = config.LoadConfig()
		}
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(cfg.JWTSecret), nil
		})
		if err == nil && token != nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if uidStr, ok := claims["user_id"].(string); ok {
					if parsedUID, err := uuid.Parse(uidStr); err == nil {
						callerUserID = parsedUID
					}
				}
			}
		}
	}

	if callerUserID == uuid.Nil {
		if localUID, ok := c.Locals("user_id").(string); ok && localUID != "" {
			if parsedUID, err := uuid.Parse(localUID); err == nil {
				callerUserID = parsedUID
			}
		}
	}

	if callerUserID == uuid.Nil {
		if tugas.Guru != nil && tugas.Guru.UserID != uuid.Nil {
			callerUserID = tugas.Guru.UserID
		} else {
			var firstGuru model.Guru
			if err := db.First(&firstGuru).Error; err == nil {
				callerUserID = firstGuru.UserID
			} else {
				var firstUser model.User
				if err := db.First(&firstUser).Error; err == nil {
					callerUserID = firstUser.ID
				}
			}
		}
	}

	if callerUserID == uuid.Nil {
		return c.Status(fiber.StatusUnauthorized).JSON(model.APIResponse{
			Success: false,
			Message: "Pengguna tidak teridentifikasi",
		})
	}

	newKomentar := model.KomentarTugas{
		ID:        uuid.New(),
		TugasID:   tugasUUID,
		UserID:    callerUserID,
		Pesan:     pesan,
		CreatedAt: time.Now(),
	}

	if err := db.Create(&newKomentar).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menyimpan komentar tugas: " + err.Error(),
		})
	}

	var u model.User
	db.First(&u, "id = ?", callerUserID)
	var g model.Guru
	db.First(&g, "user_id = ?", callerUserID)

	nama := u.NamaLengkap
	if nama == "" {
		nama = u.Username
	}
	if nama == "" {
		nama = "Pengguna"
	}

	peran := "Pengguna"
	switch strings.ToLower(string(u.Role)) {
	case "guru":
		peran = "Guru"
	case "siswa":
		peran = "Siswa"
	case "kurikulum":
		peran = "Kurikulum"
	case "wali_kelas":
		peran = "Wali Kelas"
	}

	bulanIndo := []string{"", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}
	waktuFormat := fmt.Sprintf("%d %s %d, %02d:%02d",
		newKomentar.CreatedAt.Day(),
		bulanIndo[newKomentar.CreatedAt.Month()],
		newKomentar.CreatedAt.Year(),
		newKomentar.CreatedAt.Hour(),
		newKomentar.CreatedAt.Minute(),
	)

	return c.Status(fiber.StatusCreated).JSON(model.APIResponse{
		Success: true,
		Message: "Komentar berhasil ditambahkan",
		Data: model.KomentarTugasResponse{
			ID:          newKomentar.ID,
			TugasID:     newKomentar.TugasID,
			UserID:      newKomentar.UserID,
			NamaUser:    nama,
			GelarUser:   g.Gelar,
			PeranUser:   peran,
			Pesan:       newKomentar.Pesan,
			CreatedAt:   newKomentar.CreatedAt,
			WaktuFormat: waktuFormat,
		},
	})
}

func (h *GuruHandler) DeleteKomentarTugas(c *fiber.Ctx) error {
	komentarIDStr := strings.TrimSpace(c.Params("komentarId"))
	if komentarIDStr == "" {
		komentarIDStr = strings.TrimSpace(c.Params("id"))
	}
	komentarUUID, err := uuid.Parse(komentarIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "Format ID komentar tidak valid",
		})
	}

	db := repository.GetDB()
	var komentar model.KomentarTugas
	if err := db.First(&komentar, "id = ?", komentarUUID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "Komentar tidak ditemukan",
		})
	}

	if err := db.Delete(&komentar).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal menghapus komentar",
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Komentar berhasil dihapus",
	})
}
