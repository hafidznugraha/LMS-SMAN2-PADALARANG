package model

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleKurikulum UserRole = "kurikulum"
	RoleGuru      UserRole = "guru"
	RoleWaliKelas UserRole = "wali_kelas"
	RoleSiswa     UserRole = "siswa"
)

type User struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Username     string    `gorm:"size:50;unique;not null" json:"username"`
	PasswordHash string    `gorm:"size:255;not null" json:"-"`
	NamaLengkap  string    `gorm:"size:100;not null" json:"nama_lengkap"`
	Email        string    `gorm:"size:100;unique;not null" json:"email"`
	Role         UserRole  `gorm:"type:varchar(20);not null" json:"role"`
	IsActive     bool      `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (User) TableName() string {
	return "users"
}

type Kelas struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	NamaKelas  string     `gorm:"size:20;unique;not null" json:"nama_kelas"`
	Tingkat    int        `gorm:"not null" json:"tingkat"`
	Jurusan    string     `gorm:"size:20;not null" json:"jurusan"`
	WaliGuruID *uuid.UUID `gorm:"type:uuid" json:"wali_guru_id,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	WaliGuru   *Guru      `gorm:"foreignKey:WaliGuruID" json:"wali_guru,omitempty"`
}

func (Kelas) TableName() string {
	return "kelas"
}

type Siswa struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;unique;not null" json:"user_id"`
	NIS          string     `gorm:"size:20;unique;not null" json:"nis"`
	NISN         string     `gorm:"size:20;unique;not null" json:"nisn"`
	KelasID      *uuid.UUID `gorm:"type:uuid" json:"kelas_id,omitempty"`
	JenisKelamin string     `gorm:"size:10;not null" json:"jenis_kelamin"`
	NoTelepon    string     `gorm:"size:20" json:"no_telepon"`
	Alamat       string     `gorm:"type:text" json:"alamat"`
	User         User       `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Kelas        *Kelas     `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
}

func (Siswa) TableName() string {
	return "siswa"
}

type Guru struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;unique;not null" json:"user_id"`
	NIP       string    `gorm:"size:30;unique;not null" json:"nip"`
	Gelar     string    `gorm:"size:50" json:"gelar"`
	NoTelepon string    `gorm:"size:20" json:"no_telepon"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (Guru) TableName() string {
	return "guru"
}

type MataPelajaran struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	KodeMapel string    `gorm:"size:20;unique;not null" json:"kode_mapel"`
	NamaMapel string    `gorm:"size:100;not null" json:"nama_mapel"`
	Kategori  string    `gorm:"size:30" json:"kategori"`
}

func (MataPelajaran) TableName() string {
	return "mata_pelajaran"
}

type JadwalPelajaran struct {
	ID         uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	KelasID    uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	GuruID     uuid.UUID     `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID    uuid.UUID     `gorm:"type:uuid;not null" json:"mapel_id"`
	Hari       string        `gorm:"size:10;not null" json:"hari"`
	JamMulai   string        `gorm:"size:10;not null" json:"jam_mulai"`
	JamSelesai string        `gorm:"size:10;not null" json:"jam_selesai"`
	Ruang      string        `gorm:"size:30" json:"ruang"`
	Kelas      Kelas         `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
	Guru       Guru          `gorm:"foreignKey:GuruID" json:"guru,omitempty"`
	Mapel      MataPelajaran `gorm:"foreignKey:MapelID" json:"mapel,omitempty"`
}

func (JadwalPelajaran) TableName() string {
	return "jadwal_pelajaran"
}

type Materi struct {
	ID            uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GuruID        uuid.UUID     `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID       uuid.UUID     `gorm:"type:uuid;not null" json:"mapel_id"`
	KelasID       uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Judul         string        `gorm:"size:200;not null" json:"judul"`
	Deskripsi     string        `gorm:"type:text" json:"deskripsi"`
	FileURL       string        `gorm:"type:text" json:"file_url"`
	TipeFile      string        `gorm:"size:20" json:"tipe_file"`
	UkuranMB      float64       `json:"ukuran_mb"`
	JumlahMelihat int           `gorm:"default:0" json:"jumlah_melihat"`
	CreatedAt     time.Time     `json:"created_at"`
}

func (Materi) TableName() string {
	return "materi"
}

