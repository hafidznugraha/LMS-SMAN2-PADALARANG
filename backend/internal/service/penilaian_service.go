package service

import (
	"errors"
	"math"

	"gorm.io/gorm"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

// DefaultKonfigurasiPenilaian menyediakan nilai fallback aman bila database belum memiliki konfigurasi.
var DefaultKonfigurasiPenilaian = model.KonfigurasiPenilaian{
	KKMDefault:     75.00,
	BobotTugas:     30.00,
	BobotUH:        20.00,
	BobotUTS:       25.00,
	BobotUAS:       25.00,
	BatasPredikatA: 85.00,
	BatasPredikatB: 75.00,
	BatasPredikatC: 65.00,
	IsAktif:        true,
}

// GetKonfigurasiPenilaian mengambil konfigurasi penilaian aktif dari database.
// Jika belum ada record atau database error, mengembalikan DefaultKonfigurasiPenilaian.
func GetKonfigurasiPenilaian(db *gorm.DB) model.KonfigurasiPenilaian {
	if db == nil {
		return DefaultKonfigurasiPenilaian
	}
	var cfg model.KonfigurasiPenilaian
	if err := db.Where("is_aktif = ?", true).Order("updated_at DESC").First(&cfg).Error; err != nil {
		return DefaultKonfigurasiPenilaian
	}
	return cfg
}

// ValidasiKonfigurasiPenilaian memvalidasi bahwa total bobot tepat 100% dan ambang batas A > B > C.
func ValidasiKonfigurasiPenilaian(cfg model.KonfigurasiPenilaian) error {
	totalBobot := math.Round((cfg.BobotTugas+cfg.BobotUH+cfg.BobotUTS+cfg.BobotUAS)*100) / 100
	if math.Abs(totalBobot-100.00) > 0.01 {
		return errors.New("total bobot penilaian (Tugas + UH + UTS + UAS) harus tepat 100%")
	}
	if cfg.BatasPredikatA <= cfg.BatasPredikatB {
		return errors.New("ambang batas Predikat A harus lebih besar dari Predikat B")
	}
	if cfg.BatasPredikatB <= cfg.BatasPredikatC {
		return errors.New("ambang batas Predikat B harus lebih besar dari Predikat C")
	}
	if cfg.KKMDefault < 0 || cfg.KKMDefault > 100 {
		return errors.New("batas KKM harus bernilai antara 0 sampai 100")
	}
	return nil
}

// HitungNilaiAkhir menghitung nilai akhir terbobot berdasarkan konfigurasi aktif.
func HitungNilaiAkhir(tugas, uh, uts, uas float64, cfg model.KonfigurasiPenilaian) float64 {
	wTugas := cfg.BobotTugas / 100.0
	wUH := cfg.BobotUH / 100.0
	wUTS := cfg.BobotUTS / 100.0
	wUAS := cfg.BobotUAS / 100.0
	raw := (wTugas * tugas) + (wUH * uh) + (wUTS * uts) + (wUAS * uas)
	return math.Round(raw*10) / 10
}

// TentukanPredikat mengonversi skor angka ke predikat huruf (A, B, C, D) secara dinamis.
func TentukanPredikat(skor float64, cfg model.KonfigurasiPenilaian) string {
	switch {
	case skor >= cfg.BatasPredikatA:
		return "A"
	case skor >= cfg.BatasPredikatB:
		return "B"
	case skor >= cfg.BatasPredikatC:
		return "C"
	default:
		return "D"
	}
}

// HitungNilaiDanPredikat mengembalikan nilai akhir terbobot dan predikat huruf sekaligus.
func HitungNilaiDanPredikat(tugas, uh, uts, uas float64, cfg model.KonfigurasiPenilaian) (float64, string) {
	nilaiAkhir := HitungNilaiAkhir(tugas, uh, uts, uas, cfg)
	predikat := TentukanPredikat(nilaiAkhir, cfg)
	return nilaiAkhir, predikat
}
