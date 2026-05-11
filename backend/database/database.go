package database

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	// เปลี่ยน "your_project/models" เป็นชื่อ module ในไฟล์ go.mod ของคุณ
	"saas-finance-backend/models" 
)

// สร้างตัวแปร DB แบบ Global เพื่อให้ package อื่นเรียกใช้งานได้
var DB *gorm.DB

func ConnectDB() {
	// 1. โหลดไฟล์ .env
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Could not load .env file, using system environment variables")
	}

	// 2. ดึงค่าจากตัวแปร Environment
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")
	sslMode := os.Getenv("DB_SSLMODE")

	// 3. สร้าง DSN (Data Source Name) สำหรับเชื่อมต่อ PostgreSQL
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		host, user, password, dbName, port, sslMode)

	// 4. เชื่อมต่อฐานข้อมูลด้วย GORM
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info), // เปิดให้แสดง SQL Query ใน Console (มีประโยชน์ตอน Dev)
	})

	if err != nil {
		log.Fatal("❌ Failed to connect to database! \n", err)
	}

	log.Println("✅ Database connection successfully opened")

	// 5. นำ Models ไปสร้างตารางอัตโนมัติ (Auto Migrate)
	log.Println("⏳ Running Migrations...")
	err = db.AutoMigrate(
		&models.User{},
		&models.Company{},
		&models.Package{},
		&models.Category{},
		&models.Transaction{},
		&models.PackageTransaction{},
	)

	if err != nil {
		log.Fatal("❌ Failed to migrate database! \n", err)
	}

	log.Println("✅ Database Migrated Successfully")

	// กำหนดค่า db ที่เชื่อมต่อสำเร็จให้กับตัวแปร Global
	DB = db
}