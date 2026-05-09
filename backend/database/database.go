package database

import (
	"fmt"
	"log"
	"os"

	"saas-finance-backend/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database. \n", err)
	}

	log.Println("Connected to database successfully")

	// ทำการ Auto Migrate เพื่อสร้าง/อัปเดตตารางตาม Models อัตโนมัติ
	db.AutoMigrate(&models.Company{}, &models.User{})
	log.Println("Database Migrated")

	DB = db
}