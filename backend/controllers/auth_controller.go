package controllers

import (
	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

// Struct สำหรับรับ JSON Request
type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	CompanyName string `json:"company_name"`
}

// Register จัดการ HTTP Request สำหรับการสมัครสมาชิก
func Register(c *fiber.Ctx) error {
	req := new(RegisterRequest)

	// 1. แปลง JSON Body
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}

	// 2. Validate ข้อมูลเบื้องต้น
	if req.Email == "" || req.Password == "" || req.CompanyName == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email, password, and company name are required",
		})
	}

	// 3. เรียกใช้งาน Service พร้อมส่งข้อมูล (แปลง Request -> Input)
	input := services.RegisterInput{
		Email:       req.Email,
		Password:    req.Password,
		CompanyName: req.CompanyName,
	}

	result, err := services.RegisterAdmin(input)

	// 4. จัดการ Error จาก Service
	if err != nil {
		if err.Error() == "email_exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Email already exists",
			})
		}
		// Error อื่นๆ (เช่น Database พัง, Hash ไม่ได้)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create account: " + err.Error(),
		})
	}

	// 5. ส่ง Response กลับเมื่อสำเร็จ
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Registration successful",
		"user": fiber.Map{
			"id":    result.User.ID,
			"email": result.User.Email,
			"role":  result.User.Role,
		},
		"company": fiber.Map{
			"id":           result.Company.ID,
			"company_name": result.Company.CompanyName,
		},
	})
}

// Struct สำหรับรับ JSON Request ขาเข้าของ Login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// Login จัดการ HTTP Request สำหรับการเข้าสู่ระบบ
func Login(c *fiber.Ctx) error {
	req := new(LoginRequest)

	// 1. แปลง JSON Body
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request format",
		})
	}

	// 2. Validate ข้อมูลเบื้องต้น
	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Email and password are required",
		})
	}

	// 3. เรียกใช้งาน Service
	input := services.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	}

	result, err := services.Login(input)

	// 4. จัดการ Error
	if err != nil {
		switch err.Error() {
		case "invalid_credentials":
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{ // 401 Unauthorized
				"error": "Invalid email or password",
			})
		case "account_inactive":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{ // 403 Forbidden
				"error": "Your account is inactive",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to login",
			})
		}
	}

	// 5. ส่ง Response กลับเมื่อเข้าสู่ระบบสำเร็จ
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Login successful",
		"token":   result.Token, // ส่ง Token กลับไปให้ Frontend ใช้
		"user": fiber.Map{
			"id":    result.User.ID,
			"email": result.User.Email,
			"role":  result.User.Role,
		},
	})
}