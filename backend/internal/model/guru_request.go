package model

import (
	"time"

	"github.com/google/uuid"
)

// 1. Request untuk Buat / Upload Materi
type CreateMateriRequest struct {
	GuruID    string  `json:"guru_id"`
	MapelID   string  `json:"mapel_id"`
	KelasID   string  `json:"kelas_id"`
	Judul     string  `json:"judul"`
	Deskripsi string  `json:"deskripsi"`
	Tipe      string  `json:"tipe"`
	TipeFile  string  `json:"tipe_file"` // Ditambahkan untuk baris 100
	UkuranMB  float64 `json:"ukuran_mb"` // Ditambahkan untuk baris 101
	FileURL   string  `json:"file_url"`
}

type CreateMateriGuruRequest = CreateMateriRequest

// 2. Request untuk Buat Tugas
type CreateTugasRequest struct {
	GuruID       string `json:"guru_id"`
	MapelID      string `json:"mapel_id"`
	KelasID      string `json:"kelas_id"`
	Judul        string `json:"judul"`
	Deskripsi    string `json:"deskripsi"`
	Deadline     string `json:"deadline"` // Diubah menjadi string untuk time.Parse di baris 191
	FileLampiran string `json:"file_lampiran"`
	BobotNilai   int    `json:"bobot_nilai,omitempty"`
}

type CreateTugasGuruRequest = CreateTugasRequest

// 3. Response struct saat Guru melihat daftar pengumpulan tugas siswa
type SubmissionWithSiswa struct {
	ID              uuid.UUID `json:"id"`
	TugasID         uuid.UUID `json:"tugas_id"`
	SiswaID         uuid.UUID `json:"siswa_id"`
	NamaSiswa       string    `json:"nama_siswa"`
	NIS             string    `json:"nis"`
	NamaKelas       string    `json:"nama_kelas"`
	FileTugas       string    `json:"file_tugas"`
	CatatanSiswa    string    `json:"catatan_siswa"`
	WaktuKirim      time.Time `json:"waktu_kirim"`
	Nilai           *float64  `json:"nilai"`
	CatatanGuru     string    `json:"catatan_guru"`
	FeedbackGuru    string    `json:"feedback_guru"`
	StatusPenilaian string    `json:"status_penilaian"`
}

// 4. Request saat Guru memberi nilai & feedback tugas siswa
type GradeSubmissionRequest struct {
	Nilai        float64 `json:"nilai"`
	FeedbackGuru string  `json:"feedback_guru"` // Ditambahkan untuk baris 292
	CatatanGuru  string  `json:"catatan_guru"`
	Catatan      string  `json:"catatan"`
}

type GradeSubmissionGuruRequest = GradeSubmissionRequest

// 5. Request saat Guru memperbarui/koreksi status absensi siswa
type UpdateAbsensiStatusRequest struct {
	Status  string `json:"status"` // 'hadir', 'sakit', 'izin', 'alfa'
	Catatan string `json:"catatan"`
}

type UpdateAbsensiGuruRequest = UpdateAbsensiStatusRequest