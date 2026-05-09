package controllers

import (
	"saas-finance-backend/database"
	"saas-finance-backend/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// โครงสร้างข้อมูลสำหรับรับจาก Frontend
type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"` // รับค่าแค่ "employee" หรือ "accountant"
}

// CreateCompanyUser สำหรับให้ Company Admin สร้างพนักงาน
func CreateCompanyUser(c *fiber.Ctx) error {
	// 1. ดึงข้อมูลบริษัทจาก Token (ที่ Middleware ยัดใส่ Context ไว้ให้)
	companyIDVal := c.Locals("company_id")
	if companyIDVal == nil {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "Only company admins can create users",
		})
	}

	// แปลงชนิดข้อมูลจาก Token (JWT มักจะแปลงตัวเลขเป็น float64 อัตโนมัติ)
	companyID := uint(companyIDVal.(float64))

	// 2. รับข้อมูลจาก Frontend
	var data CreateUserRequest
	if err := c.BodyParser(&data); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "Invalid data"})
	}

	// 3. ตรวจสอบ Role (บังคับว่าต้องเป็นพนักงานหรือนักบัญชีเท่านั้น ห้ามเป็น Admin หรือ Superadmin ซ้อน)
	if data.Role != "employee" && data.Role != "accountant" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Invalid role. Must be 'employee' or 'accountant'",
		})
	}

	// 4. Hash รหัสผ่าน
	password, _ := bcrypt.GenerateFromPassword([]byte(data.Password), 14)

	// 5. สร้าง User ลง Database พร้อมผูกกับบริษัท
	user := models.User{
		Email:        data.Email,
		PasswordHash: string(password),
		Role:         data.Role,
		CompanyID:    &companyID, // บังคับผูกกับ Company ID ของ Admin
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "Email already exists",
		})
	}

	return c.JSON(fiber.Map{
		"message": "User created successfully",
		"user":    user,
	})
}