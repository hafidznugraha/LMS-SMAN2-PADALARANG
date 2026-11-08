package model

type SiswaAbsenHariIni struct {
	Sudah      bool    `json:"sudah"`
	Status     string  `json:"status,omitempty"`
	WaktuMasuk *string `json:"waktu_masuk,omitempty"`
}

type SiswaDashboardResponse struct {
	NamaLengkap string `json:"nama_lengkap"`
	NamaKelas   string `json:"nama_kelas"`
	Semester    string `json:"semester"`
	TahunAjaran string `json:"tahun_ajaran"`

	MateriTersedia int `json:"materi_tersedia"`
	JumlahMapel    int `json:"jumlah_mapel"`

	TugasTotal    int      `json:"tugas_total"`
	TugasSelesai  int      `json:"tugas_selesai"`
	TugasMenunggu int      `json:"tugas_menunggu"`
	TugasMendesak int      `json:"tugas_mendesak"`
	TugasDinilai  int      `json:"tugas_dinilai"`
	RataRataNilai *float64 `json:"rata_rata_nilai"`

	KehadiranPersen int               `json:"kehadiran_persen"`
	HariTercatat    int               `json:"hari_tercatat"`
	AbsenHariIni    SiswaAbsenHariIni `json:"absen_hari_ini"`
	HariIni         string            `json:"hari_ini"`        // <- tambah
	JadwalHariIni   []SiswaJadwalItem `json:"jadwal_hari_ini"` // <- tambah
}

type SiswaJadwalItem struct {
	ID         string `json:"id"`
	NamaMapel  string `json:"nama_mapel"`
	NamaGuru   string `json:"nama_guru"`
	JamMulai   string `json:"jam_mulai"`   // "07:00"
	JamSelesai string `json:"jam_selesai"` // "09:00"
	Ruang      string `json:"ruang"`
	Status     string `json:"status"` // selesai | berlangsung | akan_datang
}
