package handler

import (
	"strings"
	"testing"
)

func TestIsFileExtensionAllowed(t *testing.T) {
	tests := []struct {
		name       string
		filename   string
		formatSpec string
		wantOk     bool
	}{
		// Kasus 1: Guru hanya memilih PDF
		{"PDF valid lowercase", "jawaban.pdf", "pdf", true},
		{"PDF valid uppercase", "JAWABAN.PDF", "pdf", true},
		{"PDF tolak DOCX", "jawaban.docx", "pdf", false},
		{"PDF tolak PNG", "foto.png", "pdf", false},
		{"PDF tolak ZIP", "arsip.zip", "pdf", false},

		// Kasus 2: Guru memilih PDF dan DOCX
		{"PDF dan DOCX - kirim PDF", "jawaban.pdf", "pdf, docx", true},
		{"PDF dan DOCX - kirim DOCX", "jawaban.docx", "pdf, docx", true},
		{"PDF dan DOCX - kirim DOC", "jawaban.doc", "pdf, docx", true},
		{"PDF dan DOCX - tolak XLSX", "tabel.xlsx", "pdf, docx", false},
		{"PDF dan DOCX - tolak JPG", "gambar.jpg", "pdf, docx", false},

		// Kasus 3: Guru memilih Gambar / Foto
		{"Gambar - kirim JPG", "tugas.jpg", "gambar", true},
		{"Gambar - kirim PNG", "tugas.png", "gambar", true},
		{"Gambar - kirim WEBP", "tugas.webp", "gambar", true},
		{"Gambar - tolak PDF", "tugas.pdf", "gambar", false},

		// Kasus 4: Format ekstensi langsung dari checkbox (misal: "jpg, jpeg, png")
		{"Multi ekstensi langsung - kirim JPG", "tugas.jpg", "jpg, jpeg, png", true},
		{"Multi ekstensi langsung - kirim PNG", "tugas.png", "jpg, jpeg, png", true},
		{"Multi ekstensi langsung - tolak DOCX", "tugas.docx", "jpg, jpeg, png", false},

		// Kasus 5: Guru memilih Arsip ZIP/RAR
		{"Arsip - kirim ZIP", "proyek.zip", "zip, rar", true},
		{"Arsip - kirim RAR", "proyek.rar", "zip, rar", true},
		{"Arsip - tolak EXE", "program.exe", "zip, rar", false},

		// Kasus 6: Format kosong atau semua
		{"Format kosong mengizinkan berkas biasa", "laporan.pdf", "", true},
		{"Format 'semua' mengizinkan berkas biasa", "laporan.docx", "semua format", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotOk, gotMsg := isFileExtensionAllowed(tt.filename, tt.formatSpec)
			if gotOk != tt.wantOk {
				t.Errorf("isFileExtensionAllowed(%q, %q) = %v; want %v (msg: %s)",
					tt.filename, tt.formatSpec, gotOk, tt.wantOk, gotMsg)
			}
			if !gotOk && !strings.Contains(gotMsg, "tidak diizinkan") {
				t.Errorf("Pesan error harus informatif, didapat: %s", gotMsg)
			}
		})
	}
}
