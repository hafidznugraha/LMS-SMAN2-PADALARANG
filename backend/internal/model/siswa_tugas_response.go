package model

import (
	"time"

	"github.com/google/uuid"
)

type SiswaPengumpulan struct {
	ID           uuid.UUID  `json:"id"`
	NamaFile     string     `json:"nama_file"`
	Catatan      string     `json:"catatan"`
	Nilai        *float64   `json:"nilai"`
	FeedbackGuru string     `json:"feedback_guru"`
	Status       string     `json:"status"`
	SubmittedAt  time.Time  `json:"submitted_at"`
	GradedAt     *time.Time `json:"graded_at,omitempty"`
}

type SiswaTugasItem struct {
	ID            uuid.UUID         `json:"id"`
	Judul         string            `json:"judul"`
	Deskripsi     string            `json:"deskripsi"`
	NamaMapel     string            `json:"nama_mapel"`
	NamaGuru      string            `json:"nama_guru"`
	Deadline      time.Time         `json:"deadline"`
	Status        string            `json:"status"` // belum | dikumpulkan | dinilai
	LewatDeadline bool              `json:"lewat_deadline"`
	Mendesak      bool              `json:"mendesak"`
	Pengumpulan   *SiswaPengumpulan `json:"pengumpulan,omitempty"`
}
