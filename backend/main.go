package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
	
	"saas-finance-backend/database"
	"saas-finance-backend/routes" // เพิ่มการนำเข้า (import) ไฟล์ routes
)

func main() {
	// โหลดไฟล์ .env
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// เชื่อมต่อ Database
	database.ConnectDB()

	database.SeedSuperadmin()

	app := fiber.New()

	// เปิด CORS ให้ Frontend (Next.js) เรียกใช้งาน API ได้
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:3000", // ระบุ URL ของ Next.js
		AllowCredentials: true,
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
	}))

	// ทดสอบ Route พื้นฐาน
	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is running successfully",
		})
	})

	// เรียกใช้งาน Routes ทั้งหมดที่เราสร้างไว้ (เช่น /api/auth/login)
	routes.Setup(app)

	port := os.Getenv("PORT")
	log.Printf("Server is running on port %s", port)
	app.Listen(":" + port)
}