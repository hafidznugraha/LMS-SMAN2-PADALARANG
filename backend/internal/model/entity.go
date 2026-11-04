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
	WaliGuruID *uuid.UUID `gorm:"type:uuid;uniqueIndex" json:"wali_guru_id,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	WaliGuru   *Guru      `gorm:"foreignKey:WaliGuruID" json:"wali_guru,omitempty"`
}

func (Kelas) TableName() string {
	return "kelas"
}

type Siswa struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID       uuid.UUID  `gorm:"type:uuid;unique;not null" json:"user_id"`
	NIS          string     `gorm:"column:nis;size:20;unique;not null" json:"nis"`
	NISN         string     `gorm:"column:nisn;size:20;unique;not null" json:"nisn"`
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
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID      uuid.UUID      `gorm:"type:uuid;unique;not null" json:"user_id"`
	MapelID     *uuid.UUID     `gorm:"type:uuid" json:"mapel_id,omitempty"`
	NIP         string         `gorm:"column:nip;size:30;unique;not null" json:"nip"`
	Gelar       string         `gorm:"size:50" json:"gelar"`
	NoTelepon   string         `gorm:"size:20" json:"no_telepon"`
	User        User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Mapel       *MataPelajaran `gorm:"foreignKey:MapelID" json:"mapel,omitempty"`
	KelasBinaan []Kelas        `gorm:"foreignKey:WaliGuruID" json:"kelas_binaan,omitempty"`
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
	ID          uuid.UUID          `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	GuruID      uuid.UUID          `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID     uuid.UUID          `gorm:"type:uuid;not null" json:"mapel_id"`
	KelasID     uuid.UUID          `gorm:"type:uuid;not null" json:"kelas_id"`
	Judul       string             `gorm:"size:200;not null" json:"judul"`
	Deskripsi   string             `gorm:"type:text" json:"deskripsi"`
	Deadline    time.Time          `gorm:"not null" json:"deadline"`
	CreatedAt   time.Time          `json:"created_at"`
	Guru        *Guru              `gorm:"foreignKey:GuruID" json:"guru,omitempty"`
	Mapel       *MataPelajaran     `gorm:"foreignKey:MapelID" json:"mapel,omitempty"`
	Kelas       *Kelas             `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
	Submissions []PengumpulanTugas `gorm:"foreignKey:TugasID" json:"submissions,omitempty"`
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
	Siswa        *Siswa     `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`
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
	Siswa      *Siswa        `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`
	KelasID    uuid.UUID     `gorm:"type:uuid;not null" json:"kelas_id"`
	Kelas      *Kelas        `gorm:"foreignKey:KelasID" json:"kelas,omitempty"`
	Tanggal    time.Time     `gorm:"type:date;not null" json:"tanggal"`
	WaktuMasuk *string       `gorm:"type:time" json:"waktu_masuk,omitempty"`
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

type CreateMapelRequest struct {
	KodeMapel string `json:"kode_mapel"`
	NamaMapel string `json:"nama_mapel"`
	Kategori  string `json:"kategori"`
}

type UpdateMapelRequest struct {
	KodeMapel string `json:"kode_mapel"`
	NamaMapel string `json:"nama_mapel"`
	Kategori  string `json:"kategori"`
}

type CreateJadwalRequest struct {
	KelasID    string `json:"kelas_id"`
	GuruID     string `json:"guru_id,omitempty"`
	MapelID    string `json:"mapel_id"`
	Hari       string `json:"hari"`
	JamMulai   string `json:"jam_mulai"`
	JamSelesai string `json:"jam_selesai"`
	Ruang      string `json:"ruang"`
}

type UpdateJadwalRequest struct {
	KelasID    string `json:"kelas_id"`
	GuruID     string `json:"guru_id,omitempty"`
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
	MapelID      string   `json:"mapel_id,omitempty"`
	NIS          string   `json:"nis,omitempty"`
	NISN         string   `json:"nisn,omitempty"`
	KelasID      string   `json:"kelas_id,omitempty"`
	JenisKelamin string   `json:"jenis_kelamin,omitempty"`
	NoTelepon    string   `json:"no_telepon,omitempty"`
	Alamat       string   `json:"alamat,omitempty"`
}

