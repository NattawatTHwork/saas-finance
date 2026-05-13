package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

// 1. Create Transaction (เพิ่มข้อมูล)
func CreateTransaction(c *fiber.Ctx) error {
	req := new(services.TransactionInput)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.CategoryID == 0 || req.Amount <= 0 || req.Type == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "type, category_id and amount are required"})
	}

	// 🌟 ดึง ID ของคนที่ล็อกอินอยู่จาก Token
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)

	// เรียก Service และส่ง userID ไปให้ Service จัดการหา Company อัตโนมัติ
	transaction, err := services.CreateTransaction(userID, *req)
	if err != nil {
		switch err.Error() {
		case "user_not_found":
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		case "no_company_assigned":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You do not belong to any company"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create transaction"})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":     "Transaction created successfully",
		"transaction": transaction,
	})
}

// 2. Get All Transactions (อ่านทั้งหมดของบริษัทตัวเอง)
func GetTransactions(c *fiber.Ctx) error {
	// 🌟 ไม่รับ ?company_id จาก Frontend แล้ว เพื่อความปลอดภัย!
	// ดึง userID จาก Token แทน
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)

	transactions, err := services.GetTransactions(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch transactions"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":      "Transactions retrieved successfully",
		"transactions": transactions,
	})
}

// 3. Get Transaction by ID (อ่านเฉพาะ ID)
func GetTransaction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	transaction, err := services.GetTransactionByID(uint(id))
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":     "Transaction retrieved successfully",
		"transaction": transaction,
	})
}

// 4. Update Transaction (แก้ไข)
func UpdateTransaction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	req := new(services.TransactionInput)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	transaction, err := services.UpdateTransaction(uint(id), *req)
	if err != nil {
		if err.Error() == "transaction_not_found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update transaction"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":     "Transaction updated successfully",
		"transaction": transaction,
	})
}

// 5. Delete Transaction (ลบ)
func DeleteTransaction(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, _ := strconv.ParseUint(idStr, 10, 32)

	err := services.DeleteTransaction(uint(id))
	if err != nil {
		if err.Error() == "transaction_not_found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Transaction not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete transaction"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Transaction deleted successfully",
	})
}