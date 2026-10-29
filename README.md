# LMS SMAN 2 Padalarang

Repositori pengembangan sistem **Learning Management System (LMS) Berbasis Web** untuk SMA Negeri 2 Padalarang.

Proyek ini dikembangkan untuk memenuhi tugas mata kuliah **Prak. Implementasi dan Pengujian Sistem Informasi**.

## Tim Pengembang

| Nama Lengkap | NIM | Peran / Keterangan |
| :--- | :---: | :--- |
| Velma Dwinda Syabila | 2450231038 | Tim Pengembang |
| Mochammad Hafidz Nugraha | 2450231039 | Developer |
| Kirana Novitasari | 2450231050 | Tim Pengembang |
| Muhamad Ariq Mubaroq | 2450231052 | Tim Pengembang |

## Dokumen Proyek

- [PRD.md](PRD.md) : *Product Requirement Document* (PRD) versi 1.0.0.
- [PRD_LMS_SMAN2_Padalarang.pdf](PRD_LMS_SMAN2_Padalarang.pdf) : Dokumen PRD versi PDF resmi.
- [DESIGN.md](DESIGN.md) : *Design System & UI/UX Specification* (Acuan Figma & SDD Mobile vs Desktop).
- `SOFTWARE REQUIREMENT SPESIFICATION_KELOMPOK 6.pdf` : Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS).
- `SofwareDesignDocument_kelompok6.pdf` : Dokumen Desain Perangkat Lunak (SDD).

## Struktur Repositori

```text
.
├── backend/                  # REST API Service (Golang 1.22+ & Go Fiber v2)
│   ├── cmd/api/main.go       # Entry point server HTTP
│   ├── config/               # Load environment configuration (.env)
│   ├── internal/             # Domain logic (App, Middleware JWT/RBAC, Model, Repository)
│   ├── migrations/           # DDL PostgreSQL Supabase (000001_init_schema.up.sql)
│   ├── seeds/                # Dummy seed data realistis untuk pengujian (seeds.sql)
│   ├── go.mod & go.sum
│   └── .env.example
├── frontend/                 # Web Application (Next.js 15, React 19, TypeScript, Tailwind)
│   ├── src/app/              # App Router: (auth)/login, (dashboard)/siswa, (dashboard)/admin/jadwal
│   ├── src/components/       # UI Primitives & Layout Shell (Topbar, Sidebar, MetricCard, AlertConflict)
│   ├── src/lib/              # Fetch API client & Tailwind merge utility
│   ├── src/types/            # TypeScript interfaces domain LMS
│   ├── package.json
│   └── .env.example
├── docs/assets/designs/      # 21 Tangkapan layar antarmuka referensi Figma & SDD
├── model/                    # Implementasi kode Java untuk UML Class Diagram
└── sequence/                 # Implementasi kode Java untuk UML Sequence Diagram
```

## Panduan Menjalankan Sistem

### 1. Menjalankan Backend (Go Fiber)
```bash
cd backend
cp .env.example .env
# Sesuaikan DATABASE_URL dengan kredensial Supabase PostgreSQL Anda jika diperlukan
go run cmd/api/main.go
# Atau jalankan automated testing:
go test -v ./...
```
Backend akan berjalan pada `http://localhost:8080/api/v1` dengan endpoint health check pada `/api/v1/health`.

### 2. Menjalankan Frontend (Next.js)
```bash
cd frontend
cp .env.example .env.local
npm run dev
# Atau jalankan build check:
npm run build
```
Frontend akan berjalan pada `http://localhost:3000`.
