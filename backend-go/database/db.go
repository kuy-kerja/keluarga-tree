package database

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error
	DB, err = sql.Open("sqlite3", "./keluarga.db")
	if err != nil {
		log.Fatal(err)
	}

	schema := `
	CREATE TABLE IF NOT EXISTS anggota (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		nama TEXT NOT NULL,
		nama_panggilan TEXT,
		jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L','P')),
		tanggal_lahir TEXT,
		tanggal_wafat TEXT,
		tempat_lahir TEXT,
		pekerjaan TEXT,
		foto TEXT,
		id_ayah INTEGER,
		id_ibu INTEGER,
		id_pasangan INTEGER,
		tanggal_nikah TEXT,
		created_at DATETIME DEFAULT (datetime('now'))
	);`

	_, err = DB.Exec(schema)
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Database initialized")
}
