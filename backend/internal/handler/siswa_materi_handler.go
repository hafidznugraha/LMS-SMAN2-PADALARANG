package handler

import (
	"errors"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

var likeEscaper = strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)

// GET /api/v1/siswa/materi?search=&mapel_id=
func (h *SiswaHandler) GetMateriList(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	resp := model.SiswaMateriListResponse{
		Items: []model.SiswaMateriItem{},
		Mapel: []model.SiswaMapelOption{},
	}

	// Siswa yang belum punya kelas belum punya materi.
	if siswa.KelasID == nil {
		return c.JSON(model.APIResponse{
			Success: true,
			Message: "Siswa belum ditempatkan di kelas",
			Data:    resp,
		})
	}
	kelasID := *siswa.KelasID

	where := []string{"m.kelas_id = ?"}
	args := []interface{}{kelasID}

	if raw := strings.TrimSpace(c.Query("mapel_id")); raw != "" {
		mapelID, perr := uuid.Parse(raw)
		if perr != nil {
			return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
				Success: false,
				Message: "Parameter mapel_id tidak valid",
			})
		}
		where = append(where, "m.mapel_id = ?")
		args = append(args, mapelID)
	}

	if search := strings.TrimSpace(c.Query("search")); search != "" {
		pattern := "%" + likeEscaper.Replace(search) + "%"
		where = append(where, "(m.judul ILIKE ? OR mp.nama_mapel ILIKE ?)")
		args = append(args, pattern, pattern)
	}

	query := `
		SELECT
			m.id,
			m.judul,
			COALESCE(m.deskripsi, '') AS deskripsi,
			m.mapel_id,
			mp.nama_mapel,
			u.nama_lengkap AS nama_guru,
			COALESCE(m.tipe_file, '') AS tipe_file,
			COALESCE(m.ukuran_mb, 0) AS ukuran_mb,
			m.created_at
		FROM materi m
		JOIN mata_pelajaran mp ON mp.id = m.mapel_id
		JOIN guru g ON g.id = m.guru_id
		JOIN users u ON u.id = g.user_id
		WHERE ` + strings.Join(where, " AND ") + `
		ORDER BY m.created_at DESC
		LIMIT 200`

	if err := db.Raw(query, args...).Scan(&resp.Items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat daftar materi",
			Error:   err.Error(),
		})
	}

	// Pilihan filter mapel: tidak ikut terfilter pencarian agar pill tetap stabil.
	if err := db.Raw(`
		SELECT DISTINCT mp.id, mp.nama_mapel
		FROM materi m
		JOIN mata_pelajaran mp ON mp.id = m.mapel_id
		WHERE m.kelas_id = ?
		ORDER BY mp.nama_mapel`, kelasID).Scan(&resp.Mapel).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat daftar mata pelajaran",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Daftar materi berhasil dimuat",
		Data:    resp,
	})
}

// GET /api/v1/siswa/materi/:id/download
// Mengembalikan URL file (bukan redirect), karena navigasi browser tidak
// bisa membawa header Authorization.
func (h *SiswaHandler) DownloadMateri(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	id, perr := uuid.Parse(c.Params("id"))
	if perr != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{
			Success: false,
			Message: "ID materi tidak valid",
		})
	}

	var materi model.Materi
	q := db.Where("id = ?", id)
	if siswa.KelasID != nil {
		q = q.Where("kelas_id = ?", *siswa.KelasID)
	} else {
		q = q.Where("1 = 0")
	}
	if err := q.First(&materi).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
				Success: false,
				Message: "Materi tidak ditemukan",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal mengambil materi",
			Error:   err.Error(),
		})
	}

	if strings.TrimSpace(materi.FileURL) == "" {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{
			Success: false,
			Message: "File materi belum tersedia",
		})
	}

	// Hitung tampilan; kegagalan di sini tidak boleh menghalangi unduhan.
	_ = db.Model(&model.Materi{}).Where("id = ?", materi.ID).
		UpdateColumn("jumlah_melihat", gorm.Expr("COALESCE(jumlah_melihat, 0) + 1")).Error

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Tautan materi siap",
		Data: model.SiswaMateriDownloadResponse{
			FileURL:  materi.FileURL,
			Judul:    materi.Judul,
			TipeFile: materi.TipeFile,
		},
	})
}
