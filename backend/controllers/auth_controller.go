package controllers

import (
	"saas-finance-backend/database"
	"saas-finance-backend/models"
	"saas-finance-backend/utils"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

// โครงสร้างข้อมูลสำหรับรับจาก Frontend
type RegisterRequest struct {
	CompanyName string `json:"company_name"`
	Email       string `json:"email"`
	Password    string `json:"password"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Register สำหรับ Admin บริษัท
func RegisterCompanyAdmin(c *fiber.Ctx) error {
	var data RegisterRequest
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid data"})
	}

	// 1. Hash รหัสผ่าน
	password, _ := bcrypt.GenerateFromPassword([]byte(data.Password), 14)

	// 2. สร้างบริษัทก่อน
	company := models.Company{
		Name:        data.CompanyName,
		PackageType: "basic", // ค่าเริ่มต้น
	}
	database.DB.Create(&company)

	// 3. สร้าง User ที่เป็น Admin ของบริษัทนั้น
	user := models.User{
		Email:        data.Email,
		PasswordHash: string(password),
		Role:         "company_admin",
		CompanyID:    &company.ID,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Email already exists"})
	}

	return c.JSON(fiber.Map{
		"message": "Company and Admin created successfully",
		"user":    user,
	})
}

// Login สำหรับทุก Role
func Login(c *fiber.Ctx) error {
	var data LoginRequest
	if err := c.BodyParser(&data); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Invalid data"})
	}

	var user models.User
	database.DB.Where("email = ?", data.Email).First(&user)

	if user.ID == 0 {
		return c.Status(404).JSON(fiber.Map{"message": "User not found"})
	}

	// เช็ครหัสผ่าน
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(data.Password)); err != nil {
		return c.Status(400).JSON(fiber.Map{"message": "Incorrect password"})
	}

	// สร้าง Token
	token, err := utils.GenerateJWT(user.ID, user.Role, user.CompanyID)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"message": "Could not login"})
	}

	return c.JSON(fiber.Map{
		"token": token,
		"user":  user,
	})
}