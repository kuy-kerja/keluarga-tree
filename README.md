# 🫂 Silsilah Keluarga

Aplikasi web untuk mencatat dan menampilkan silsilah keluarga secara visual.

## Struktur Project

```
keluarga-tree/
├── frontend/          # React + Vite (PWA)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── backend-go/        # Go Fiber + SQLite
│   ├── main.go
│   ├── handlers/
│   ├── models/
│   ├── database/
│   └── go.mod
└── README.md
```

## Tech Stack

- **Frontend**: React 18, Vite 5, CSS
- **Backend**: Go, Fiber v2, SQLite
- **Database**: SQLite3

## Cara Menjalankan

### Backend (Go Fiber)

```bash
cd backend-go
go mod tidy
go run main.go
```

Server berjalan di `http://localhost:3001`

### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`

## Fitur

- ✅ Tambah/Edit/Hapus anggota keluarga
- ✅ Hubungan hirarki (Ayah/Ibu/Pasangan)
- ✅ Upload foto profil
- ✅ Tanggal pernikahan
- ✅ Pohon keluarga visual (Canvas)
- ✅ Daftar anggota dengan pencarian
- ✅ API REST dengan Go Fiber

## API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/anggota` | Semua anggota |
| GET | `/api/anggota/:id` | Detail anggota |
| POST | `/api/anggota` | Tambah anggota |
| PUT | `/api/anggota/:id` | Update anggota |
| DELETE | `/api/anggota/:id` | Hapus anggota |
| GET | `/api/tree` | Struktur pohon |

## License

MIT
