package controllers

import (
	"strconv"

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

// สร้าง Struct ใหม่สำหรับ Admin (รับแค่ Email กับ Password พอ)
type CreateAssistantByAdminRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// CreateAssistantByAdmin - API สำหรับ Admin เพิ่ม Assistant
func CreateAssistantByAdmin(c *fiber.Ctx) error {
	req := new(CreateAssistantByAdminRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.Email == "" || req.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Email and password are required"})
	}

	// 1. ดึง user_id ของ Admin จาก Token (ที่ได้จาก Auth Middleware)
	adminIDFloat, ok := c.Locals("user_id").(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized or invalid token payload"})
	}
	adminID := uint(adminIDFloat)

	// 2. ส่งไปให้ Service จัดการต่อ
	user, err := services.CreateAssistantByAdmin(req.Email, req.Password, adminID)
	if err != nil {
		switch err.Error() {
		case "email_exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
		case "admin_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found in database"})
		case "not_an_admin":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You cannot add an assistant because you are not an admin."})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
		}
	}

	// 3. สร้างสำเร็จ คืนค่าข้อมูลกลับไป
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

// Struct สำหรับรับค่าการอัปเดตข้อมูลผู้ใช้
type UpdateUserRequest struct {
	Email  string `json:"email"`
	Status string `json:"status"` // เช่น "active", "inactive"
}

// Struct สำหรับรับค่าการเปลี่ยนรหัสผ่าน
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

// UpdateUserBySuperAdmin Controller - แก้ไขข้อมูลโดย Superadmin
func UpdateUserBySuperAdmin(c *fiber.Ctx) error {
	targetIDParam := c.Params("id")
	targetID, err := strconv.ParseUint(targetIDParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	req := new(UpdateUserRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	user, err := services.UpdateUserBySuperAdmin(uint(targetID), req.Email, req.Status)
	if err != nil {
		switch err.Error() {
		case "user_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		case "email_exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User updated successfully",
		"user": fiber.Map{
			"id":     user.ID,
			"email":  user.Email,
			"role":   user.Role,
			"status": user.Status,
		},
	})
}

// UpdateAssistantByAdmin Controller - แก้ไข Assistant โดย Admin
func UpdateAssistantByAdmin(c *fiber.Ctx) error {
	targetIDParam := c.Params("id")
	assistantID, err := strconv.ParseUint(targetIDParam, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid assistant ID"})
	}

	req := new(UpdateUserRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	adminIDFloat, ok := c.Locals("user_id").(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	adminID := uint(adminIDFloat)

	user, err := services.UpdateAssistantByAdmin(adminID, uint(assistantID), req.Email, req.Status)
	if err != nil {
		switch err.Error() {
		case "user_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Assistant not found"})
		case "unauthorized_manager":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You are not authorized to update this assistant"})
		case "email_exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "Email already exists"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Assistant updated successfully",
		"user": fiber.Map{
			"id":     user.ID,
			"email":  user.Email,
			"role":   user.Role,
			"status": user.Status,
		},
	})
}

// ChangePassword Controller - เปลี่ยนรหัสผ่านตัวเอง (สำหรับทุกคนที่ล็อกอิน)
func ChangePassword(c *fiber.Ctx) error {
	req := new(ChangePasswordRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.OldPassword == "" || req.NewPassword == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Old and new passwords are required"})
	}

	userIDFloat, ok := c.Locals("user_id").(float64)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := uint(userIDFloat)

	err := services.ChangePassword(userID, req.OldPassword, req.NewPassword)
	if err != nil {
		switch err.Error() {
		case "user_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "User not found"})
		case "invalid_old_password":
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid old password"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Internal server error"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Password changed successfully",
	})
}