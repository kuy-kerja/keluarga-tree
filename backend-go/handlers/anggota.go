package handlers

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/kuy-kerja/keluarga-tree/database"
	"github.com/kuy-kerja/keluarga-tree/models"
)

// --- Helpers ---

func formPtr(c *fiber.Ctx, key string) *string {
	v := c.FormValue(key)
	if v == "" {
		return nil
	}
	return &v
}

func formIntPtr(c *fiber.Ctx, key string) *int {
	v := c.FormValue(key)
	if v == "" {
		return nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return nil
	}
	return &n
}

func parseID(c *fiber.Ctx) (int, error) {
	return strconv.Atoi(c.Params("id"))
}

func saveUpload(c *fiber.Ctx, field string) *string {
	file, err := c.FormFile(field)
	if err != nil || file == nil {
		return nil
	}
	ext := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("foto_%d%s", time.Now().UnixNano(), ext)
	savePath := filepath.Join("uploads", filename)
	if err := c.SaveFile(file, savePath); err != nil {
		return nil
	}
	return &filename
}

func scanAnggota(row interface{ Scan(dest ...any) error }) (*models.Anggota, error) {
	var a models.Anggota
	err := row.Scan(
		&a.ID, &a.Nama, &a.NamaPanggilan, &a.JenisKelamin,
		&a.TanggalLahir, &a.TanggalWafat, &a.TempatLahir,
		&a.Pekerjaan, &a.Foto, &a.IDAyah, &a.IDIbu,
		&a.IDPasangan, &a.TanggalNikah, &a.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// --- Handlers ---

func GetAllAnggota(c *fiber.Ctx) error {
	rows, err := database.DB.Query("SELECT * FROM anggota ORDER BY created_at DESC")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	anggota := make([]models.Anggota, 0)
	for rows.Next() {
		a, err := scanAnggota(rows)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		anggota = append(anggota, *a)
	}

	return c.JSON(anggota)
}

func GetAnggota(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	a, err := scanAnggota(database.DB.QueryRow("SELECT * FROM anggota WHERE id = ?", id))
	if err == sql.ErrNoRows {
		return c.Status(404).JSON(fiber.Map{"error": "Tidak ditemukan"})
	}
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(a)
}

func CreateAnggota(c *fiber.Ctx) error {
	nama := c.FormValue("nama")
	jk := c.FormValue("jenis_kelamin")

	if nama == "" || jk == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nama dan jenis kelamin wajib diisi"})
	}

	foto := saveUpload(c, "foto")
	idPasangan := formIntPtr(c, "id_pasangan")
	tanggalNikah := formPtr(c, "tanggal_nikah")

	result, err := database.DB.Exec(
		`INSERT INTO anggota
		(nama, nama_panggilan, jenis_kelamin, tanggal_lahir, tanggal_wafat, tempat_lahir, pekerjaan, foto, id_ayah, id_ibu, id_pasangan, tanggal_nikah)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		nama, formPtr(c, "nama_panggilan"), jk,
		formPtr(c, "tanggal_lahir"), formPtr(c, "tanggal_wafat"),
		formPtr(c, "tempat_lahir"), formPtr(c, "pekerjaan"),
		foto, formIntPtr(c, "id_ayah"), formIntPtr(c, "id_ibu"),
		idPasangan, tanggalNikah,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	lastID, _ := result.LastInsertId()

	// Sinkronisasi pasangan
	if idPasangan != nil {
		database.DB.Exec(
			"UPDATE anggota SET id_pasangan = ?, tanggal_nikah = COALESCE(tanggal_nikah, ?) WHERE id = ? AND (id_pasangan IS NULL OR id_pasangan != ?)",
			lastID, tanggalNikah, *idPasangan, lastID,
		)
	}

	return c.Status(201).JSON(fiber.Map{"id": lastID, "foto": foto})
}

func UpdateAnggota(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	nama := c.FormValue("nama")
	jk := c.FormValue("jenis_kelamin")
	if nama == "" || jk == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Nama dan jenis kelamin wajib diisi"})
	}

	// Foto: pakai baru atau pertahankan lama
	foto := saveUpload(c, "foto")
	if foto == nil {
		database.DB.QueryRow("SELECT foto FROM anggota WHERE id = ?", id).Scan(&foto)
	} else {
		// Hapus foto lama
		var old *string
		database.DB.QueryRow("SELECT foto FROM anggota WHERE id = ?", id).Scan(&old)
		if old != nil {
			os.Remove(filepath.Join("uploads", *old))
		}
	}

	idPasangan := formIntPtr(c, "id_pasangan")
	tanggalNikah := formPtr(c, "tanggal_nikah")

	_, err = database.DB.Exec(
		`UPDATE anggota SET
		nama=?, nama_panggilan=?, jenis_kelamin=?, tanggal_lahir=?, tanggal_wafat=?,
		tempat_lahir=?, pekerjaan=?, foto=?, id_ayah=?, id_ibu=?, id_pasangan=?, tanggal_nikah=?
		WHERE id=?`,
		nama, formPtr(c, "nama_panggilan"), jk,
		formPtr(c, "tanggal_lahir"), formPtr(c, "tanggal_wafat"),
		formPtr(c, "tempat_lahir"), formPtr(c, "pekerjaan"),
		foto, formIntPtr(c, "id_ayah"), formIntPtr(c, "id_ibu"),
		idPasangan, tanggalNikah, id,
	)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	// Sinkronisasi pasangan
	if idPasangan != nil {
		database.DB.Exec(
			"UPDATE anggota SET id_pasangan = ?, tanggal_nikah = COALESCE(tanggal_nikah, ?) WHERE id = ?",
			id, tanggalNikah, *idPasangan,
		)
	}

	return c.JSON(fiber.Map{"success": true})
}

func DeleteAnggota(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ID tidak valid"})
	}

	var foto *string
	database.DB.QueryRow("SELECT foto FROM anggota WHERE id = ?", id).Scan(&foto)
	if foto != nil {
		os.Remove(filepath.Join("uploads", *foto))
	}

	if _, err = database.DB.Exec("DELETE FROM anggota WHERE id = ?", id); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true})
}

func GetTree(c *fiber.Ctx) error {
	rows, err := database.DB.Query("SELECT * FROM anggota")
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	defer rows.Close()

	type node struct {
		models.Anggota
		Children []int
	}

	byID := make(map[int]*models.Anggota)
	for rows.Next() {
		a, err := scanAnggota(rows)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		cp := *a
		cp.Anak = make([]models.Anggota, 0)
		byID[a.ID] = &cp
	}

	// Bangun hubungan anak
	for _, n := range byID {
		parentID := n.IDAyah
		if parentID == nil {
			parentID = n.IDIbu
		}
		if parentID != nil {
			if parent, ok := byID[*parentID]; ok {
				parent.Anak = append(parent.Anak, *n)
			}
		}
	}

	// Kumpulkan root (tanpa parent)
	roots := make([]models.Anggota, 0)
	for _, n := range byID {
		if n.IDAyah == nil && n.IDIbu == nil {
			roots = append(roots, *n)
		}
	}

	return c.JSON(roots)
}
