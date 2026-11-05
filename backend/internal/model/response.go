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
	KepalaSekolah     string             `json:"kepala_sekolah,omitempty"`
	NIPKepalaSekolah string             `json:"nip_kepala_sekolah,omitempty"`
	NamaSekolah       string             `json:"nama_sekolah,omitempty"`
	AlamatSekolah     string             `json:"alamat_sekolah,omitempty"`
	TeleponSekolah    string             `json:"telepon_sekolah,omitempty"`
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

type AbsensiRombelRekap struct {
	KelasID         string  `json:"kelas_id"`
	NamaKelas       string  `json:"nama_kelas"`
	Tingkat         int     `json:"tingkat"`
	Jurusan         string  `json:"jurusan"`
	WaliKelas       string  `json:"wali_kelas"`
	TotalSiswa      int     `json:"total_siswa"`
	Hadir           int     `json:"hadir"`
	Sakit           int     `json:"sakit"`
	Izin            int     `json:"izin"`
	Alpa            int     `json:"alpa"`
	Terlambat       int     `json:"terlambat"`
	PersenKehadiran float64 `json:"persen_kehadiran"`
}

type AbsensiSummaryResponse struct {
	TotalSiswa            int                  `json:"total_siswa"`
	RataRataKehadiran     float64              `json:"rata_rata_kehadiran"`
	TotalHadirHariIni     int                  `json:"total_hadir_hari_ini"`
	TotalSakitHariIni     int                  `json:"total_sakit_hari_ini"`
	TotalIzinHariIni      int                  `json:"total_izin_hari_ini"`
	TotalAlpaHariIni      int                  `json:"total_alpa_hari_ini"`
	TotalTerlambatHariIni int                  `json:"total_terlambat_hari_ini"`
	TanggalHariIni        string               `json:"tanggal_hari_ini"`
	RombelRekap           []AbsensiRombelRekap `json:"rombel_rekap"`
}

type AbsensiPeringatanItem struct {
	SiswaID         string  `json:"siswa_id"`
	NamaSiswa       string  `json:"nama_siswa"`
	NISN            string  `json:"nisn"`
	NIS             string  `json:"nis"`
	KelasID         string  `json:"kelas_id"`
	NamaKelas       string  `json:"nama_kelas"`
	WaliKelas       string  `json:"wali_kelas"`
	JumlahAlpa      int     `json:"jumlah_alpa"`
	JumlahSakit     int     `json:"jumlah_sakit"`
	JumlahIzin      int     `json:"jumlah_izin"`
	JumlahTerlambat int     `json:"jumlah_terlambat"`
	TotalHari       int     `json:"total_hari"`
	PersenKehadiran float64 `json:"persen_kehadiran"`
	TingkatRisiko   string  `json:"tingkat_risiko"`
	CatatanTerakhir string  `json:"catatan_terakhir"`
}

type AbsensiDetailItem struct {
	ID         string  `json:"id"`
	SiswaID    string  `json:"siswa_id"`
	NamaSiswa  string  `json:"nama_siswa"`
	NISN       string  `json:"nisn"`
	NamaKelas  string  `json:"nama_kelas"`
	Tanggal    string  `json:"tanggal"`
	WaktuMasuk *string `json:"waktu_masuk,omitempty"`
	Status     string  `json:"status"`
	Catatan    string  `json:"catatan"`
}
