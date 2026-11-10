package handler

import (
	"strconv"
	"strings"
	"time"
)

const (
	defaultJamMasukMenit  = 7*60 + 0
	defaultJamPulangMenit = 15*60 + 30
)

var wib = time.FixedZone("WIB", 7*3600)

func parseJamMenit(s string, fallback int) int {
	parts := strings.Split(strings.TrimSpace(s), ":")
	if len(parts) < 2 {
		return fallback
	}
	h, err1 := strconv.Atoi(parts[0])
	m, err2 := strconv.Atoi(parts[1])
	if err1 != nil || err2 != nil || h < 0 || h > 23 || m < 0 || m > 59 {
		return fallback
	}
	return h*60 + m
}

func menitHari(t time.Time) int {
	return t.Hour()*60 + t.Minute()
}

func statusHadir(now time.Time, jamMasukMenit int) string {
	if menitHari(now) > jamMasukMenit {
		return "terlambat"
	}
	return "hadir"
}

func alasanTidakBisaAbsen(now time.Time, jamPulangMenit int, adaKelas bool) string {
	if !adaKelas {
		return "Kamu belum ditempatkan di kelas"
	}
	if wd := now.Weekday(); wd == time.Saturday || wd == time.Sunday {
		return "Hari ini bukan hari sekolah"
	}
	if menitHari(now) >= jamPulangMenit {
		return "Presensi hari ini sudah ditutup"
	}
	return ""
}

func parseBulan(s string, now time.Time) (label, awal, akhir string, ok bool) {
	var first time.Time
	if strings.TrimSpace(s) == "" {
		first = time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, wib)
	} else {
		t, err := time.ParseInLocation("2006-01", s, wib)
		if err != nil {
			return "", "", "", false
		}
		first = t
	}
	next := first.AddDate(0, 1, 0)
	return first.Format("2006-01"), first.Format("2006-01-02"), next.Format("2006-01-02"), true
}
