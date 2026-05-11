package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

// 1. Create Transaction (เพิ่ม)
func CreateTransaction(c *fiber.Ctx) error {
	req := new(services.TransactionInput)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	// ตรวจสอบข้อมูลจำเป็น
	if req.CompanyID == 0 || req.CategoryID == 0 || req.Amount <= 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company_id, category_id, and amount are required"})
	}

	// ดึง ID ของคนที่กำลังทำรายการ
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)

	transaction, err := services.CreateTransaction(userID, *req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create transaction"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":     "Transaction created successfully",
		"transaction": transaction,
	})
}

// 2. Get All Transactions (อ่านทั้งหมด)
func GetTransactions(c *fiber.Ctx) error {
	// รับ company_id จาก Query parameter (เช่น /api/transactions?company_id=1)
	companyIDStr := c.Query("company_id")
	if companyIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "company_id query parameter is required"})
	}

	companyID, _ := strconv.ParseUint(companyIDStr, 10, 32)

	transactions, err := services.GetTransactions(uint(companyID))
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