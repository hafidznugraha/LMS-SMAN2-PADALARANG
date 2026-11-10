"use client";

import React, { useRef } from "react";
import jsPDF from "jspdf";
import ExcelJS from "exceljs";
import Image from "next/image";
import {
  Printer,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  Award,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SiswaInfo {
  id: string;
  nis: string;
  nisn: string;
  nama_lengkap: string;
  jenis_kelamin: string;
}

export interface PresensiItem {
  no: number;
  nisn: string;
  nis: string;
  nama: string;
  rombel: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  terlambat: number;
  total: number;
  persentase: string;
}

export interface LaporanItem {
  id_laporan?: string;
  nama: string;
  nis: string;
  nisn: string;
  nilai_pengetahuan: number | null;
  nilai_keterampilan: number | null;
  rata_rata: number | null;
  catatan_wali: string;
  status_laporan: string;
}

export interface RekapRombelModalProps {
  isOpen: boolean;
  onClose: () => void;
  namaKelas: string;
  jurusan: string;
  tingkat: number;
  teacherName: string;
  teacherNip?: string;
  semester?: string;
  tahunAjaran?: string;
  siswaList: SiswaInfo[];
  presensiList: PresensiItem[];
  laporanList: LaporanItem[];
  progresNilai: {
  total_mapel: number;
  mapel_lengkap: number;
  persentase: number;
};
}

export function RekapRombelModal({
  isOpen,
  onClose,
  namaKelas,
  jurusan,
  tingkat,
  teacherName,
  teacherNip = "1234292722091345",
  semester = "Semester Ganjil",
  tahunAjaran = "2026/2027",
  siswaList,
  presensiList,
  laporanList,
  progresNilai,
}: RekapRombelModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalSiswa = siswaList.length || presensiList.length || 3;
  const countLaki = siswaList.filter((s) => s.jenis_kelamin?.toLowerCase() === "laki-laki").length;
  const countPerempuan = siswaList.filter((s) => s.jenis_kelamin?.toLowerCase() === "perempuan").length;

  const siswaPerhatianKhusus = presensiList
    .map((p) => {
      const lap = laporanList.find((l) => l.nis === p.nis || l.nisn === p.nisn);
      const persenNum = parseFloat(p.persentase?.replace("%", "") || "100");
      const nilaiRata = lap?.rata_rata ?? null;

      const alasan: string[] = [];
      if (p.alpa > 0) alasan.push(`Tercatat ${p.alpa} kali alpa/tanpa keterangan`);
      if (persenNum < 80) alasan.push(`Persentase kehadiran di bawah 80% (${p.persentase})`);
      if (nilaiRata !== null && nilaiRata > 0 && nilaiRata < 75) alasan.push(`Rata-rata nilai ${nilaiRata} (di bawah KKM 75)`);
      if (p.terlambat > 1) alasan.push(`Sering terlambat (${p.terlambat} kali)`);

      return {
        nama: p.nama,
        nis: p.nis,
        nisn: p.nisn,
        alasan,
      };
    })
    .filter((s) => s.alasan.length > 0);

  const catatanTerisi = laporanList.filter(
    (l) => l.catatan_wali && l.catatan_wali.trim() !== ""
  ).length;
  const raporDisahkan = laporanList.filter(
    (l) => l.status_laporan === "DisahkanKurikulum"
  ).length;

const handlePrint = async () => {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const W = pdf.internal.pageSize.getWidth();
    const H = pdf.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = W - margin * 2;
    const bottomLimit = H - 18;

    const warna = {
      navy: [30, 58, 138] as const,
      dark: [15, 23, 42] as const,
      gray: [100, 116, 139] as const,
      light: [238, 242, 247] as const,
      border: [203, 213, 225] as const,
      white: [255, 255, 255] as const,
      green: [22, 101, 52] as const,
      amber: [146, 64, 14] as const,
    };

    const tanggal = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    let y = 16;

    const textColor = (color: readonly number[]) => {
      pdf.setTextColor(color[0], color[1], color[2]);
    };

    const fillColor = (color: readonly number[]) => {
      pdf.setFillColor(color[0], color[1], color[2]);
    };

    const newPage = () => {
      pdf.addPage();
      y = 17;
    };

    const ensureSpace = (required: number) => {
      if (y + required > bottomLimit) {
        newPage();
      }
    };

    const writeText = (
      value: string,
      x: number,
      positionY: number,
      size = 9,
      bold = false
    ) => {
      pdf.setFont("helvetica", bold ? "bold" : "normal");
      pdf.setFontSize(size);
      textColor(warna.dark);
      pdf.text(String(value), x, positionY);
    };

    try {
      const image = new window.Image();
      image.src = "/logo-sman2.png";

      await new Promise<void>((resolve, reject) => {
        if (image.complete && image.naturalWidth > 0) {
          resolve();
          return;
        }

        image.onload = () => resolve();
        image.onerror = () => reject(
          new Error("Logo sekolah tidak dapat dimuat")
        );
      });

      const logoCanvas = document.createElement("canvas");
      logoCanvas.width = 300;
      logoCanvas.height = 300;

      const ctx = logoCanvas.getContext("2d");

      if (ctx) {
        const ratio = Math.min(
          300 / image.naturalWidth,
          300 / image.naturalHeight
        );

        const width = image.naturalWidth * ratio;
        const height = image.naturalHeight * ratio;

        ctx.clearRect(0, 0, 300, 300);

        ctx.drawImage(
          image,
          (300 - width) / 2,
          (300 - height) / 2,
          width,
          height
        );

        pdf.addImage(
          logoCanvas.toDataURL("image/png"),
          "PNG",
          17,
          13,
          23,
          23
        );
      }
    } catch (error) {
      console.warn("Logo tidak dapat dimasukkan:", error);
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    textColor(warna.dark);

    pdf.text(
      "PEMERINTAH DAERAH PROVINSI JAWA BARAT",
      119,
      17,
      { align: "center" }
    );

    pdf.text(
      "DINAS PENDIDIKAN",
      119,
      22,
      { align: "center" }
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    textColor(warna.navy);

    pdf.text(
      "SMA NEGERI 2 PADALARANG",
      119,
      30,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    textColor(warna.gray);

    pdf.text(
      "Jl. Cihaliwung No. 2, Kertamulya,",
      119,
      35,
      { align: "center" }
    );

    pdf.text(
      "Kec. Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553",
      119,
      39,
      { align: "center" }
    );

    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.65);
    pdf.line(margin, 44, W - margin, 44);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    textColor(warna.navy);

    pdf.text(
      "LAPORAN REKAPITULASI PEMBINAAN KELAS (ROMBEL)",
      W / 2,
      52,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    textColor(warna.gray);

    pdf.text(
      `${namaKelas} | ${semester} | Tahun Ajaran ${tahunAjaran}`,
      W / 2,
      58,
      { align: "center" }
    );

    y = 66;

    const addSection = (title: string) => {
      ensureSpace(20);

      fillColor(warna.light);
      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        8,
        1.5,
        1.5,
        "F"
      );

      fillColor(warna.navy);
      pdf.rect(margin, y, 1.2, 8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      textColor(warna.navy);

      pdf.text(title, margin + 4, y + 5.3);

      y += 12;
    };

    type Column = {
      title: string;
      width: number;
      align?: "left" | "center" | "right";
    };

    type TableValue = string | number | null | undefined;

    const addTable = (
      columns: Column[],
      rows: TableValue[][]
    ) => {
      const headerHeight = 11;

      const drawHeader = () => {
        ensureSpace(headerHeight + 9);

        fillColor(warna.navy);
        pdf.rect(
          margin,
          y,
          contentWidth,
          headerHeight,
          "F"
        );

        let x = margin;

        columns.forEach((col) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(7.2);
          textColor(warna.white);

          const lines = pdf.splitTextToSize(
            col.title,
            col.width - 4
          );

          pdf.text(
            lines,
            x + col.width / 2,
            y + 4.2,
            { align: "center" }
          );

          x += col.width;
        });

        y += headerHeight;
      };

      drawHeader();

      if (rows.length === 0) {
        rows = [
          [
            "Belum ada data",
            ...Array(columns.length - 1).fill("-"),
          ],
        ];
      }

      rows.forEach((row, rowIndex) => {
        const wrapped = columns.map((col, index) => {
          const value = String(row[index] ?? "-");

          return pdf.splitTextToSize(
            value,
            col.width - 4
          ) as string[];
        });

        const maxLines = Math.max(
          1,
          ...wrapped.map((lines) => lines.length)
        );

        const rowHeight = Math.max(
          9,
          maxLines * 4 + 4
        );

        if (y + rowHeight > bottomLimit) {
          newPage();
          drawHeader();
        }

        fillColor(
          rowIndex % 2 === 0
            ? warna.white
            : [248, 250, 252]
        );

        pdf.rect(
          margin,
          y,
          contentWidth,
          rowHeight,
          "F"
        );

        pdf.setDrawColor(...warna.border);
        pdf.setLineWidth(0.15);

        let x = margin;

        columns.forEach((col, index) => {
          pdf.rect(
            x,
            y,
            col.width,
            rowHeight
          );

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(7.5);
          textColor(warna.dark);

          const align = col.align ?? "left";

          const textX =
            align === "center"
              ? x + col.width / 2
              : align === "right"
                ? x + col.width - 2
                : x + 2;

          pdf.text(
            wrapped[index],
            textX,
            y + 4.8,
            { align }
          );

          x += col.width;
        });

        y += rowHeight;
      });

      y += 3;
    };

    addSection("I. IDENTITAS KELAS & WALI KELAS");

    const identities: [string, string][] = [
      [
        "Rombongan Belajar",
        `${namaKelas} (Tingkat ${tingkat} - ${jurusan})`,
      ],
      ["Nama Wali Kelas", teacherName],
      ["NIP Wali Kelas", String(teacherNip || "-")],
      ["Semester", semester],
      ["Tahun Ajaran", tahunAjaran],
      ["Tanggal Laporan", tanggal],
    ];

    identities.forEach(([label, value]) => {
      ensureSpace(6);

      writeText(label + ":", margin + 2, y + 3, 8, true);
      writeText(value, margin + 54, y + 3, 8);

      y += 6;
    });

    y += 3;

    addSection("II. JUMLAH SISWA TERDAFTAR");

    writeText(
      `Total ${totalSiswa} siswa (${countLaki} laki-laki, ${countPerempuan} perempuan)`,
      margin + 2,
      y + 2,
      8,
      true
    );

    y += 6;

    addTable(
      [
        { title: "No", width: 10, align: "center" },
        { title: "NIS", width: 24 },
        { title: "NISN", width: 27 },
        { title: "Nama Lengkap Siswa", width: 60 },
        { title: "Jenis Kelamin", width: 40 },
        { title: "Status", width: 21, align: "center" },
      ],
      siswaList.map((s, i) => [
        i + 1,
        s.nis || "-",
        s.nisn || "-",
        s.nama_lengkap,
        s.jenis_kelamin || "-",
        "Aktif",
      ])
    );

    addSection("III. REKAPITULASI KEHADIRAN SISWA");

    addTable(
      [
        { title: "No", width: 10, align: "center" },
        { title: "Nama Siswa", width: 50 },
        { title: "Hadir", width: 17, align: "center" },
        { title: "Sakit", width: 17, align: "center" },
        { title: "Izin", width: 17, align: "center" },
        { title: "Alpa", width: 17, align: "center" },
        { title: "Terlambat", width: 20, align: "center" },
        { title: "Kehadiran", width: 34, align: "center" },
      ],
      presensiList.map((p, i) => [
        i + 1,
        p.nama,
        p.hadir,
        p.sakit,
        p.izin,
        p.alpa,
        p.terlambat,
        p.persentase,
      ])
    );

    addSection(
      "IV. RINGKASAN PERKEMBANGAN NILAI MATA PELAJARAN"
    );

    writeText(
      `Progres: ${progresNilai.mapel_lengkap} dari ${progresNilai.total_mapel} mata pelajaran lengkap`,
      margin + 2,
      y + 2,
      8,
      true
    );

    y += 6;

    addTable(
      [
        { title: "No", width: 10, align: "center" },
        { title: "Nama Siswa", width: 49 },
        { title: "Pengetahuan", width: 28, align: "center" },
        { title: "Keterampilan", width: 29, align: "center" },
        { title: "Rata-rata", width: 23, align: "center" },
        { title: "Status Rapor", width: 43, align: "center" },
      ],
      laporanList.map((l, i) => {
        const status =
          l.status_laporan === "DisahkanKurikulum"
            ? "Disahkan Kurikulum"
            : l.status_laporan === "DitinjauWali"
              ? "Ditinjau Wali Kelas"
              : l.status_laporan === "Draf"
                ? "Draf"
                : l.status_laporan || "Belum Ada Status";

        return [
          i + 1,
          l.nama,
          l.nilai_pengetahuan ?? "-",
          l.nilai_keterampilan ?? "-",
          l.rata_rata ?? "-",
          status,
        ];
      })
    );

    addSection(
      "V. DAFTAR SISWA YANG MEMBUTUHKAN PERHATIAN KHUSUS"
    );

    if (siswaPerhatianKhusus.length === 0) {
      ensureSpace(12);

      fillColor([220, 252, 231]);
      pdf.roundedRect(
        margin,
        y,
        contentWidth,
        10,
        1.5,
        1.5,
        "F"
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      textColor(warna.green);

      pdf.text(
        "Tidak ada siswa yang membutuhkan perhatian khusus.",
        margin + 4,
        y + 6
      );

      y += 14;
    } else {
      addTable(
        [
          { title: "No", width: 10, align: "center" },
          { title: "Nama Siswa", width: 45 },
          { title: "NIS", width: 25 },
          { title: "Catatan / Alasan", width: 102 },
        ],
        siswaPerhatianKhusus.map((s, i) => [
          i + 1,
          s.nama,
          s.nis,
          s.alasan.join("; "),
        ])
      );
    }

    ensureSpace(91);

    addSection("VI. STATUS PENYELESAIAN RAPOR");

    const statusRows: [string, string][] = [
      [
        "Pengisian Catatan Wali Kelas",
        `${catatanTerisi} dari ${totalSiswa} siswa (${Math.round(
          (catatanTerisi / (totalSiswa || 1)) * 100
        )}%)`,
      ],
      [
        "Pengesahan oleh Kurikulum",
        `${raporDisahkan} dari ${totalSiswa} rapor disahkan`,
      ],
    ];

    statusRows.forEach(([label, value]) => {
      writeText(
        label + ":",
        margin + 2,
        y + 3,
        8,
        true
      );

      writeText(
        value,
        margin + 70,
        y + 3,
        8
      );

      y += 7;
    });

    y += 12;

    const kiri = margin + 45;
    const kanan = W - margin - 45;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    textColor(warna.dark);

    pdf.text(
      "Mengetahui,",
      kiri,
      y,
      { align: "center" }
    );

    pdf.text(
      "Kepala SMA Negeri 2 Padalarang",
      kiri,
      y + 5,
      { align: "center" }
    );

    pdf.text(
      `Padalarang, ${tanggal}`,
      kanan,
      y,
      { align: "center" }
    );

    pdf.text(
      `Wali Kelas ${namaKelas}`,
      kanan,
      y + 5,
      { align: "center" }
    );

    y += 29;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    pdf.text(
      "Drs. Herman Wijaya, M.M",
      kiri,
      y,
      { align: "center" }
    );

    pdf.text(
      teacherName,
      kanan,
      y,
      { align: "center" }
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    textColor(warna.gray);

    pdf.text(
      "NIP. 196804121995011002",
      kiri,
      y + 5,
      { align: "center" }
    );

    pdf.text(
      `NIP. ${teacherNip || "-"}`,
      kanan,
      y + 5,
      { align: "center" }
    );

    const totalPages = pdf.getNumberOfPages();

    for (let page = 1; page <= totalPages; page++) {
      pdf.setPage(page);

      pdf.setDrawColor(...warna.border);
      pdf.setLineWidth(0.2);
      pdf.line(
        margin,
        H - 14,
        W - margin,
        H - 14
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      textColor(warna.gray);

      pdf.text(
        `Rekap Rombel ${namaKelas} | ${tahunAjaran}`,
        margin,
        H - 10
      );

      pdf.text(
        `Halaman ${page} dari ${totalPages}`,
        W - margin,
        H - 10,
        { align: "right" }
      );
    }

    pdf.save(
      `Rekap_Rombel_${namaKelas.replace(/\s+/g, "_")}.pdf`
    );

  } catch (error) {
    console.error("Gagal membuat PDF:", error);
    alert("Gagal membuat PDF. Silakan coba lagi.");
  }
};

  const handleCetak = () => {
    window.print();
  };

  const handleDownloadExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "LMS SMAN 2 Padalarang";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Rekap Rombel", {
        pageSetup: {
          paperSize: 9,
          orientation: "landscape",
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
        views: [{ state: "normal", showGridLines: false }],
      });

      const C = {
        navy: "FF1E3A8A",
        dark: "FF0F172A",
        light: "FFEAF0FA",
        white: "FFFFFFFF",
        gray: "FFF8FAFC",
        border: "FFCBD5E1",
        green: "FFDCFCE7",
        greenText: "FF166534",
        amber: "FFFEF3C7",
        amberText: "FF92400E",
      };

      sheet.columns = [
        { width: 9 },  
        { width: 26 }, 
        { width: 20 }, 
        { width: 24 }, 
        { width: 20 }, 
        { width: 19 }, 
        { width: 19 }, 
        { width: 38 }, 
      ];

      sheet.pageSetup.margins = {
        left: 0.3,
        right: 0.3,
        top: 0.45,
        bottom: 0.45,
        header: 0.2,
        footer: 0.2,
      };

      sheet.headerFooter.oddFooter =
        "LMS SMAN 2 Padalarang - Rekap Rombel | Halaman &P dari &N";

      const tanggalCetak = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      type Span = [number, number];
      type NilaiSel = string | number;

      const garis: Partial<ExcelJS.Borders> = {
        top: { style: "thin", color: { argb: C.border } },
        bottom: { style: "thin", color: { argb: C.border } },
        left: { style: "thin", color: { argb: C.border } },
        right: { style: "thin", color: { argb: C.border } },
      };

      const gabung = (
        nomorBaris: number,
        awal: number,
        akhir: number,
        nilai: NilaiSel
      ) => {
        if (akhir > awal) {
          sheet.mergeCells(nomorBaris, awal, nomorBaris, akhir);
        }

        const cell = sheet.getRow(nomorBaris).getCell(awal);
        cell.value = nilai;
        return cell;
      };

      const warnaiBaris = (
        nomorBaris: number,
        warna: string
      ) => {
        for (let kolom = 1; kolom <= 8; kolom++) {
          const cell = sheet.getRow(nomorBaris).getCell(kolom);

          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: warna },
          };

          cell.border = garis;
        }
      };

      const tambahBagian = (judul: string) => {
        sheet.addRow([]);

        const row = sheet.addRow([]);
        row.height = 29;

        warnaiBaris(row.number, C.light);

        const cell = gabung(row.number, 1, 8, judul);

        cell.font = {
          name: "Calibri",
          size: 12,
          bold: true,
          color: { argb: C.navy },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: "left",
          indent: 1,
        };

        return row;
      };

      const tambahTabel = (
        headers: string[],
        spans: Span[],
        data: NilaiSel[][],
        kolomTeks: number[] = [],
        kolomSorotan?: number
      ) => {
        const headerRow = sheet.addRow([]);
        headerRow.height = 39;

        warnaiBaris(headerRow.number, C.navy);

        spans.forEach(([awal, akhir], index) => {
          const cell = gabung(
            headerRow.number,
            awal,
            akhir,
            headers[index]
          );

          cell.font = {
            name: "Calibri",
            size: 10,
            bold: true,
            color: { argb: C.white },
          };

          cell.alignment = {
            horizontal: "center",
            vertical: "middle",
            wrapText: true,
          };
        });

        data.forEach((record, index) => {
          const row = sheet.addRow([]);
          row.height = 34;

          const warna =
            index % 2 === 0 ? C.white : C.gray;

          warnaiBaris(row.number, warna);

          spans.forEach(([awal, akhir], kolom) => {
            const nilai = record[kolom] ?? "-";

            const cell = gabung(
              row.number,
              awal,
              akhir,
              nilai
            );

            cell.font = {
              name: "Calibri",
              size: 10,
              color: { argb: C.dark },
              bold: kolom === kolomSorotan,
            };

            cell.alignment = {
              vertical: "middle",
              horizontal:
                kolom === 0
                  ? "center"
                  : typeof nilai === "number"
                    ? "center"
                    : "left",
              wrapText: true,
            };

            if (kolomTeks.includes(kolom)) {
              cell.value = String(nilai);
              cell.numFmt = "@";
            }
          });
        });

        return headerRow;
      };

      sheet.mergeCells("A1:H2");

      const namaSekolah = sheet.getCell("A1");
      namaSekolah.value = "SMA NEGERI 2 PADALARANG";
      namaSekolah.font = {
        name: "Calibri",
        size: 20,
        bold: true,
        color: { argb: C.navy },
      };
      namaSekolah.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(1).height = 27;
      sheet.getRow(2).height = 27;

      sheet.mergeCells("A3:H3");
      const alamat = sheet.getCell("A3");

      alamat.value =
        "Jl. Cihaliwung No. 2, Kertamulya, Kec. Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553";

      alamat.font = {
        name: "Calibri",
        size: 10,
        color: { argb: C.dark },
      };

      alamat.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(3).height = 23;

      sheet.mergeCells("A5:H5");

      const judul = sheet.getCell("A5");
      judul.value =
        "LAPORAN REKAPITULASI PEMBINAAN KELAS (ROMBEL)";

      judul.font = {
        name: "Calibri",
        size: 15,
        bold: true,
        color: { argb: C.navy },
      };

      judul.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(5).height = 30;

      sheet.mergeCells("A6:H6");

      const subjudul = sheet.getCell("A6");
      subjudul.value =
        `Kelas ${namaKelas} | Semester ${semester} | Tahun Ajaran ${tahunAjaran}`;

      subjudul.font = {
        name: "Calibri",
        size: 11,
        color: { argb: C.dark },
      };

      subjudul.alignment = {
        horizontal: "center",
        vertical: "middle",
      };

      sheet.getRow(6).height = 25;

      tambahBagian("I. IDENTITAS KELAS & WALI KELAS");

      const identitas: [string, string][] = [
        ["Rombongan Belajar", namaKelas],
        ["Tingkat / Jurusan", `${tingkat} / ${jurusan}`],
        ["Nama Wali Kelas", teacherName],
        ["NIP Wali Kelas", String(teacherNip || "-")],
        ["Semester", semester],
        ["Tahun Ajaran", tahunAjaran],
        ["Tanggal Laporan", tanggalCetak],
      ];

      identitas.forEach(([label, nilai]) => {
        const row = sheet.addRow([]);
        row.height = 27;

        warnaiBaris(row.number, C.white);

        const labelCell = gabung(
          row.number,
          1,
          2,
          label
        );

        labelCell.font = {
          name: "Calibri",
          size: 10,
          bold: true,
          color: { argb: C.dark },
        };

        labelCell.alignment = {
          vertical: "middle",
          indent: 1,
        };

        const valueCell = gabung(
          row.number,
          3,
          8,
          nilai
        );

        valueCell.font = {
          name: "Calibri",
          size: 10,
          color: { argb: C.dark },
        };

        valueCell.numFmt = "@";

        valueCell.alignment = {
          vertical: "middle",
          indent: 1,
          wrapText: true,
        };
      });

      tambahBagian("II. JUMLAH SISWA TERDAFTAR");

      const ringkasan = sheet.addRow([]);
      ringkasan.height = 27;

      const info = gabung(
        ringkasan.number,
        1,
        8,
        `Total ${totalSiswa} siswa | ${countLaki} laki-laki | ${countPerempuan} perempuan`
      );

      info.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: C.navy },
      };

      info.alignment = {
        vertical: "middle",
      };

      tambahTabel(
        [
          "No",
          "NIS",
          "NISN",
          "Nama Lengkap Peserta Didik",
          "Jenis Kelamin",
          "Status",
        ],
        [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 5],
          [6, 7],
          [8, 8],
        ],
        siswaList.map((s, index) => [
          index + 1,
          String(s.nis || "-"),
          String(s.nisn || "-"),
          s.nama_lengkap,
          s.jenis_kelamin || "-",
          "Aktif",
        ]),
        [1, 2],
        3
      );

      tambahBagian("III. REKAPITULASI KEHADIRAN SISWA");

      tambahTabel(
        [
          "No",
          "Nama Peserta Didik",
          "Hadir",
          "Sakit",
          "Izin",
          "Alpa",
          "Terlambat",
          "Persentase Kehadiran",
        ],
        [
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [5, 5],
          [6, 6],
          [7, 7],
          [8, 8],
        ],
        presensiList.map((p, index) => [
          index + 1,
          p.nama,
          p.hadir,
          p.sakit,
          p.izin,
          p.alpa,
          p.terlambat,
          p.persentase,
        ]),
        [],
        7
      );

      tambahBagian(
        "IV. RINGKASAN PERKEMBANGAN NILAI MATA PELAJARAN"
      );

      tambahTabel(
        [
          "No",
          "Nama Siswa",
          "Nilai Pengetahuan",
          "Nilai Keterampilan",
          "Rata-rata Akhir",
          "Status Rapor",
        ],
        [
          [1, 1],
          [2, 3],
          [4, 4],
          [5, 5],
          [6, 6],
          [7, 8],
        ],
        laporanList.map((l, index) => [
          index + 1,
          l.nama,
          l.nilai_pengetahuan ?? "-",
          l.nilai_keterampilan ?? "-",
          l.rata_rata ?? "-",
          l.status_laporan || "Draf",
        ]),
        [],
        4
      );

      tambahBagian(
        "V. DAFTAR SISWA YANG MEMBUTUHKAN PERHATIAN KHUSUS"
      );

      if (siswaPerhatianKhusus.length === 0) {
        const row = sheet.addRow([]);
        row.height = 30;

        warnaiBaris(row.number, C.green);

        const cell = gabung(
          row.number,
          1,
          8,
          "Tidak ada siswa yang membutuhkan perhatian khusus."
        );

        cell.font = {
          name: "Calibri",
          bold: true,
          size: 10,
          color: { argb: C.greenText },
        };

        cell.alignment = {
          vertical: "middle",
          indent: 1,
        };
      } else {
        const headerPerhatian = tambahTabel(
          [
            "No",
            "Nama Siswa",
            "NIS",
            "Catatan / Alasan Perhatian Khusus",
          ],
          [
            [1, 1],
            [2, 3],
            [4, 4],
            [5, 8],
          ],
          siswaPerhatianKhusus.map((s, index) => [
            index + 1,
            s.nama,
            String(s.nis),
            s.alasan.join("; "),
          ]),
          [2],
          1
        );

        for (
          let baris = headerPerhatian.number + 1;
          baris <= headerPerhatian.number + siswaPerhatianKhusus.length;
          baris++
        ) {
          sheet.getRow(baris).height = 55;

          const cell = sheet.getRow(baris).getCell(5);
          cell.alignment = {
            vertical: "middle",
            wrapText: true,
            indent: 1,
          };
        }
      }

      tambahBagian("VI. STATUS PENYELESAIAN RAPOR");

      const status: [string, string][] = [
        [
          "Pengisian Catatan Wali Kelas",
          `${catatanTerisi} dari ${totalSiswa} siswa telah diisi`,
        ],
        [
          "Pengesahan Kurikulum",
          `${raporDisahkan} dari ${totalSiswa} rapor telah disahkan`,
        ],
      ];

      status.forEach(([label, nilai]) => {
        const row = sheet.addRow([]);
        row.height = 29;

        warnaiBaris(row.number, C.white);

        const labelCell = gabung(
          row.number,
          1,
          3,
          label
        );

        labelCell.font = {
          name: "Calibri",
          size: 10,
          bold: true,
          color: { argb: C.dark },
        };

        labelCell.alignment = {
          vertical: "middle",
          indent: 1,
        };

        const valueCell = gabung(
          row.number,
          4,
          8,
          nilai
        );

        valueCell.font = {
          name: "Calibri",
          size: 10,
          color: { argb: C.dark },
        };

        valueCell.alignment = {
          vertical: "middle",
          indent: 1,
        };
      });

      sheet.addRow([]);
      sheet.addRow([]);

      const awalTTD = sheet.rowCount + 1;

      sheet.mergeCells(
        awalTTD,
        1,
        awalTTD,
        4
      );

      sheet.mergeCells(
        awalTTD,
        5,
        awalTTD,
        8
      );

      const kepala = sheet.getCell(awalTTD, 1);
      kepala.value =
        "Mengetahui,\nKepala SMA Negeri 2 Padalarang";

      const wali = sheet.getCell(awalTTD, 5);
      wali.value =
        `Padalarang, ${tanggalCetak}\nWali Kelas ${namaKelas}`;

      [kepala, wali].forEach((cell) => {
        cell.font = {
          name: "Calibri",
          size: 11,
          color: { argb: C.dark },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };
      });

      sheet.getRow(awalTTD).height = 43;

      sheet.addRow([]);
      sheet.addRow([]);
      sheet.addRow([]);

      const akhirTTD = sheet.rowCount + 1;

      sheet.mergeCells(
        akhirTTD,
        1,
        akhirTTD,
        4
      );

      sheet.mergeCells(
        akhirTTD,
        5,
        akhirTTD,
        8
      );

      const namaKepala = sheet.getCell(akhirTTD, 1);
      namaKepala.value =
        "Drs. Herman Wijaya, M.M\nNIP. 196804121995011002";

      const namaWali = sheet.getCell(akhirTTD, 5);
      namaWali.value =
        `${teacherName}\nNIP. ${teacherNip || "-"}`;

      [namaKepala, namaWali].forEach((cell) => {
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          underline: true,
          color: { argb: C.dark },
        };

        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
          wrapText: true,
        };

        cell.numFmt = "@";
      });

      sheet.getRow(akhirTTD).height = 46;

      sheet.pageSetup.printArea = `A1:H${sheet.rowCount}`;

      sheet.pageSetup.horizontalCentered = true;

      const buffer = await workbook.xlsx.writeBuffer();

      const blob = new Blob(
        [new Uint8Array(buffer)],
        {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        `Laporan_Rekap_Rombel_${namaKelas.replace(/\s+/g, "_")}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Gagal mengunduh Excel:", error);
      alert("Gagal membuat laporan Excel. Silakan coba lagi.");
    }
  };

  const tanggalHariIni = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #rekap-rombel-print-area,
          #rekap-rombel-print-area * {
            visibility: visible !important;
          }
          #rekap-rombel-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            color: #0f172a !important;
            font-size: 11pt !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 no-print">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Dokumen Rekapitulasi Rombel: {namaKelas}
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan resmi pembinaan kelas untuk arsip dan penyerahan ke sekolah
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadExcel}
                className="gap-1.5 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Unduh Excel (.xls)</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handlePrint}
                className="gap-1.5 text-xs bg-[#1E3A8A] hover:bg-blue-950 text-white"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCetak}
                className="gap-1.5 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Laporan</span>
              </Button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white space-y-6">
            <div
              id="rekap-rombel-print-area"
              ref={printAreaRef}
              className="space-y-6 text-slate-900 font-sans"
            >
              <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-16 h-16 relative shrink-0">
                    <Image
                      src="/logo-sman2.png"
                      alt="Logo SMAN 2 Padalarang"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                      Pemerintah Daerah Provinsi Jawa Barat &bull; Dinas Pendidikan
                    </h3>
                    <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                      SMA NEGERI 2 PADALARANG
                    </h1>
                    <p className="text-[11px] text-slate-600">
                      Jl. Cihaliwung No. 2, Kertamulya, Kec. Padalarang, Kabupaten Bandung Barat, Jawa Barat 40553
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-blue-950 border-t border-slate-300 pt-2 inline-block px-4">
                    LAPORAN REKAPITULASI PEMBINAAN KELAS (ROMBEL)
                  </h2>
                </div>
              </div>

              <section data-pdf-page-start="true"className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  I. Identitas Kelas & Wali Kelas
                </h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs px-2">
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Rombongan Belajar:</span>
                    <span className="font-bold text-slate-900">{namaKelas} (Tingkat {tingkat} - {jurusan})</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Semester:</span>
                    <span className="font-semibold text-slate-900">{semester}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">Nama Wali Kelas:</span>
                    <span className="font-bold text-slate-900">{teacherName}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Tahun Ajaran:</span>
                    <span className="font-semibold text-slate-900">{tahunAjaran}</span>
                  </div>
                  <div className="flex">
                    <span className="w-36 text-slate-600 font-medium">NIP Wali Kelas:</span>
                    <span className="text-slate-900">{teacherNip}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 text-slate-600 font-medium">Tanggal Laporan:</span>
                    <span className="text-slate-900">{tanggalHariIni}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    II. Jumlah Siswa Terdaftar
                  </h3>
                  <span className="text-xs font-bold text-blue-900">
                    Total: {totalSiswa} Siswa ({countLaki} Laki-laki, {countPerempuan} Perempuan)
                  </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">NIS</th>
                        <th className="py-2 px-3">NISN</th>
                        <th className="py-2 px-3">Nama Lengkap Peserta Didik</th>
                        <th className="py-2 px-3 text-center">Jenis Kelamin</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {siswaList.map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono">{s.nis || "-"}</td>
                          <td className="py-2 px-3 font-mono">{s.nisn || "-"}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{s.nama_lengkap}</td>
                          <td className="py-2 px-3 text-center text-slate-600">{s.jenis_kelamin || "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                              Aktif
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  III. Rekapitulasi Kehadiran Siswa
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">Nama Peserta Didik</th>
                        <th className="py-2 px-2 text-center text-emerald-700">Hadir</th>
                        <th className="py-2 px-2 text-center text-blue-700">Sakit</th>
                        <th className="py-2 px-2 text-center text-amber-700">Izin</th>
                        <th className="py-2 px-2 text-center text-rose-700">Alpa</th>
                        <th className="py-2 px-2 text-center text-slate-600">Terlambat</th>
                        <th className="py-2 px-3 text-center">Persentase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {presensiList.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{p.nama}</td>
                          <td className="py-2 px-2 text-center font-bold text-emerald-700">{p.hadir}</td>
                          <td className="py-2 px-2 text-center text-blue-700">{p.sakit}</td>
                          <td className="py-2 px-2 text-center text-amber-700">{p.izin}</td>
                          <td className="py-2 px-2 text-center font-bold text-rose-700">{p.alpa}</td>
                          <td className="py-2 px-2 text-center text-slate-600">{p.terlambat}</td>
                          <td className="py-2 px-3 text-center font-bold text-slate-800">{p.persentase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    IV. Ringkasan Perkembangan Nilai Mata Pelajaran
                  </h3>
                 <span className="text-xs text-slate-600">
                  Status:{" "}
                  <strong className="text-blue-900">
                    {progresNilai.mapel_lengkap} / {progresNilai.total_mapel} Mapel Lengkap
                  </strong>
                </span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3 text-center w-12">No</th>
                        <th className="py-2 px-3">Nama Siswa</th>
                        <th className="py-2 px-3 text-center">Nilai Pengetahuan</th>
                        <th className="py-2 px-3 text-center">Nilai Keterampilan</th>
                        <th className="py-2 px-3 text-center">Rata-Rata Akhir</th>
                        <th className="py-2 px-3 text-center">Status Rapor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {laporanList.map((l, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-900">{l.nama}</td>
                          <td className="py-2 px-3 text-center">{l.nilai_pengetahuan ?? "-"}</td>
                          <td className="py-2 px-3 text-center">{l.nilai_keterampilan ?? "-"}</td>
                          <td className="py-2 px-3 text-center font-bold text-blue-900">{l.rata_rata ?? "-"}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                              {l.status_laporan === "DisahkanKurikulum"
                                ? "Disahkan Kurikulum"
                                : l.status_laporan === "DitinjauWali"
                                  ? "Ditinjau Wali Kelas"
                                  : l.status_laporan === "Draf"
                                    ? "Draf"
                                    : l.status_laporan || "Belum Ada Status"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  V. Daftar Siswa Membutuhkan Perhatian Khusus
                </h3>
                {siswaPerhatianKhusus.length === 0 ? (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p>
                      <strong>Kondisi Rombel Aman:</strong> Tidak ada siswa yang memerlukan perhatian khusus mendesak.
                      Seluruh siswa memiliki tingkat kehadiran di atas batas aman (&ge;80%) dan tidak memiliki rekor alpa/pelanggaran berat.
                    </p>
                  </div>
                ) : (
                  <div className="border border-amber-200 rounded-xl overflow-hidden bg-amber-50/40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-100/70 text-amber-900 font-semibold border-b border-amber-200">
                        <tr>
                          <th className="py-2 px-3 text-center w-12">No</th>
                          <th className="py-2 px-3">Nama Siswa</th>
                          <th className="py-2 px-3">NIS</th>
                          <th className="py-2 px-3">Catatan Evaluasi / Indikator Perhatian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100">
                        {siswaPerhatianKhusus.map((sk, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 text-center font-medium">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900">{sk.nama}</td>
                            <td className="py-2 px-3 font-mono">{sk.nis}</td>
                            <td className="py-2 px-3 text-amber-900 font-medium">
                              {sk.alasan.join(" • ")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg border-l-4 border-blue-900">
                  VI. Status Penyelesaian Raport
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Pengisian Catatan Wali Kelas:</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {catatanTerisi} dari {totalSiswa} Siswa Terisi (
                      {Math.round((catatanTerisi / (totalSiswa || 1)) * 100)}%)
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="text-slate-500 font-medium">Pengesahan oleh Kurikulum:</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {raporDisahkan} dari {totalSiswa} Siswa Disahkan
                    </div>
                  </div>
                </div>
              </section>

              <div className="pt-8 grid grid-cols-2 text-center text-xs text-slate-800">
                <div className="space-y-16">
                  <p>
                    Mengetahui,<br />
                    Kepala SMA Negeri 2 Padalarang
                  </p>
                  <div>
                    <p className="font-bold underline">Drs. Herman Wijaya, M.M</p>
                    <p className="text-slate-500">NIP. 196804121995011002</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>
                    Padalarang, {tanggalHariIni}<br />
                    Wali Kelas {namaKelas}
                  </p>
                  <div>
                    <p className="font-bold underline">{teacherName}</p>
                    <p className="text-slate-500">NIP. {teacherNip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0 no-print">
            <span className="text-xs text-slate-500">
              Dokumen ini memuat data rekapitulasi kelas {namaKelas} terkini.
            </span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
