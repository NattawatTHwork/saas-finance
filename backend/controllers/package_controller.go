package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/models"
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
		case "you_already_have_an_active_subscription": // 🌟 ดัก Error ซื้อซ้ำ
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "You already have an active subscription"})
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

// GetAllPackages - API สำหรับดึงรายการแพ็คเกจทั้งหมด (Public)
func GetAllPackages(c *fiber.Ctx) error {
	packages, err := services.GetAllPackages()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch packages",
		})
	}

	return c.Status(fiber.StatusOK).JSON(packages)
}

// GetAllPackagesAdmin
func GetAllPackagesAdmin(c *fiber.Ctx) error {
	packages, err := services.GetAllPackagesAdmin()
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(200).JSON(packages)
}

// CreatePackage
func CreatePackage(c *fiber.Ctx) error {
	var pkg models.Package
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	newPkg, err := services.CreatePackage(pkg)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(201).JSON(newPkg)
}

// UpdatePackage
func UpdatePackage(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	var pkg models.Package
	if err := c.BodyParser(&pkg); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid input"})
	}

	updatedPkg, err := services.UpdatePackage(uint(id), pkg)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(200).JSON(updatedPkg)
}

// DeletePackage
func DeletePackage(c *fiber.Ctx) error {
	id, _ := strconv.Atoi(c.Params("id"))
	if err := services.DeletePackage(uint(id)); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(200).JSON(fiber.Map{"message": "Package deleted"})
}