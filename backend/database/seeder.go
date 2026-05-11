package database

import (
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"saas-finance-backend/models"
)

// Seed เป็นฟังก์ชันหลักที่จะถูกเรียกใช้เพื่อเริ่มต้นสร้างข้อมูล
func Seed(db *gorm.DB) {
	log.Println("🌱 Starting database seeder...")

	seedPackages(db)
	seedCategories(db)
	seedInitialUsers(db)

	log.Println("✅ Database seeding completed")
}

func seedPackages(db *gorm.DB) {
	var count int64
	db.Model(&models.Package{}).Count(&count)

	if count == 0 {
		packages := []models.Package{
			// --- Trial Plan ---
			{Name: "7-Day Free Trial", Price: 0, BillingCycle: "7_days", Description: "Free trial for all features (7 days)", IsActive: true},

			// --- Monthly Plans ---
			{Name: "Basic Monthly", Price: 290, BillingCycle: "monthly", Description: "Essential features for small teams", IsActive: true},
			{Name: "Pro Monthly", Price: 990, BillingCycle: "monthly", Description: "Advanced features for growing business", IsActive: true},
			{Name: "Enterprise Monthly", Price: 2500, BillingCycle: "monthly", Description: "Full features for large organizations", IsActive: true},

			// --- Yearly Plans (Discounted compared to monthly * 12) ---
			{Name: "Basic Yearly", Price: 2900, BillingCycle: "yearly", Description: "Save more with annual billing (Approx. 241/mo)", IsActive: true},
			{Name: "Pro Yearly", Price: 9900, BillingCycle: "yearly", Description: "Save more with annual billing (Approx. 825/mo)", IsActive: true},
			{Name: "Enterprise Yearly", Price: 25000, BillingCycle: "yearly", Description: "Full business support with annual savings", IsActive: true},
		}

		if err := db.Create(&packages).Error; err != nil {
			log.Printf("❌ Failed to seed packages: %v", err)
			return
		}
		log.Println("✅ Advanced Packages seeded successfully")
	}
}

func seedCategories(db *gorm.DB) {
	var count int64
	db.Model(&models.Category{}).Count(&count)

	if count == 0 {
		categories := []models.Category{
			{Name: "รายได้จากการขาย", Type: "income"},
			{Name: "รายได้จากบริการ", Type: "income"},
			{Name: "รายได้อื่นๆ", Type: "income"},
			{Name: "เงินเดือนพนักงาน", Type: "expense"},
			{Name: "ค่าเช่าสำนักงาน", Type: "expense"},
			{Name: "ค่าน้ำค่าไฟ", Type: "expense"},
			{Name: "ค่าการตลาด", Type: "expense"},
			{Name: "รายจ่ายอื่นๆ", Type: "expense"},
		}

		if err := db.Create(&categories).Error; err != nil {
			log.Printf("❌ Failed to seed categories: %v", err)
			return
		}
		log.Println("✅ Categories seeded successfully")
	} else {
		log.Println("⚡ Categories already exist, skipping...")
	}
}

// seedInitialUsers จะสร้างเฉพาะ Super Admin สำหรับผู้จัดการระบบ
func seedInitialUsers(db *gorm.DB) {
	var count int64
	db.Model(&models.User{}).Where("role = ?", "superadmin").Count(&count)

	if count == 0 {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("❌ Failed to hash password: %v", err)
			return
		}

		superAdmin := models.User{
			Email:        "superadmin@financesaas.com",
			PasswordHash: string(hashedPassword),
			Role:         "superadmin",
			Status:       "active",
		}

		if err := db.Create(&superAdmin).Error; err != nil {
			log.Printf("❌ Failed to seed superadmin: %v", err)
			return
		}
		log.Println("✅ Super Admin seeded successfully (Email: superadmin@financesaas.com, Pass: password123)")
	} else {
		log.Println("⚡ Super Admin already exists, skipping...")
	}
}