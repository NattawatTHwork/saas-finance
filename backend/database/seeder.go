package database

import (
	"log"

	"saas-finance-backend/models"

	"golang.org/x/crypto/bcrypt"
)

// SeedSuperadmin จะเช็คและสร้างบัญชี superadmin เริ่มต้น
func SeedSuperadmin() {
	var count int64
	// เช็คว่ามี user ที่เป็น superadmin อยู่ในระบบแล้วหรือยัง
	DB.Model(&models.User{}).Where("role = ?", "superadmin").Count(&count)

	if count == 0 {
		log.Println("No superadmin found. Creating default superadmin...")

		// สร้างรหัสผ่านเริ่มต้น (แนะนำให้เปลี่ยนในภายหลัง)
		password := "superadmin123"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 14)
		if err != nil {
			log.Fatal("Failed to hash password for seeder")
		}

		// สร้าง User (สังเกตว่าเราไม่ต้องระบุ CompanyID เพื่อให้มันเป็น NULL โดยปริยาย)
		superAdmin := models.User{
			Email:        "superadmin@system.com",
			PasswordHash: string(hashedPassword),
			Role:         "superadmin",
		}

		if err := DB.Create(&superAdmin).Error; err != nil {
			log.Fatal("Failed to create default superadmin: ", err)
		}

		log.Println("=================================================")
		log.Println("Default Superadmin created successfully!")
		log.Println("Email: superadmin@system.com")
		log.Println("Password: superadmin123")
		log.Println("=================================================")
	} else {
		log.Println("Superadmin already exists. Skipping seeder.")
	}
}