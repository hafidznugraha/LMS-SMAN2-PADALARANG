package model

import (
	"time"

	"github.com/google/uuid"
)

type SiswaNilaiItem struct {
	ID        uuid.UUID `json:"id"`
	Jenis     string    `json:"jenis"`
	Skor      float64   `json:"skor"`
	Huruf     string    `json:"huruf"`
	Feedback  string    `json:"feedback"`
	CreatedAt time.Time `json:"created_at"`
}

type SiswaNilaiMapel struct {
	MapelID   uuid.UUID        `json:"mapel_id"`
	NamaMapel string           `json:"nama_mapel"`
	RataRata  float64          `json:"rata_rata"`
	Predikat  string           `json:"predikat"`
	Items     []SiswaNilaiItem `json:"items"`
}

type SiswaNilaiResponse struct {
	RataRata *float64          `json:"rata_rata"`
	Mapel    []SiswaNilaiMapel `json:"mapel"`
}

type SiswaRaporRingkas struct {
	ID           uuid.UUID  `gorm:"column:id" json:"id"`
	Semester     string     `gorm:"column:semester" json:"semester"`
	TahunAjaran  string     `gorm:"column:tahun_ajaran" json:"tahun_ajaran"`
	RataRata     *float64   `gorm:"column:rata_rata_akhir" json:"rata_rata"`
	Predikat     string     `gorm:"column:predikat_akhir" json:"predikat"`
	DisahkanPada *time.Time `gorm:"column:disahkan_pada" json:"disahkan_pada"`
}

type SiswaRaporKehadiran struct {
	Hadir     int `json:"hadir"`
	Sakit     int `json:"sakit"`
	Izin      int `json:"izin"`
	Alpa      int `json:"alpa"`
	Total     int `json:"total"`
	Persen    int `json:"persen"`
	Terlambat int `json:"terlambat"`
}

type SiswaRaporMapel struct {
	KodeMapel  string   `json:"kode"`
	NamaMapel  string   `json:"nama"`
	Kategori   string   `json:"kategori"`
	Tugas      *float64 `json:"tugas"`
	UH         *float64 `json:"uh"`
	UTS        *float64 `json:"uts"`
	UAS        *float64 `json:"uas"`
	NilaiAkhir float64  `json:"nilai_akhir"`
	Predikat   string   `json:"predikat"`
}

type SiswaRaporDetail struct {
	IDLaporan   uuid.UUID `json:"id_laporan"`
	Semester    string    `json:"semester"`
	TahunAjaran string    `json:"tahun_ajaran"`

	NamaSekolah      string `json:"nama_sekolah"`
	AlamatSekolah    string `json:"alamat_sekolah"`
	TeleponSekolah   string `json:"telepon_sekolah"`
	KepalaSekolah    string `json:"kepala_sekolah"`
	NIPKepalaSekolah string `json:"nip_kepala_sekolah"`

	NamaSiswa string `json:"nama_siswa"`
	NIS       string `json:"nis"`
	NISN      string `json:"nisn"`
	Kelas     string `json:"kelas"`
	Tingkat   int    `json:"tingkat"`
	Jurusan   string `json:"jurusan"`
	WaliKelas string `json:"wali_kelas"`
	WaliNIP   string `json:"wali_nip"`

	NilaiPengetahuan  *float64 `json:"nilai_pengetahuan"`
	NilaiKeterampilan *float64 `json:"nilai_keterampilan"`
	RataRata          *float64 `json:"rata_rata"`
	Predikat          string   `json:"predikat"`
	DeskripsiNilai    string   `json:"deskripsi_nilai"`
	CatatanWali       string   `json:"catatan_wali"`

	DisahkanPada *time.Time `json:"disahkan_pada"`
	DisahkanOleh string     `json:"disahkan_oleh"`

	Kehadiran  SiswaRaporKehadiran `json:"kehadiran"`
	NilaiMapel []SiswaRaporMapel   `json:"nilai_mapel"`
}
