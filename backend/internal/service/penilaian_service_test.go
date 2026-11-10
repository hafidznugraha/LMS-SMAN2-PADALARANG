package service

import (
	"testing"

	"github.com/hafidznugraha/lms-sman2-padalarang/backend/internal/model"
)

func TestHitungNilaiAkhirDanPredikat(t *testing.T) {
	cfg := model.KonfigurasiPenilaian{
		KKMDefault:     75.0,
		BobotTugas:     30.0,
		BobotUH:        20.0,
		BobotUTS:       25.0,
		BobotUAS:       25.0,
		BatasPredikatA: 85.0,
		BatasPredikatB: 75.0,
		BatasPredikatC: 65.0,
	}

	tests := []struct {
		name         string
		tugas        float64
		uh           float64
		uts          float64
		uas          float64
		wantNilai    float64
		wantPredikat string
	}{
		{
			name:         "Nilai Sempurna 100 -> A",
			tugas:        100,
			uh:           100,
			uts:          100,
			uas:          100,
			wantNilai:    100.0,
			wantPredikat: "A",
		},
		{
			name:         "Nilai 85.0 tepat pada batas A",
			tugas:        85,
			uh:           85,
			uts:          85,
			uas:          85,
			wantNilai:    85.0,
			wantPredikat: "A",
		},
		{
			name:         "Nilai 76.0 tuntas KKM -> B",
			tugas:        76,
			uh:           76,
			uts:          76,
			uas:          76,
			wantNilai:    76.0,
			wantPredikat: "B",
		},
		{
			name:         "Nilai 65.0 tepat pada batas C",
			tugas:        65,
			uh:           65,
			uts:          65,
			uas:          65,
			wantNilai:    65.0,
			wantPredikat: "C",
		},
		{
			name:         "Nilai 50.0 di bawah batas C -> D",
			tugas:        50,
			uh:           50,
			uts:          50,
			uas:          50,
			wantNilai:    50.0,
			wantPredikat: "D",
		},
		{
			name:         "Kasus Bobot Beragam: 100, 100, 80, 100 -> 95.0 Predikat A",
			tugas:        100,
			uh:           100,
			uts:          80,
			uas:          100,
			wantNilai:    95.0,
			wantPredikat: "A",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotNilai, gotPredikat := HitungNilaiDanPredikat(tt.tugas, tt.uh, tt.uts, tt.uas, cfg)
			if gotNilai != tt.wantNilai {
				t.Errorf("HitungNilaiDanPredikat() gotNilai = %v, want %v", gotNilai, tt.wantNilai)
			}
			if gotPredikat != tt.wantPredikat {
				t.Errorf("HitungNilaiDanPredikat() gotPredikat = %v, want %v", gotPredikat, tt.wantPredikat)
			}
		})
	}
}

func TestCustomKurikulumKonfigurasi(t *testing.T) {
	customCfg := model.KonfigurasiPenilaian{
		KKMDefault:     80.0,
		BobotTugas:     40.0,
		BobotUH:        20.0,
		BobotUTS:       20.0,
		BobotUAS:       20.0,
		BatasPredikatA: 90.0,
		BatasPredikatB: 80.0,
		BatasPredikatC: 70.0,
	}

	if err := ValidasiKonfigurasiPenilaian(customCfg); err != nil {
		t.Fatalf("Validasi konfigurasi gagal: %v", err)
	}

	predikat := TentukanPredikat(85.0, customCfg)
	if predikat != "B" {
		t.Errorf("Dengan batas A=90, nilai 85 harusnya B, got: %s", predikat)
	}
}

func TestValidasiKonfigurasiPenilaian(t *testing.T) {
	invalidBobot := model.KonfigurasiPenilaian{
		BobotTugas:     30,
		BobotUH:        20,
		BobotUTS:       20,
		BobotUAS:       20,
		BatasPredikatA: 85,
		BatasPredikatB: 75,
		BatasPredikatC: 65,
	}
	if err := ValidasiKonfigurasiPenilaian(invalidBobot); err == nil {
		t.Error("Harus error bila total bobot != 100%")
	}

	invalidBatas := model.KonfigurasiPenilaian{
		BobotTugas:     30,
		BobotUH:        20,
		BobotUTS:       25,
		BobotUAS:       25,
		BatasPredikatA: 70,
		BatasPredikatB: 75,
		BatasPredikatC: 65,
	}
	if err := ValidasiKonfigurasiPenilaian(invalidBatas); err == nil {
		t.Error("Harus error bila batas A <= B")
	}
}
