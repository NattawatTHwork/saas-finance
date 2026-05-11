package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

// Struct รับข้อมูลการสมัครแพ็คเกจ
type SubscribeRequest struct {
	PackageID uint `json:"package_id"`
}

// SubscribePackage Controller สำหรับ Admin
func SubscribePackage(c *fiber.Ctx) error {
	req := new(SubscribeRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.PackageID == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "package_id is required"})
	}

	// ดึง user_id จาก Token (Admin ที่กำลังล็อกอิน)
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)

	// เรียกใช้งาน Service
	transaction, err := services.SubscribePackage(userID, req.PackageID)
	if err != nil {
		// 📌 จัดการ Error ตามเงื่อนไขต่างๆ
		switch err.Error() {
		case "package_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Package not found"})
		case "trial_already_used":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You have already used the free trial"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to subscribe package"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":     "Subscribed to package successfully",
		"transaction": transaction,
	})
}

// CancelPackage Controller สำหรับ Superadmin
func CancelPackage(c *fiber.Ctx) error {
	// ดึง transaction ID จาก URL Parameter (เช่น /api/packages/transactions/1/cancel)
	transactionIDStr := c.Params("id")
	transactionID, err := strconv.ParseUint(transactionIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid transaction ID"})
	}

	// เรียกใช้งาน Service
	transaction, err := services.CancelPackage(uint(transactionID))
	if err != nil {
		switch err.Error() {
		case "transaction_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
		case "already_cancelled":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Transaction is already cancelled"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to cancel package"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":     "Package cancelled successfully",
		"transaction": transaction,
	})
}