type UpdateUserRequest struct {
	NamaLengkap  string   `json:"nama_lengkap"`
	Email        string   `json:"email"`
	Password     string   `json:"password,omitempty"`
	Role         UserRole `json:"role"`
	IsActive     *bool    `json:"is_active,omitempty"`
	NIP          string   `json:"nip,omitempty"`
	Gelar        string   `json:"gelar,omitempty"`
	MapelID      string   `json:"mapel_id,omitempty"`
	NIS          string   `json:"nis,omitempty"`
	NISN         string   `json:"nisn,omitempty"`
	KelasID      string   `json:"kelas_id,omitempty"`
	JenisKelamin string   `json:"jenis_kelamin,omitempty"`
	NoTelepon    string   `json:"no_telepon,omitempty"`
	Alamat       string   `json:"alamat,omitempty"`
}

type JenisPenilaian string

const (
	PenilaianTugas         JenisPenilaian = "Tugas"
	PenilaianUlanganHarian JenisPenilaian = "UlanganHarian"
	PenilaianUTS           JenisPenilaian = "UTS"
	PenilaianUAS           JenisPenilaian = "UAS"
)

type Nilai struct {
	ID             uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	SiswaID        uuid.UUID      `gorm:"type:uuid;not null" json:"siswa_id"`
	GuruID         uuid.UUID      `gorm:"type:uuid;not null" json:"guru_id"`
	MapelID        uuid.UUID      `gorm:"type:uuid;not null" json:"mapel_id"`
	JenisPenilaian JenisPenilaian `gorm:"type:varchar(20);not null" json:"jenis_penilaian"`
	SkorAngka      float64        `gorm:"type:numeric(5,2);not null" json:"skor_angka"`
	SkorHuruf      string         `gorm:"size:2" json:"skor_huruf"`
	Feedback       string         `gorm:"type:text" json:"feedback"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      *time.Time     `gorm:"index" json:"deleted_at,omitempty"`
	Siswa          *Siswa         `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`
	Guru           *Guru          `gorm:"foreignKey:GuruID" json:"guru,omitempty"`
	Mapel          *MataPelajaran `gorm:"foreignKey:MapelID" json:"mapel,omitempty"`
}

func (Nilai) TableName() string {
	return "nilai"
}

type StatusLaporan string

const (
	StatusLaporanDraf              StatusLaporan = "Draf"
	StatusLaporanDitinjauWali      StatusLaporan = "DitinjauWali"
	StatusLaporanDisahkanKurikulum StatusLaporan = "DisahkanKurikulum"
)

type LaporanAkademik struct {
	ID                uuid.UUID     `gorm:"column:id_laporan;type:uuid;primaryKey;default:gen_random_uuid()" json:"id_laporan"`
	SiswaID           uuid.UUID     `gorm:"column:id_siswa;type:uuid;not null" json:"id_siswa"`
	Semester          string        `gorm:"size:10;not null" json:"semester"`
	TahunAjaran       string        `gorm:"size:20;not null" json:"tahun_ajaran"`
	NilaiPengetahuan  *float64      `gorm:"column:nilai_pengetahuan;type:numeric(5,2)" json:"nilai_pengetahuan"`
	NilaiKeterampilan *float64      `gorm:"column:nilai_keterampilan;type:numeric(5,2)" json:"nilai_keterampilan"`
	RataRataAkhir     *float64      `gorm:"column:rata_rata_akhir;type:numeric(5,2)" json:"rata_rata_akhir"`
	PredikatAkhir     string        `gorm:"column:predikat_akhir;size:5" json:"predikat_akhir"`
	DeskripsiNilai    string        `gorm:"column:deskripsi_nilai;type:text" json:"deskripsi_nilai"`
	CatatanWali       string        `gorm:"column:catatan_wali;type:text" json:"catatan_wali"`
	CatatanRevisi     string        `gorm:"column:catatan_revisi;type:text" json:"catatan_revisi"`
	StatusLaporan     StatusLaporan `gorm:"column:status_laporan;size:25;default:'Draf'" json:"status_laporan"`
	DisahkanPada      *time.Time    `gorm:"column:disahkan_pada" json:"disahkan_pada"`
	DisahkanOleh      string        `gorm:"column:disahkan_oleh;size:100" json:"disahkan_oleh"`
	CreatedAt         time.Time     `gorm:"column:created_at" json:"created_at"`
	UpdatedAt         time.Time     `gorm:"column:updated_at" json:"updated_at"`
	DeletedAt         *time.Time    `gorm:"column:deleted_at;index" json:"deleted_at,omitempty"`
	Siswa             *Siswa        `gorm:"foreignKey:SiswaID" json:"siswa,omitempty"`
}

func (LaporanAkademik) TableName() string {
	return "laporan_akademik"
}

type FinalizeLaporanRequest struct {
	Semester    string `json:"semester"`
	TahunAjaran string `json:"tahun_ajaran"`
}

type FinalizeBatchRequest struct {
	KelasID     string   `json:"kelas_id"`
	LaporanIDs  []string `json:"laporan_ids"`
	Semester    string   `json:"semester"`
	TahunAjaran string   `json:"tahun_ajaran"`
}

type RevisiLaporanRequest struct {
	IDLaporan     string `json:"id_laporan"`
	CatatanRevisi string `json:"catatan_revisi"`
}

type UpdateCatatanWaliRequest struct {
	CatatanWali string `json:"catatan_wali"`
}

type GenerateLaporanRequest struct {
	KelasID     string `json:"kelas_id"`
	Semester    string `json:"semester"`
	TahunAjaran string `json:"tahun_ajaran"`
}

type CreateNilaiRequest struct {
	SiswaID        string  `json:"siswa_id"`
	MapelID        string  `json:"mapel_id"`
	JenisPenilaian string  `json:"jenis_penilaian"`
	SkorAngka      float64 `json:"skor_angka"`
	Feedback       string  `json:"feedback"`
}

type PengaturanSekolah struct {
	ID                        uuid.UUID  `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	NamaSekolah               string     `gorm:"size:150;not null" json:"nama_sekolah"`
	NPSN                      string     `gorm:"size:20;not null" json:"npsn"`
	Akreditasi                string     `gorm:"size:5;not null" json:"akreditasi"`
	Alamat                    string     `gorm:"type:text;not null" json:"alamat"`
	Telepon                   string     `gorm:"size:30" json:"telepon"`
	Email                     string     `gorm:"size:100" json:"email"`
	Website                   string     `gorm:"size:100" json:"website"`
	KepalaSekolah             string     `gorm:"size:100;not null" json:"kepala_sekolah"`
	NIPKepalaSekolah          string     `gorm:"size:30" json:"nip_kepala_sekolah"`
	WakaKurikulum             string     `gorm:"size:100;not null" json:"waka_kurikulum"`
	NIPWakaKurikulum          string     `gorm:"size:30" json:"nip_waka_kurikulum"`
	TahunAjaranAktif          string     `gorm:"size:20;not null" json:"tahun_ajaran_aktif"`
	SemesterAktif             string     `gorm:"size:10;not null" json:"semester_aktif"`
	TenggatKunciRaport        *time.Time `gorm:"type:date" json:"tenggat_kunci_raport"`
	DurasiKBMMenit            int        `gorm:"not null" json:"durasi_kbm_menit"`
	JamMasuk                  string     `gorm:"type:time;not null" json:"jam_masuk"`
	JamPulang                 string     `gorm:"type:time;not null" json:"jam_pulang"`
	StatusSinkronisasiDapodik string     `gorm:"size:30" json:"status_sinkronisasi_dapodik"`
	TerakhirSinkron           *time.Time `json:"terakhir_sinkron"`
	CreatedAt                 time.Time  `json:"created_at"`
	UpdatedAt                 time.Time  `json:"updated_at"`
}

func (PengaturanSekolah) TableName() string {
	return "pengaturan_sekolah"
}

type UpdatePengaturanRequest struct {
	NamaSekolah        string `json:"nama_sekolah"`
	NPSN               string `json:"npsn"`
	Akreditasi         string `json:"akreditasi"`
	Alamat             string `json:"alamat"`
	Telepon            string `json:"telepon"`
	Email              string `json:"email"`
	Website            string `json:"website"`
	KepalaSekolah      string `json:"kepala_sekolah"`
	NIPKepalaSekolah   string `json:"nip_kepala_sekolah"`
	WakaKurikulum      string `json:"waka_kurikulum"`
	NIPWakaKurikulum   string `json:"nip_waka_kurikulum"`
	TahunAjaranAktif   string `json:"tahun_ajaran_aktif"`
	SemesterAktif      string `json:"semester_aktif"`
	TenggatKunciRaport string `json:"tenggat_kunci_raport"`
	DurasiKBMMenit     int    `json:"durasi_kbm_menit"`
	JamMasuk           string `json:"jam_masuk"`
	JamPulang          string `json:"jam_pulang"`
}
