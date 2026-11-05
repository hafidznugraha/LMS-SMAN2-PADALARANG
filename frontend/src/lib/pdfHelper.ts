/**
 * Helper pembuat berkas PDF binary murni (PDF-1.4) standar ISO untuk LMS SMAN 2 Padalarang.
 * Menjamin bahwa berkas unduhan di sisi klien selalu berupa format PDF valid yang dapat dibuka
 * di semua PDF viewer (Chrome, Adobe Acrobat, Edge), bukan plain text.
 */
export function generateClientMateriPDF(materi: {
  judul_materi: string;
  nama_kelas?: string;
  nama_mapel?: string;
  deskripsi?: string;
}): Uint8Array {
  const esc = (s: string) => (s || '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const judul = esc(materi.judul_materi || 'Materi Pembelajaran');
  const kelas = esc(materi.nama_kelas || 'XII IPA 1');
  const mapel = esc(materi.nama_mapel || 'Matematika Peminatan');
  const deskripsi = esc(materi.deskripsi || 'Bahan Ajar LMS SMAN 2 Padalarang');

  let stream = 'BT\n';
  stream += '/F1 18 Tf\n50 780 Td\n(SMA NEGERI 2 PADALARANG) Tj\n';
  stream += '/F2 10 Tf\n0 -16 Td\n(Sistem Informasi Pembelajaran Terpadu LMS - Bahan Ajar Digital) Tj\n';
  stream += '0 -20 Td\n(----------------------------------------------------------------------------------------------------) Tj\n';
  stream += `/F1 14 Tf\n0 -30 Td\n(Judul: ${judul}) Tj\n`;
  stream += `/F2 10 Tf\n0 -18 Td\n(Mata Pelajaran: ${mapel}   |   Target Rombel: ${kelas}) Tj\n`;
  stream += `0 -14 Td\n(Tenaga Pendidik: Irma Satikarama S.Pd   |   Status: Dokumen Resmi) Tj\n`;
  stream += '0 -20 Td\n(----------------------------------------------------------------------------------------------------) Tj\n';
  stream += '/F1 11 Tf\n0 -24 Td\n(Deskripsi & Petunjuk Belajar:) Tj\n';
  stream += `/F2 10 Tf\n0 -16 Td\n(${deskripsi.slice(0, 80)}) Tj\n`;
  stream += '0 -40 Td\n(Dokumen ini diunduh secara resmi melalui portal LMS SMA Negeri 2 Padalarang.) Tj\n';
  stream += 'ET\n';

  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(stream);
  const streamLen = streamBytes.length;

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const offsets: number[] = [0];

  const obj1 = '1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n';
  const obj2 = '2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n';
  const obj3 = '3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 595 842]\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n      /F2 5 0 R\n    >>\n  >>\n  /Contents 6 0 R\n>>\nendobj\n';
  const obj4 = '4 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica-Bold\n>>\nendobj\n';
  const obj5 = '5 0 obj\n<<\n  /Type /Font\n  /Subtype /Type1\n  /BaseFont /Helvetica\n>>\nendobj\n';
  const obj6Header = `6 0 obj\n<<\n  /Length ${streamLen}\n>>\nstream\n`;
  const obj6Footer = '\nendstream\nendobj\n';

  let currentLen = encoder.encode(header).length;
  offsets[1] = currentLen;
  currentLen += encoder.encode(obj1).length;
  offsets[2] = currentLen;
  currentLen += encoder.encode(obj2).length;
  offsets[3] = currentLen;
  currentLen += encoder.encode(obj3).length;
  offsets[4] = currentLen;
  currentLen += encoder.encode(obj4).length;
  offsets[5] = currentLen;
  currentLen += encoder.encode(obj5).length;
  offsets[6] = currentLen;
  currentLen += encoder.encode(obj6Header).length + streamBytes.length + encoder.encode(obj6Footer).length;

  const xrefOffset = currentLen;
  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  const trailer = `trailer\n<<\n  /Size 7\n  /Root 1 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullParts = [
    encoder.encode(header),
    encoder.encode(obj1),
    encoder.encode(obj2),
    encoder.encode(obj3),
    encoder.encode(obj4),
    encoder.encode(obj5),
    encoder.encode(obj6Header),
    streamBytes,
    encoder.encode(obj6Footer),
    encoder.encode(xref),
    encoder.encode(trailer),
  ];

  const totalLength = fullParts.reduce((acc, p) => acc + p.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const part of fullParts) {
    result.set(part, pos);
    pos += part.length;
  }
  return result;
}
