package handler

import (
	"math"
	"strconv"
	"strings"
	"time"
	"unicode"
)

func bulat1(x float64) float64 {
	return math.Round(x*10) / 10
}

// predikatAngka memakai ambang yang sama dengan leger rapor.
func predikatAngka(avg float64) string {
	switch {
	case avg >= 85:
		return "A"
	case avg >= 75:
		return "B"
	case avg >= 65:
		return "C"
	}
	return "D"
}

// rentangSemester mengubah ("2026/2027","Ganjil") menjadi [1 Jul 2026, 1 Jan 2027)
// dan ("2026/2027","Genap") menjadi [1 Jan 2027, 1 Jul 2027), dalam WIB.
func rentangSemester(tahunAjaran, semester string) (awal, akhir time.Time, ok bool) {
	parts := strings.Split(strings.TrimSpace(tahunAjaran), "/")
	if len(parts) != 2 {
		return
	}
	y1, err1 := strconv.Atoi(strings.TrimSpace(parts[0]))
	y2, err2 := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err1 != nil || err2 != nil || y2 != y1+1 {
		return
	}
	switch strings.ToLower(strings.TrimSpace(semester)) {
	case "ganjil":
		return time.Date(y1, 7, 1, 0, 0, 0, 0, wib), time.Date(y2, 1, 1, 0, 0, 0, 0, wib), true
	case "genap":
		return time.Date(y2, 1, 1, 0, 0, 0, 0, wib), time.Date(y2, 7, 1, 0, 0, 0, 0, wib), true
	}
	return
}

// validasiPasswordBaru mengembalikan pesan kesalahan, atau "" bila valid.
func validasiPasswordBaru(lama, baru string) string {
	if len(baru) < 8 {
		return "Password baru minimal 8 karakter"
	}
	if len(baru) > 72 { // batas bcrypt
		return "Password baru maksimal 72 karakter"
	}
	if strings.TrimSpace(baru) != baru {
		return "Password baru tidak boleh diawali atau diakhiri spasi"
	}
	var huruf, angka bool
	for _, r := range baru {
		if unicode.IsLetter(r) {
			huruf = true
		}
		if unicode.IsDigit(r) {
			angka = true
		}
	}
	if !huruf || !angka {
		return "Password baru harus mengandung huruf dan angka"
	}
	if baru == lama {
		return "Password baru tidak boleh sama dengan password lama"
	}
	return ""
}
