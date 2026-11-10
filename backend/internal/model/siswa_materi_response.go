package model

import (
	"time"

	"github.com/google/uuid"
)

type SiswaMateriItem struct {
	ID        uuid.UUID `gorm:"column:id" json:"id"`
	Judul     string    `gorm:"column:judul" json:"judul"`
	Deskripsi string    `gorm:"column:deskripsi" json:"deskripsi"`
	MapelID   uuid.UUID `gorm:"column:mapel_id" json:"mapel_id"`
	NamaMapel string    `gorm:"column:nama_mapel" json:"nama_mapel"`
	NamaGuru  string    `gorm:"column:nama_guru" json:"nama_guru"`
	GelarGuru string    `gorm:"column:gelar_guru" json:"gelar_guru,omitempty"`
	TipeFile  string    `gorm:"column:tipe_file" json:"tipe_file"`
	UkuranMB  float64   `gorm:"column:ukuran_mb" json:"ukuran_mb"`
	CreatedAt time.Time `gorm:"column:created_at" json:"created_at"`
}

type SiswaMapelOption struct {
	ID        uuid.UUID `gorm:"column:id" json:"id"`
	NamaMapel string    `gorm:"column:nama_mapel" json:"nama_mapel"`
}

type SiswaMateriListResponse struct {
	Items []SiswaMateriItem  `json:"items"`
	Mapel []SiswaMapelOption `json:"mapel"`
}

type SiswaMateriDownloadResponse struct {
	FileURL  string `json:"file_url"`
	Judul    string `json:"judul"`
	TipeFile string `json:"tipe_file"`
}
