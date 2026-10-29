package model

import (
	"time"

	"github.com/google/uuid"
)

// UserRole mendefinisikan peran pengguna di sistem LMS
type UserRole string

const (
	RoleKurikulum UserRole = "kurikulum"
	RoleGuru      UserRole = "guru"
	RoleWaliKelas UserRole = "wali_kelas"
	RoleSiswa     UserRole = "siswa"
)

// User merepresentasikan entitas akun pengguna
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

// Kelas merepresentasikan rombongan belajar
type Kelas struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	NamaKelas string     `gorm:"size:20;unique;not null" json:"nama_kelas"`
	Tingkat   int        `gorm:"not null" json:"tingkat"`
	Jurusan   string     `gorm:"size:20;not null" json:"jurusan"`
	WaliGuruID *uuid.UUID `gorm:"type:uuid" json:"wali_guru_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// Siswa merepresentasikan profil siswa sekolah
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

// Guru merepresentasikan profil guru pendidik
type Guru struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;unique;not null" json:"user_id"`
	NIP       string    `gorm:"size:30;unique;not null" json:"nip"`
	Gelar     string    `gorm:"size:50" json:"gelar"`
	NoTelepon string    `gorm:"size:20" json:"no_telepon"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// MataPelajaran merepresentasikan kurikulum mata pelajaran
type MataPelajaran struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	KodeMapel string    `gorm:"size:20;unique;not null" json:"kode_mapel"`
	NamaMapel string    `gorm:"size:100;not null" json:"nama_mapel"`
	Kategori  string    `gorm:"size:30" json:"kategori"`
}

// JadwalPelajaran merepresentasikan penugasan jadwal kelas dan guru
type JadwalPelajaran struct {
	ID        uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	KelasID   uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	GuruID    uuid.UUID     `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID   uuid.UUID     `gorm:"type:uuid;not null" json:"mapel_id"`
	Hari      string        `gorm:"size:10;not null" json:"hari"`
	JamMulai  string        `gorm:"size:10;not null" json:"jam_mulai"`
	JamSelesai string       `gorm:"size:10;not null" json:"jam_selesai"`
	Ruang     string        `gorm:"size:30" json:"ruang"`
	Kelas     Kelas         `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
	Guru      Guru          `gorm:"foreignKey:GuruID" json:"guru,omitempty"`
	Mapel     MataPelajaran `gorm:"foreignKey:MapelID" json:"mapel,omitempty"`
}

// Materi merepresentasikan konten pembelajaran
type Materi struct {
	ID           uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GuruID       uuid.UUID     `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID      uuid.UUID     `gorm:"type:uuid;not null" json:"mapel_id"`
	KelasID      uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Judul        string        `gorm:"size:200;not null" json:"judul"`
	Deskripsi    string        `gorm:"type:text" json:"deskripsi"`
	FileURL      string        `gorm:"type:text" json:"file_url"`
	TipeFile     string        `gorm:"size:20" json:"tipe_file"`
	UkuranMB     float64       `json:"ukuran_mb"`
	JumlahMelihat int          `gorm:"default:0" json:"jumlah_melihat"`
	CreatedAt    time.Time     `json:"created_at"`
}

// Tugas merepresentasikan penugasan akademik
type Tugas struct {
	ID          uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GuruID      uuid.UUID     `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID     uuid.UUID     `gorm:"type:uuid;not null" json:"mapel_id"`
	KelasID     uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Judul       string        `gorm:"size:200;not null" json:"judul"`
	Deskripsi   string        `gorm:"type:text" json:"deskripsi"`
	Deadline    time.Time     `gorm:"not null" json:"deadline"`
	CreatedAt   time.Time     `json:"created_at"`
}

// PengumpulanTugas merepresentasikan submisi tugas oleh siswa
type PengumpulanTugas struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	TugasID       uuid.UUID `gorm:"type:uuid;not null" json:"tugas_id"`
	SiswaID       uuid.UUID `gorm:"type:uuid;not null" json:"siswa_id"`
	FileURL       string    `gorm:"type:text;not null" json:"file_url"`
	Catatan       string    `gorm:"type:text" json:"catatan"`
	Nilai         *float64  `json:"nilai,omitempty"`
	FeedbackGuru  string    `gorm:"type:text" json:"feedback_guru"`
	Status        string    `gorm:"size:20;default:'dikumpulkan'" json:"status"`
	SubmittedAt   time.Time `json:"submitted_at"`
	GradedAt      *time.Time `json:"graded_at,omitempty"`
}

// AbsensiStatus tipe status kehadiran
type AbsensiStatus string

const (
	StatusHadir     AbsensiStatus = "hadir"
	StatusSakit     AbsensiStatus = "sakit"
	StatusIzin      AbsensiStatus = "izin"
	StatusAlpa      AbsensiStatus = "alpa"
	StatusTerlambat AbsensiStatus = "terlambat"
)

// Absensi merepresentasikan kehadiran harian siswa
type Absensi struct {
	ID        uuid.UUID     `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SiswaID   uuid.UUID     `gorm:"type:uuid;not null" json:"siswa_id"`
	KelasID   uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Tanggal   time.Time     `gorm:"type:date;not null" json:"tanggal"`
	WaktuMasuk *time.Time   `json:"waktu_masuk,omitempty"`
	Status    AbsensiStatus `gorm:"type:varchar(20);not null" json:"status"`
	Catatan   string        `gorm:"size:255" json:"catatan"`
	CreatedAt time.Time     `json:"created_at"`
}
