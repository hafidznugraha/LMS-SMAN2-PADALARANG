package model

import (
	"time"

	"github.com/google/uuid"
)

type SiswaPengumpulan struct {
	ID           uuid.UUID  `json:"id"`
	NamaFile     string     `json:"nama_file"`
	FileURL      string     `json:"file_url,omitempty"`
	Catatan      string     `json:"catatan"`
	Nilai        *float64   `json:"nilai"`
	FeedbackGuru string     `json:"feedback_guru"`
	Status       string     `json:"status"`
	SubmittedAt  time.Time  `json:"submitted_at"`
	GradedAt     *time.Time `json:"graded_at,omitempty"`
}

type SiswaTugasItem struct {
	ID            uuid.UUID         `json:"id"`
	MapelID       uuid.UUID         `json:"mapel_id"`
	GuruID        uuid.UUID         `json:"guru_id"`
	Judul         string            `json:"judul"`
	Deskripsi     string            `json:"deskripsi"`
	FormatFile    string            `json:"format_file"`
	FileLampiran  string            `json:"file_lampiran"`
	Topik         string            `json:"topik"`
	NamaMapel     string            `json:"nama_mapel"`
	NamaGuru      string            `json:"nama_guru"`
	GelarGuru     string            `json:"gelar_guru,omitempty"`
	Deadline      time.Time         `json:"deadline"`
	Status        string            `json:"status"` // belum | dikumpulkan | dinilai
	LewatDeadline bool              `json:"lewat_deadline"`
	Mendesak      bool              `json:"mendesak"`
	Pengumpulan   *SiswaPengumpulan `json:"pengumpulan,omitempty"`
}
