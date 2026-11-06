package handler

import (
	"archive/zip"
	"bytes"
	"encoding/xml"
	"fmt"
	"strings"
	"time"
)

// GenerateMateriPDF menghasilkan dokumen binary PDF 1.4 resmi dan valid untuk materi ajar
func GenerateMateriPDF(judul, mapel, kelas, deskripsi, guru string) []byte {
	esc := func(s string) string {
		s = strings.ReplaceAll(s, "\\", "\\\\")
		s = strings.ReplaceAll(s, "(", "\\(")
		s = strings.ReplaceAll(s, ")", "\\)")
		// Pastikan hanya karakter printable ASCII agar PDF Type1 Helvetica valid
		var clean strings.Builder
		for _, r := range s {
			if r >= 32 && r <= 126 {
				clean.WriteRune(r)
			} else {
				clean.WriteByte(' ')
			}
		}
		return clean.String()
	}

	tanggal := time.Now().Format("02 January 2006")
	if strings.TrimSpace(guru) == "" {
		guru = "Irma Satikarama S.Pd"
	}
	if strings.TrimSpace(kelas) == "" {
		kelas = "XII IPA 1"
	}
	if strings.TrimSpace(mapel) == "" {
		mapel = "Matematika Peminatan"
	}
	if strings.TrimSpace(judul) == "" {
		judul = "Materi Pembelajaran"
	}
	if strings.TrimSpace(deskripsi) == "" {
		deskripsi = "Bahan ajar resmi LMS SMA Negeri 2 Padalarang."
	}

	var streamBuf bytes.Buffer
	streamBuf.WriteString("BT\n")
	// Header Institusi
	streamBuf.WriteString("/F1 18 Tf\n")
	streamBuf.WriteString("50 780 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc("SMA NEGERI 2 PADALARANG")))
	streamBuf.WriteString("/F2 10 Tf\n")
	streamBuf.WriteString("0 -16 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc("Sistem Informasi Pembelajaran Terpadu (LMS) - Bahan Ajar Digital")))

	streamBuf.WriteString("0 -20 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc("----------------------------------------------------------------------------------------------------")))

	// Judul Materi
	streamBuf.WriteString("/F1 14 Tf\n")
	streamBuf.WriteString("0 -30 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(Judul: %s) Tj\n", esc(judul)))

	// Meta Informasi
	streamBuf.WriteString("/F2 10 Tf\n")
	streamBuf.WriteString("0 -18 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(Mata Pelajaran: %s   |   Target Rombel: %s) Tj\n", esc(mapel), esc(kelas)))
	streamBuf.WriteString("0 -14 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(Tenaga Pendidik: %s   |   Diterbitkan: %s) Tj\n", esc(guru), esc(tanggal)))

	streamBuf.WriteString("0 -20 Td\n")
	streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc("----------------------------------------------------------------------------------------------------")))

	// Deskripsi & Catatan
	streamBuf.WriteString("/F1 11 Tf\n")
	streamBuf.WriteString("0 -24 Td\n")
	streamBuf.WriteString("(Deskripsi & Petunjuk Belajar:) Tj\n")

	streamBuf.WriteString("/F2 10 Tf\n")
	lines := strings.Split(deskripsi, "\n")
	for _, l := range lines {
		l = strings.TrimSpace(l)
		if l == "" {
			l = " "
		}
		for len(l) > 80 {
			part := l[:80]
			streamBuf.WriteString("0 -14 Td\n")
			streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc(part)))
			l = l[80:]
		}
		streamBuf.WriteString("0 -14 Td\n")
		streamBuf.WriteString(fmt.Sprintf("(%s) Tj\n", esc(l)))
	}

	// Footer
	streamBuf.WriteString("/F2 9 Tf\n")
	streamBuf.WriteString("0 -40 Td\n")
	streamBuf.WriteString("(Dokumen ini diunduh secara resmi melalui portal LMS SMA Negeri 2 Padalarang.) Tj\n")
	streamBuf.WriteString("ET\n")

	streamBytes := streamBuf.Bytes()
	streamLen := len(streamBytes)

	var pdf bytes.Buffer
	pdf.WriteString("%PDF-1.4\n")

	offsets := make([]int, 7)

	offsets[1] = pdf.Len()
	pdf.WriteString("1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n")

	offsets[2] = pdf.Len()
	pdf.WriteString("2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n")

	offsets[3] = pdf.Len()
	pdf.WriteString("3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 595 842]\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n      /F2 5 0 R\n    >>\n  >>\n  /Contents 6 0 R\n>>\nendobj\n")

	offsets[4] = pdf.Len()
	pdf.WriteString("4 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica-Bold\n>>\nendobj\n")

	offsets[5] = pdf.Len()
	pdf.WriteString("5 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n>>\nendobj\n")

	offsets[6] = pdf.Len()
	pdf.WriteString(fmt.Sprintf("6 0 obj\n<<\n  /Length %d\n>>\nstream\n", streamLen))
	pdf.Write(streamBytes)
	pdf.WriteString("\nendstream\nendobj\n")

	xrefOffset := pdf.Len()
	pdf.WriteString("xref\n0 7\n")
	pdf.WriteString("0000000000 65535 f \n")
	for i := 1; i <= 6; i++ {
		pdf.WriteString(fmt.Sprintf("%010d 00000 n \n", offsets[i]))
	}

	pdf.WriteString(fmt.Sprintf("trailer\n<<\n  /Size 7\n  /Root 1 0 R\n>>\nstartxref\n%d\n%%%%EOF\n", xrefOffset))

	return pdf.Bytes()
}

