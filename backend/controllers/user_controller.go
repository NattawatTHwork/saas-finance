package controllers

import (
	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

type CreateUserRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	CompanyID uint   `json:"company_id"` // สำหรับตอนสร้าง assistant
}

// CreateSuperAdmin Controller (ดักให้เข้าได้เฉพาะ superadmin ใน route)
func CreateSuperAdmin(c *fiber.Ctx) error {
	req := new(CreateUserRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	input := services.CreateSuperAdminInput{
		Email:    req.Email,
		Password: req.Password,
	}

	user, err := services.CreateSuperAdmin(input)
	if err != nil {
		if err.Error() == "email_exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Super Admin created successfully",
		"user":    fiber.Map{"id": user.ID, "email": user.Email, "role": user.Role},
	})
}

// CreateAssistant Controller
func CreateAssistant(c *fiber.Ctx) error {
	req := new(CreateUserRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	// ข้อควรระวังของ JWT: ตัวเลขใน JSON ที่ถูกแกะมามักจะเป็น float64 เสมอ เราต้องแปลงเป็น uint ก่อนใช้งาน
	creatorIDFloat, _ := c.Locals("user_id").(float64)
	creatorID := uint(creatorIDFloat)
	creatorRole := c.Locals("role").(string)

	input := services.CreateAssistantInput{
		Email:     req.Email,
		Password:  req.Password,
		CompanyID: req.CompanyID,
	}

	user, err := services.CreateAssistant(input, creatorRole, creatorID)
	if err != nil {
		switch err.Error() {
		case "email_exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
		case "company_id_required":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Super Admin must provide company_id to assign the assistant"})
		case "company_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Company not found"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Assistant created successfully",
		"user": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"role":       user.Role,
			"manager_id": user.ManagerID,
		},
	})
}