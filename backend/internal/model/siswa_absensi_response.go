package model

import "github.com/google/uuid"

type SiswaAbsensiRiwayat struct {
	ID         uuid.UUID `gorm:"column:id" json:"id"`
	Tanggal    string    `gorm:"column:tanggal" json:"tanggal"` // YYYY-MM-DD
	Status     string    `gorm:"column:status" json:"status"`
	WaktuMasuk string    `gorm:"column:waktu_masuk" json:"waktu_masuk"` // HH:MM, kosong bila tidak ada
	Catatan    string    `gorm:"column:catatan" json:"catatan"`
}

type SiswaAbsensiRekap struct {
	Hadir     int `json:"hadir"`
	Terlambat int `json:"terlambat"`
	Sakit     int `json:"sakit"`
	Izin      int `json:"izin"`
	Alpa      int `json:"alpa"`
	Total     int `json:"total"`
	Persen    int `json:"persen"` // (hadir + terlambat) / total
}

type SiswaAbsensiHariIni struct {
	Sudah      bool   `json:"sudah"`
	Status     string `json:"status,omitempty"`
	WaktuMasuk string `json:"waktu_masuk,omitempty"`
	Catatan    string `json:"catatan,omitempty"`
	BisaAbsen  bool   `json:"bisa_absen"`
	Alasan     string `json:"alasan,omitempty"` // alasan bila belum bisa absen
}

type SiswaAbsensiResponse struct {
	Bulan     string                `json:"bulan"`   // YYYY-MM yang ditampilkan
	Tanggal   string                `json:"tanggal"` // hari ini (WIB), YYYY-MM-DD
	JamMasuk  string                `json:"jam_masuk"`
	JamPulang string                `json:"jam_pulang"`
	HariIni   SiswaAbsensiHariIni   `json:"hari_ini"`
	Rekap     SiswaAbsensiRekap     `json:"rekap"`
	Riwayat   []SiswaAbsensiRiwayat `json:"riwayat"`
}