// GenerateMateriDOCX menghasilkan berkas Word OpenXML (.docx) resmi & valid
func GenerateMateriDOCX(judul, mapel, kelas, deskripsi, guru string) []byte {
	escXML := func(s string) string {
		var buf bytes.Buffer
		_ = xml.EscapeText(&buf, []byte(s))
		return buf.String()
	}

	tanggal := time.Now().Format("02 January 2006")
	if strings.TrimSpace(guru) == "" {
		guru = "Irma Satikarama S.Pd"
	}
	if strings.TrimSpace(kelas) == "" {
		kelas = "XII IPA 1"
	}
	if strings.TrimSpace(mapel) == "" {
		mapel = "Matematika Peminatan"
	}
	if strings.TrimSpace(judul) == "" {
		judul = "Materi Pembelajaran"
	}
	if strings.TrimSpace(deskripsi) == "" {
		deskripsi = "Bahan ajar resmi LMS SMA Negeri 2 Padalarang."
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	addFile := func(name, content string) {
		f, err := zw.Create(name)
		if err == nil {
			_, _ = f.Write([]byte(content))
		}
	}

	addFile("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`)

	addFile("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`)

	addFile("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`)

	docXML := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>SMA NEGERI 2 PADALARANG</w:t></w:r></w:p>
    <w:p><w:r><w:t>Sistem Informasi Pembelajaran Terpadu (LMS) - Bahan Ajar Digital</w:t></w:r></w:p>
    <w:p><w:r><w:t>-------------------------------------------------------------------------</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>Judul Materi: %s</w:t></w:r></w:p>
    <w:p><w:r><w:t>Mata Pelajaran: %s | Kelas: %s</w:t></w:r></w:p>
    <w:p><w:r><w:t>Tenaga Pendidik: %s | Tanggal: %s</w:t></w:r></w:p>
    <w:p><w:r><w:t>-------------------------------------------------------------------------</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Deskripsi &amp; Petunjuk Belajar:</w:t></w:r></w:p>
    <w:p><w:r><w:t>%s</w:t></w:r></w:p>
    <w:p><w:r><w:t></w:t></w:r></w:p>
    <w:p><w:r><w:t>Dokumen ini diunduh secara resmi melalui portal LMS SMA Negeri 2 Padalarang.</w:t></w:r></w:p>
  </w:body>
</w:document>`,
		escXML(judul),
		escXML(mapel),
		escXML(kelas),
		escXML(guru),
		escXML(tanggal),
		escXML(deskripsi),
	)

	addFile("word/document.xml", docXML)
	_ = zw.Close()

	return buf.Bytes()
}
