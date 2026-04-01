package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/kuy-kerja/keluarga-tree/database"
	"github.com/kuy-kerja/keluarga-tree/handlers"
)

func main() {
	// Init database
	database.InitDB()

	// Fiber app
	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024, // 10MB
	})

	// Middleware
	app.Use(cors.New())
	app.Use(logger.New())

	// Ensure uploads dir
	uploadsDir := "./uploads"
	if err := os.MkdirAll(uploadsDir, os.ModePerm); err != nil {
		log.Fatal(err)
	}

	// Serve uploads
	app.Static("/uploads", uploadsDir)

	// API routes
	api := app.Group("/api")
	api.Get("/anggota", handlers.GetAllAnggota)
	api.Get("/anggota/:id", handlers.GetAnggota)
	api.Post("/anggota", handlers.CreateAnggota)
	api.Put("/anggota/:id", handlers.UpdateAnggota)
	api.Delete("/anggota/:id", handlers.DeleteAnggota)
	api.Get("/tree", handlers.GetTree)

	// Serve frontend (production)
	distDir := filepath.Join("..", "frontend", "dist")
	if _, err := os.Stat(distDir); err == nil {
		app.Static("/", distDir)
		app.Get("*", func(c *fiber.Ctx) error {
			return c.SendFile(filepath.Join(distDir, "index.html"))
		})
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Server running on http://localhost:%s", port)
	log.Fatal(app.Listen(":" + port))
}
