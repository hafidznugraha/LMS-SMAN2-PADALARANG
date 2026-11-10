package handler

import (
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

type SiswaJadwalItem struct {
	ID         string `json:"id"`
	Hari       string `json:"hari"`
	JamMulai   string `json:"jam_mulai"`
	JamSelesai string `json:"jam_selesai"`
	Ruang      string `json:"ruang"`
	MapelID    string `json:"mapel_id"`
	NamaMapel  string `json:"nama_mapel"`
	KodeMapel  string `json:"kode_mapel"`
	GuruID     string `json:"guru_id"`
	NamaGuru   string `json:"nama_guru"`
	GelarGuru  string `json:"gelar_guru,omitempty"`
	NIPGuru    string `json:"nip_guru"`
	KelasID    string `json:"kelas_id"`
	NamaKelas  string `json:"nama_kelas"`
}

type SiswaJadwalResponse struct {
	NamaKelas string            `json:"nama_kelas"`
	Tingkat   string            `json:"tingkat"`
	Items     []SiswaJadwalItem `json:"items"`
}

func (h *SiswaHandler) GetJadwal(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	resp := SiswaJadwalResponse{
		NamaKelas: "-",
		Tingkat:   "-",
		Items:     []SiswaJadwalItem{},
	}

	if siswa.Kelas != nil {
		resp.NamaKelas = siswa.Kelas.NamaKelas
		resp.Tingkat = fmt.Sprintf("%d", siswa.Kelas.Tingkat)
	}

	if siswa.KelasID == nil {
		return c.JSON(model.APIResponse{
			Success: true,
			Message: "Siswa belum ditempatkan di kelas",
			Data:    resp,
		})
	}
	kelasID := *siswa.KelasID

	query := db.Preload("Kelas").
		Preload("Guru.User").
		Preload("Mapel").
		Where("kelas_id = ?", kelasID).
		Order("CASE hari " +
			"WHEN 'Senin' THEN 1 " +
			"WHEN 'Selasa' THEN 2 " +
			"WHEN 'Rabu' THEN 3 " +
			"WHEN 'Kamis' THEN 4 " +
			"WHEN 'Jumat' THEN 5 " +
			"WHEN 'Sabtu' THEN 6 " +
			"ELSE 7 END, jam_mulai ASC")

	if hari := strings.TrimSpace(c.Query("hari")); hari != "" {
		query = query.Where("hari = ?", hari)
	}

	var list []model.JadwalPelajaran
	if err := query.Find(&list).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat jadwal pelajaran siswa",
			Error:   err.Error(),
		})
	}

	for _, j := range list {
		guruNama := "-"
		guruNIP := "-"
		guruGelar := strings.TrimSpace(j.Guru.Gelar)
		if j.Guru.User.NamaLengkap != "" {
			guruNama = strings.TrimSpace(j.Guru.User.NamaLengkap)
			if guruGelar != "" && !strings.Contains(strings.ToLower(guruNama), strings.ToLower(guruGelar)) {
				guruNama = fmt.Sprintf("%s, %s", guruNama, guruGelar)
			}
		}
		if j.Guru.NIP != "" {
			guruNIP = j.Guru.NIP
		}

		mapelNama := "-"
		mapelKode := "-"
		if j.Mapel.NamaMapel != "" {
			mapelNama = j.Mapel.NamaMapel
		}
		if j.Mapel.KodeMapel != "" {
			mapelKode = j.Mapel.KodeMapel
		}

		kelasNama := resp.NamaKelas
		if j.Kelas.NamaKelas != "" {
			kelasNama = j.Kelas.NamaKelas
		}

		resp.Items = append(resp.Items, SiswaJadwalItem{
			ID:         j.ID.String(),
			Hari:       j.Hari,
			JamMulai:   j.JamMulai,
			JamSelesai: j.JamSelesai,
			Ruang:      j.Ruang,
			MapelID:    j.MapelID.String(),
			NamaMapel:  mapelNama,
			KodeMapel:  mapelKode,
			GuruID:     j.GuruID.String(),
			NamaGuru:   guruNama,
			GelarGuru:  guruGelar,
			NIPGuru:    guruNIP,
			KelasID:    j.KelasID.String(),
			NamaKelas:  kelasNama,
		})
	}

	return c.JSON(model.APIResponse{
		Success: true,
		Message: "Jadwal pelajaran siswa berhasil dimuat",
		Data:    resp,
	})
}
