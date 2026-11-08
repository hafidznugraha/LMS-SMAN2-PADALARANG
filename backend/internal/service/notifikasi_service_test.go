package service

import (
	"testing"
	"time"
)

func TestFormatDeadlineIndo(t *testing.T) {
	svc := GetNotifikasiService()

	targetDate := time.Date(2026, time.November, 15, 23, 59, 0, 0, time.UTC)
	formatted := svc.FormatDeadlineIndo(targetDate)
	expected := "15 November 2026, 23:59 WIB"

	if formatted != expected {
		t.Errorf("FormatDeadlineIndo salah. Diharapkan: '%s', Didapat: '%s'", expected, formatted)
	}

	dateMei := time.Date(2026, time.May, 2, 8, 30, 0, 0, time.UTC)
	formattedMei := svc.FormatDeadlineIndo(dateMei)
	expectedMei := "02 Mei 2026, 08:30 WIB"

	if formattedMei != expectedMei {
		t.Errorf("FormatDeadlineIndo bulan Mei salah. Diharapkan: '%s', Didapat: '%s'", expectedMei, formattedMei)
	}
}
