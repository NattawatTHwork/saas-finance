package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"

	"saas-finance-backend/database"
	"saas-finance-backend/routes"
)

func main() {
	// 1. เชื่อมต่อฐานข้อมูลและอัปเดตตาราง (AutoMigrate)
	database.ConnectDB()

	// 2. เรียกใช้ Seeder เพื่อสร้างข้อมูลตั้งต้น (เช่น Super Admin, แพ็คเกจ)
	database.Seed(database.DB)

	// 3. สร้างแอปพลิเคชัน Fiber
	app := fiber.New()

	// 4. ติดตั้ง Middleware ที่สำคัญ
	// - Logger Middleware: ช่วยแสดง Log ใน Console เมื่อมีคนยิง API เข้ามา
	app.Use(logger.New())
	
	// - CORS Middleware: อนุญาตให้ Frontend ข้ามโดเมนมาเรียก API เราได้
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // ตอนขึ้น Production จริง ควรเปลี่ยนเป็นโดเมนของ Frontend
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// 5. ติดตั้ง Routes ที่เราสร้างไว้
	routes.SetupRoutes(app)

	// 6. กำหนดพอร์ตจากไฟล์ .env
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // ตั้งค่าเริ่มต้นหากหา .env ไม่เจอ
	}

	// 7. เริ่มต้นเปิดรันเซิร์ฟเวอร์
	log.Printf("🚀 Server is running on port %s", port)
	err := app.Listen(":" + port)
	if err != nil {
		log.Fatal("❌ Server failed to start:", err)
	}
}