type Tugas struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GuruID    uuid.UUID `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID   uuid.UUID `gorm:"type:uuid;not null" json:"mapel_id"`
	KelasID   uuid.UUID `gorm:"type:uuid;not null" json:"kelas_id"`
	Judul     string    `gorm:"size:200;not null" json:"judul"`
	Deskripsi string    `gorm:"type:text" json:"deskripsi"`
	Deadline  time.Time `gorm:"not null" json:"deadline"`
	CreatedAt time.Time `json:"created_at"`
}

func (Tugas) TableName() string {
	return "tugas"
}

type PengumpulanTugas struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TugasID      uuid.UUID  `gorm:"type:uuid;not null" json:"tugas_id"`
	SiswaID      uuid.UUID  `gorm:"type:uuid;not null" json:"siswa_id"`
	FileURL      string     `gorm:"type:text;not null" json:"file_url"`
	Catatan      string     `gorm:"type:text" json:"catatan"`
	Nilai        *float64   `json:"nilai,omitempty"`
	FeedbackGuru string     `gorm:"type:text" json:"feedback_guru"`
	Status       string     `gorm:"size:20;default:'dikumpulkan'" json:"status"`
	SubmittedAt  time.Time  `json:"submitted_at"`
	GradedAt     *time.Time `json:"graded_at,omitempty"`
}

func (PengumpulanTugas) TableName() string {
	return "pengumpulan_tugas"
}

type AbsensiStatus string

const (
	StatusHadir     AbsensiStatus = "hadir"
	StatusSakit     AbsensiStatus = "sakit"
	StatusIzin      AbsensiStatus = "izin"
	StatusAlpa      AbsensiStatus = "alpa"
	StatusTerlambat AbsensiStatus = "terlambat"
)

type Absensi struct {
	ID         uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SiswaID    uuid.UUID     `gorm:"type:uuid;not null" json:"siswa_id"`
	KelasID    uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Tanggal    time.Time     `gorm:"type:date;not null" json:"tanggal"`
	WaktuMasuk *time.Time    `json:"waktu_masuk,omitempty"`
	Status     AbsensiStatus `gorm:"type:varchar(20);not null" json:"status"`
	Catatan    string        `gorm:"size:255" json:"catatan"`
	CreatedAt  time.Time     `json:"created_at"`
}

func (Absensi) TableName() string {
	return "absensi"
}

type CreateKelasRequest struct {
	NamaKelas  string `json:"nama_kelas"`
	Tingkat    int    `json:"tingkat"`
	Jurusan    string `json:"jurusan"`
	WaliGuruID string `json:"wali_guru_id,omitempty"`
}

type UpdateKelasRequest struct {
	NamaKelas  string `json:"nama_kelas"`
	Tingkat    int    `json:"tingkat"`
	Jurusan    string `json:"jurusan"`
	WaliGuruID string `json:"wali_guru_id,omitempty"`
}

type CreateJadwalRequest struct {
	KelasID    string `json:"kelas_id"`
	GuruID     string `json:"guru_id"`
	MapelID    string `json:"mapel_id"`
	Hari       string `json:"hari"`
	JamMulai   string `json:"jam_mulai"`
	JamSelesai string `json:"jam_selesai"`
	Ruang      string `json:"ruang"`
}

type UpdateJadwalRequest struct {
	KelasID    string `json:"kelas_id"`
	GuruID     string `json:"guru_id"`
	MapelID    string `json:"mapel_id"`
	Hari       string `json:"hari"`
	JamMulai   string `json:"jam_mulai"`
	JamSelesai string `json:"jam_selesai"`
	Ruang      string `json:"ruang"`
}

type CreateUserRequest struct {
	Username     string   `json:"username"`
	Password     string   `json:"password"`
	NamaLengkap  string   `json:"nama_lengkap"`
	Email        string   `json:"email"`
	Role         UserRole `json:"role"`
	NIP          string   `json:"nip,omitempty"`
	Gelar        string   `json:"gelar,omitempty"`
	NIS          string   `json:"nis,omitempty"`
	NISN         string   `json:"nisn,omitempty"`
	KelasID      string   `json:"kelas_id,omitempty"`
	JenisKelamin string   `json:"jenis_kelamin,omitempty"`
	NoTelepon    string   `json:"no_telepon,omitempty"`
	Alamat       string   `json:"alamat,omitempty"`
}

type UpdateUserRequest struct {
	NamaLengkap string   `json:"nama_lengkap"`
	Email       string   `json:"email"`
	Role        UserRole `json:"role"`
	IsActive    *bool    `json:"is_active,omitempty"`
}
