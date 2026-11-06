package handler

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

type nilaiRow struct {
	ID        uuid.UUID `gorm:"column:id"`
	MapelID   uuid.UUID `gorm:"column:mapel_id"`
	NamaMapel string    `gorm:"column:nama_mapel"`
	Jenis     string    `gorm:"column:jenis_penilaian"`
	Skor      float64   `gorm:"column:skor_angka"`
	Huruf     string    `gorm:"column:skor_huruf"`
	Feedback  string    `gorm:"column:feedback"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

// GET /api/v1/siswa/nilai
// Semua nilai milik siswa, dikelompokkan per mata pelajaran.
func (h *SiswaHandler) GetNilai(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	var rows []nilaiRow
	if err := db.Raw(`
		SELECT n.id, n.mapel_id, mp.nama_mapel, n.jenis_penilaian, n.skor_angka,
		       COALESCE(n.skor_huruf, '') AS skor_huruf,
		       COALESCE(n.feedback, '') AS feedback,
		       n.created_at
		FROM nilai n
		JOIN mata_pelajaran mp ON mp.id = n.mapel_id
		WHERE n.siswa_id = ? AND n.deleted_at IS NULL
		ORDER BY mp.nama_mapel ASC, n.created_at DESC`, siswa.ID).Scan(&rows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat nilai",
			Error:   err.Error(),
		})
	}

	resp := model.SiswaNilaiResponse{Mapel: []model.SiswaNilaiMapel{}}
	index := map[uuid.UUID]int{}
	sums := map[uuid.UUID]float64{}

	for _, r := range rows {
		i, ok := index[r.MapelID]
		if !ok {
			resp.Mapel = append(resp.Mapel, model.SiswaNilaiMapel{
				MapelID:   r.MapelID,
				NamaMapel: r.NamaMapel,
				Items:     []model.SiswaNilaiItem{},
			})
			i = len(resp.Mapel) - 1
			index[r.MapelID] = i
		}
		resp.Mapel[i].Items = append(resp.Mapel[i].Items, model.SiswaNilaiItem{
			ID:        r.ID,
			Jenis:     r.Jenis,
			Skor:      r.Skor,
			Huruf:     strings.TrimSpace(r.Huruf),
			Feedback:  r.Feedback,
			CreatedAt: r.CreatedAt,
		})
		sums[r.MapelID] += r.Skor
	}

	total := 0.0
	for i := range resp.Mapel {
		m := &resp.Mapel[i]
		avg := sums[m.MapelID] / float64(len(m.Items))
		m.RataRata = bulat1(avg)
		m.Predikat = predikatAngka(avg)
		total += avg
	}
	if len(resp.Mapel) > 0 {
		v := bulat1(total / float64(len(resp.Mapel)))
		resp.RataRata = &v
	}

	return c.JSON(model.APIResponse{Success: true, Message: "Nilai berhasil dimuat", Data: resp})
}

// GET /api/v1/siswa/rapor
// Daftar rapor yang SUDAH DISAHKAN Kurikulum. Rapor Draf/DitinjauWali tidak tampil.
func (h *SiswaHandler) GetRaporList(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	items := []model.SiswaRaporRingkas{}
	if err := db.Raw(`
		SELECT id_laporan AS id, semester, tahun_ajaran, rata_rata_akhir,
		       COALESCE(predikat_akhir, '') AS predikat_akhir, disahkan_pada
		FROM laporan_akademik
		WHERE id_siswa = ? AND status_laporan = ? AND deleted_at IS NULL
		ORDER BY tahun_ajaran DESC,
		         CASE semester WHEN 'Genap' THEN 2 ELSE 1 END DESC`,
		siswa.ID, string(model.StatusLaporanDisahkanKurikulum)).Scan(&items).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat daftar rapor",
			Error:   err.Error(),
		})
	}

	return c.JSON(model.APIResponse{Success: true, Message: "Daftar rapor berhasil dimuat", Data: items})
}

type raporNilaiRow struct {
	KodeMapel string  `gorm:"column:kode_mapel"`
	NamaMapel string  `gorm:"column:nama_mapel"`
	Kategori  string  `gorm:"column:kategori"`
	Jenis     string  `gorm:"column:jenis_penilaian"`
	Rata      float64 `gorm:"column:rata"`
	Jumlah    int     `gorm:"column:jumlah"`
	Total     float64 `gorm:"column:total"`
}

// GET /api/v1/siswa/rapor/:id
// Hanya rapor milik siswa sendiri dan berstatus DisahkanKurikulum; selain itu 404.
func (h *SiswaHandler) GetRaporDetail(c *fiber.Ctx) error {
	siswa, db, err := currentSiswa(c)
	if siswa == nil {
		return err
	}

	id, perr := uuid.Parse(c.Params("id"))
	if perr != nil {
		return c.Status(fiber.StatusBadRequest).JSON(model.APIResponse{Success: false, Message: "ID rapor tidak valid"})
	}

	var lap model.LaporanAkademik
	if err := db.Where(
		"id_laporan = ? AND id_siswa = ? AND status_laporan = ? AND deleted_at IS NULL",
		id, siswa.ID, string(model.StatusLaporanDisahkanKurikulum),
	).First(&lap).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(model.APIResponse{Success: false, Message: "Rapor tidak ditemukan"})
	}

	d := model.SiswaRaporDetail{
		IDLaporan:         lap.ID,
		Semester:          lap.Semester,
		TahunAjaran:       lap.TahunAjaran,
		NamaSiswa:         siswa.User.NamaLengkap,
		NIS:               siswa.NIS,
		NISN:              siswa.NISN,
		NilaiPengetahuan:  lap.NilaiPengetahuan,
		NilaiKeterampilan: lap.NilaiKeterampilan,
		RataRata:          lap.RataRataAkhir,
		Predikat:          lap.PredikatAkhir,
		DeskripsiNilai:    lap.DeskripsiNilai,
		CatatanWali:       lap.CatatanWali,
		DisahkanPada:      lap.DisahkanPada,
		DisahkanOleh:      lap.DisahkanOleh,
		NilaiMapel:        []model.SiswaRaporMapel{},
	}
	if d.Predikat == "" && lap.RataRataAkhir != nil {
		d.Predikat = predikatAngka(*lap.RataRataAkhir)
	}

	// Identitas sekolah dari database (tanpa nilai tertulis di kode).
	var profil model.ProfilSekolah
	if err := db.First(&profil).Error; err == nil {
		d.NamaSekolah = profil.NamaSekolah
		d.AlamatSekolah = profil.Alamat
		d.TeleponSekolah = profil.Telepon
	}
	var kepsek model.PejabatSekolah
	if err := db.Where("jabatan = ? AND is_aktif = ?", "Kepala Sekolah", true).First(&kepsek).Error; err == nil {
		d.KepalaSekolah = kepsek.NamaPejabat
		d.NIPKepalaSekolah = kepsek.NIP
	}

	// Kelas dan wali kelas.
	if siswa.Kelas != nil {
		d.Kelas = siswa.Kelas.NamaKelas
		d.Tingkat = siswa.Kelas.Tingkat
		d.Jurusan = siswa.Kelas.Jurusan

		var kelas model.Kelas
		if err := db.Preload("WaliGuru.User").First(&kelas, "id = ?", siswa.Kelas.ID).Error; err == nil && kelas.WaliGuru != nil {
			d.WaliKelas = kelas.WaliGuru.User.NamaLengkap
			if g := kelas.WaliGuru.Gelar; g != "" && !strings.Contains(d.WaliKelas, g) {
				d.WaliKelas = fmt.Sprintf("%s, %s", d.WaliKelas, g)
			}
			d.WaliNIP = kelas.WaliGuru.NIP
		}
	}

	// Nilai dan kehadiran dibatasi pada rentang semester rapor ini.
	awal, akhir, ok := rentangSemester(lap.TahunAjaran, lap.Semester)
	if !ok {
		return c.JSON(model.APIResponse{Success: true, Message: "Rapor berhasil dimuat", Data: d})
	}

	var nrows []raporNilaiRow
	if err := db.Raw(`
		SELECT mp.kode_mapel, mp.nama_mapel, COALESCE(mp.kategori, '') AS kategori,
		       n.jenis_penilaian,
		       AVG(n.skor_angka) AS rata, COUNT(*) AS jumlah, SUM(n.skor_angka) AS total
		FROM nilai n
		JOIN mata_pelajaran mp ON mp.id = n.mapel_id
		WHERE n.siswa_id = ? AND n.deleted_at IS NULL
		  AND n.created_at >= ?::timestamptz AND n.created_at < ?::timestamptz
		GROUP BY mp.kode_mapel, mp.nama_mapel, mp.kategori, n.jenis_penilaian
		ORDER BY mp.nama_mapel ASC`,
		siswa.ID, awal.Format(time.RFC3339), akhir.Format(time.RFC3339)).Scan(&nrows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat nilai rapor",
			Error:   err.Error(),
		})
	}

	idx := map[string]int{}
	totals := map[string]float64{}
	counts := map[string]int{}
	for _, r := range nrows {
		i, found := idx[r.KodeMapel]
		if !found {
			d.NilaiMapel = append(d.NilaiMapel, model.SiswaRaporMapel{
				KodeMapel: r.KodeMapel,
				NamaMapel: r.NamaMapel,
				Kategori:  r.Kategori,
			})
			i = len(d.NilaiMapel) - 1
			idx[r.KodeMapel] = i
		}
		v := bulat1(r.Rata)
		switch r.Jenis {
		case string(model.PenilaianTugas):
			d.NilaiMapel[i].Tugas = &v
		case string(model.PenilaianUlanganHarian):
			d.NilaiMapel[i].UH = &v
		case string(model.PenilaianUTS):
			d.NilaiMapel[i].UTS = &v
		case string(model.PenilaianUAS):
			d.NilaiMapel[i].UAS = &v
		}
		totals[r.KodeMapel] += r.Total
		counts[r.KodeMapel] += r.Jumlah
	}
	for i := range d.NilaiMapel {
		kode := d.NilaiMapel[i].KodeMapel
		avg := totals[kode] / float64(counts[kode])
		d.NilaiMapel[i].NilaiAkhir = bulat1(avg)
		d.NilaiMapel[i].Predikat = predikatAngka(avg)
	}

	// Kehadiran nyata dari tabel absensi (bukan angka perkiraan).
	var arows []dashboardAbsensiRow
	if err := db.Raw(`
		SELECT status, COUNT(*) AS jumlah
		FROM absensi
		WHERE siswa_id = ? AND tanggal >= ?::date AND tanggal < ?::date
		GROUP BY status`,
		siswa.ID, awal.Format("2006-01-02"), akhir.Format("2006-01-02")).Scan(&arows).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(model.APIResponse{
			Success: false,
			Message: "Gagal memuat kehadiran rapor",
			Error:   err.Error(),
		})
	}
	for _, r := range arows {
		d.Kehadiran.Total += r.Jumlah
		switch r.Status {
		case "hadir":
			d.Kehadiran.Hadir += r.Jumlah
		case "terlambat":
			d.Kehadiran.Hadir += r.Jumlah
			d.Kehadiran.Terlambat += r.Jumlah
		case "sakit":
			d.Kehadiran.Sakit += r.Jumlah
		case "izin":
			d.Kehadiran.Izin += r.Jumlah
		case "alpa":
			d.Kehadiran.Alpa += r.Jumlah
		}
	}
	if d.Kehadiran.Total > 0 {
		d.Kehadiran.Persen = d.Kehadiran.Hadir * 100 / d.Kehadiran.Total
	}

	return c.JSON(model.APIResponse{Success: true, Message: "Rapor berhasil dimuat", Data: d})
}
