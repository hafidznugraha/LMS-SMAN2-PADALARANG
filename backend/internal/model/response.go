package model

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

type PaginatedResponse struct {
	Success    bool        `json:"success"`
	Message    string      `json:"message"`
	Data       interface{} `json:"data"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalItems int64       `json:"total_items"`
	TotalPages int         `json:"total_pages"`
}

type RombelStatItem struct {
	KelasID        string  `json:"kelas_id"`
	NamaKelas      string  `json:"nama_kelas"`
	Jurusan        string  `json:"jurusan"`
	Tingkat        int     `json:"tingkat"`
	WaliKelas      string  `json:"wali_kelas"`
	TotalSiswa     int     `json:"total_siswa"`
	DisahkanCount  int     `json:"disahkan_count"`
	ProgresPersen  float64 `json:"progres_persen"`
	RataRataRombel float64 `json:"rata_rata_rombels"`
	StatusRombel   string  `json:"status_rombel"`
}

type LaporanSummaryResponse struct {
	TotalSiswa      int              `json:"total_siswa"`
	TotalDisahkan   int              `json:"total_disahkan"`
	TotalMenunggu   int              `json:"total_menunggu"`
	TotalDraf       int              `json:"total_draf"`
	RataRataSekolah float64          `json:"rata_rata_sekolah"`
	Semester        string           `json:"semester"`
	TahunAjaran     string           `json:"tahun_ajaran"`
	RombelStats     []RombelStatItem `json:"rombel_stats"`
}

type NilaiMapelDetail struct {
	KodeMapel    string  `json:"kode"`
	NamaMapel    string  `json:"nama"`
	Kategori     string  `json:"kategori"`
	Pengetahuan  float64 `json:"pengetahuan"`
	Keterampilan float64 `json:"keterampilan"`
	NilaiAkhir   float64 `json:"nilai_akhir"`
	Predikat     string  `json:"predikat"`
	Capaian      string  `json:"capaian"`
}

type KehadiranDetail struct {
	Persen int `json:"persen"`
	Sakit  int `json:"sakit"`
	Izin   int `json:"izin"`
	Alfa   int `json:"alfa"`
}

type StudentRaportDetailResponse struct {
	IDLaporan         string             `json:"id_laporan"`
	SiswaID           string             `json:"siswa_id"`
	NIS               string             `json:"nis"`
	NISN              string             `json:"nisn"`
	NamaSiswa         string             `json:"nama"`
	JenisKelamin      string             `json:"gender"`
	Rombel            string             `json:"rombel"`
	KelasID           string             `json:"kelas_id"`
	Tingkat           int                `json:"tingkat"`
	Jurusan           string             `json:"jurusan"`
	WaliKelas         string             `json:"wali_kelas"`
	WaliNIP           string             `json:"wali_nip"`
	NilaiPengetahuan  float64            `json:"pengetahuan"`
	NilaiKeterampilan float64            `json:"keterampilan"`
	RataRata          float64            `json:"rata_rata"`
	Predikat          string             `json:"predikat"`
	DeskripsiNilai    string             `json:"deskripsi_nilai"`
	CatatanWali       string             `json:"catatan_wali"`
	CatatanRevisi     string             `json:"catatan_revisi"`
	StatusLaporan     string             `json:"status_laporan"`
	DisahkanPada      *string            `json:"disahkan_pada,omitempty"`
	DisahkanOleh      string             `json:"disahkan_oleh,omitempty"`
	IsLocked          bool               `json:"is_locked"`
	Kehadiran         KehadiranDetail    `json:"kehadiran"`
	NilaiMapel        []NilaiMapelDetail `json:"nilai_mapel"`
}
