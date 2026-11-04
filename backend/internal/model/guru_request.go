package model

import (
	"time"

	"github.com/google/uuid"
)

type CreateMateriRequest struct {
	GuruID    string  `json:"guru_id"`
	MapelID   string  `json:"mapel_id"`
	KelasID   string  `json:"kelas_id"`
	Judul     string  `json:"judul"`
	Deskripsi string  `json:"deskripsi"`
	Tipe      string  `json:"tipe"`
	TipeFile  string  `json:"tipe_file"`
	UkuranMB  float64 `json:"ukuran_mb"`
	FileURL   string  `json:"file_url"`
}

type CreateMateriGuruRequest = CreateMateriRequest

type CreateTugasRequest struct {
	GuruID          string `json:"guru_id"`
	MapelID         string `json:"mapel_id"`
	KelasID         string `json:"kelas_id"`
	Judul           string `json:"judul"`
	Deskripsi       string `json:"deskripsi"`
	Instruksi       string `json:"instruksi"`
	Jenis           string `json:"jenis"`
	Deadline        string `json:"deadline"`
	TenggatWaktu    string `json:"tenggat_waktu"`
	FileLampiran    string `json:"file_lampiran"`
	FormatFile      string `json:"format_file"`
	RubrikPenilaian string `json:"rubrik_penilaian"`
	BobotNilai      int    `json:"bobot_nilai,omitempty"`
}

type CreateTugasGuruRequest = CreateTugasRequest

type TugasDetailResponse struct {
	ID                 uuid.UUID `json:"id"`
	IDTugasKuis        uuid.UUID `json:"id_tugas_kuis"`
	GuruID             uuid.UUID `json:"guru_id"`
	IDGuru             uuid.UUID `json:"id_guru"`
	MapelID            uuid.UUID `json:"mapel_id"`
	IDMapel            uuid.UUID `json:"id_mapel"`
	NamaMapel          string    `json:"nama_mapel"`
	KodeMapel          string    `json:"kode_mapel"`
	KelasID            uuid.UUID `json:"kelas_id"`
	IDKelas            uuid.UUID `json:"id_kelas"`
	NamaKelas          string    `json:"nama_kelas"`
	Judul              string    `json:"judul"`
	Instruksi          string    `json:"instruksi"`
	Deskripsi          string    `json:"deskripsi"`
	Jenis              string    `json:"jenis"`
	TenggatWaktu       string    `json:"tenggat_waktu"`
	Deadline           time.Time `json:"deadline"`
	FormatFile         string    `json:"format_file"`
	RubrikPenilaian    string    `json:"rubrik_penilaian"`
	TotalSiswa         int       `json:"total_siswa"`
	JumlahMengumpulkan int       `json:"jumlah_mengumpulkan"`
	JumlahDinilai      int       `json:"jumlah_dinilai"`
	CreatedAt          time.Time `json:"created_at"`
}

type SubmissionWithSiswa struct {
	ID              uuid.UUID  `json:"id"`
	IDPengumpulan   uuid.UUID  `json:"id_pengumpulan"`
	TugasID         uuid.UUID  `json:"tugas_id"`
	IDTugasKuis     uuid.UUID  `json:"id_tugas_kuis"`
	SiswaID         uuid.UUID  `json:"siswa_id"`
	IDSiswa         uuid.UUID  `json:"id_siswa"`
	NamaSiswa       string     `json:"nama_siswa"`
	NIS             string     `json:"nis"`
	NamaKelas       string     `json:"nama_kelas"`
	FileTugas       string     `json:"file_tugas"`
	FileName        string     `json:"file_name"`
	CatatanSiswa    string     `json:"catatan_siswa"`
	WaktuKirim      time.Time  `json:"waktu_kirim"`
	TanggalKumpul   string     `json:"tanggal_kumpul"`
	Nilai           *float64   `json:"nilai"`
	CatatanGuru     string     `json:"catatan_guru"`
	FeedbackGuru    string     `json:"feedback_guru"`
	Feedback        string     `json:"feedback"`
	StatusPenilaian string     `json:"status_penilaian"`
	StatusKumpul    string     `json:"status_kumpul"`
}

type GradeSubmissionRequest struct {
	TugasID      string  `json:"tugas_id,omitempty"`
	SiswaID      string  `json:"siswa_id,omitempty"`
	Nilai        float64 `json:"nilai"`
	FeedbackGuru string  `json:"feedback_guru"`
	CatatanGuru  string  `json:"catatan_guru"`
	Catatan      string  `json:"catatan"`
	Feedback     string  `json:"feedback,omitempty"`
}

type GradeSubmissionGuruRequest = GradeSubmissionRequest

type UpdateAbsensiStatusRequest struct {
	Status  string `json:"status"`
	Catatan string `json:"catatan"`
}

type UpdateAbsensiGuruRequest = UpdateAbsensiStatusRequest
