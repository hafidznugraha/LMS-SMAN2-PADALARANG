import { Materi } from '@/types/lms';

export function generateClientMateriPDF(materi: {
  judul_materi: string;
  nama_kelas?: string;
  nama_mapel?: string;
  deskripsi?: string;
}): Uint8Array {
  const esc = (s: string) =>
    (s || '')
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');

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

  const cleanLines = deskripsi.match(/.{1,80}/g) || [deskripsi];
  stream += '/F2 10 Tf\n';
  for (const line of cleanLines.slice(0, 15)) {
    stream += `0 -16 Td\n(${line}) Tj\n`;
  }

  stream += '0 -40 Td\n(Dokumen ini diunduh secara resmi melalui portal LMS SMA Negeri 2 Padalarang.) Tj\n';
  stream += 'ET\n';

  const encoder = new TextEncoder();
  const streamBytes = encoder.encode(stream);
  const streamLen = streamBytes.length;

  const header = '%PDF-1.4\n';
  const offsets: number[] = [0];

  const obj1 = '1 0 obj\n<<\n  /Type /Catalog\n  /Pages 2 0 R\n>>\nendobj\n';
  const obj2 = '2 0 obj\n<<\n  /Type /Pages\n  /Kids [3 0 R]\n  /Count 1\n>>\nendobj\n';
  const obj3 =
    '3 0 obj\n<<\n  /Type /Page\n  /Parent 2 0 R\n  /MediaBox [0 0 595 842]\n  /Resources <<\n    /Font <<\n      /F1 4 0 R\n      /F2 5 0 R\n    >>\n  >>\n  /Contents 6 0 R\n>>\nendobj\n';
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

export async function downloadMateriFile(materi: Materi): Promise<void> {
  if (materi.format_file === 'LINK' && materi.file_url && materi.file_url.startsWith('http')) {
    window.open(materi.file_url, '_blank', 'noopener,noreferrer');
    return;
  }

  const cleanTitle = (materi.judul_materi || 'Materi_Pembelajaran')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '_')
    .replace(/\s+/g, '_');

  const ext = (materi.format_file || 'PDF').toLowerCase();
  let filename = `${cleanTitle}.${ext === 'link' ? 'pdf' : ext}`;

  const triggerDownload = (blob: Blob, targetFilename: string) => {
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.setAttribute('download', targetFilename);
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  };

  if (
    materi.file_url &&
    (materi.file_url.includes('supabase.co/storage') ||
      (materi.file_url.startsWith('http') && !materi.file_url.includes('storage.sman2padalarang.sch.id')))
  ) {
    try {
      const directRes = await fetch(materi.file_url, { cache: 'no-store' });
      if (directRes.ok) {
        const arrayBuf = await directRes.arrayBuffer();
        if (arrayBuf && arrayBuf.byteLength > 0) {
          const contentType = directRes.headers.get('content-type') || 'application/pdf';
          const fileBlob = new Blob([arrayBuf], { type: contentType });
          triggerDownload(fileBlob, filename);
          return;
        }
      }
    } catch (directErr) {
      console.warn('Direct fetch dari Supabase Storage gagal, mencoba lewat backend proxy:', directErr);
    }
  }

  if (materi.id_materi) {
    try {
      const downloadEndpoints = [
        `/api/v1/materi/${encodeURIComponent(materi.id_materi)}/download`,
        `/api/v1/guru/materi/${encodeURIComponent(materi.id_materi)}/download`,
      ];

      for (const endpoint of downloadEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-store',
          });

          if (res.ok) {
            const contentDisposition = res.headers.get('content-disposition');
            if (contentDisposition) {
              const match = contentDisposition.match(/filename="?([^"]+)"?/i);
              if (match && match[1]) {
                filename = match[1];
              }
            }

            const arrayBuffer = await res.arrayBuffer();
            if (arrayBuffer && arrayBuffer.byteLength > 0) {
              const contentType = res.headers.get('content-type') || 'application/pdf';
              const fileBlob = new Blob([arrayBuffer], { type: contentType });
              triggerDownload(fileBlob, filename);
              return;
            }
          }
        } catch {
        }
      }
    } catch (err) {
      console.warn('Backend download endpoint error:', err);
    }
  }

  const pdfBytes = generateClientMateriPDF({
    judul_materi: materi.judul_materi,
    nama_kelas: materi.nama_kelas,
    nama_mapel: materi.nama_mapel,
    deskripsi: materi.deskripsi,
  });

  const fallbackBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  triggerDownload(fallbackBlob, `${cleanTitle}.pdf`);
}
