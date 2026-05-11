package controllers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/services"
)

// 1. GetAllCompanies (ดึงข้อมูลบริษัททั้งหมด)
func GetAllCompanies(c *fiber.Ctx) error {
	companies, err := services.GetAllCompanies()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch companies"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":   "Companies retrieved successfully",
		"companies": companies,
	})
}

// 2. GetCompany (ดึงข้อมูลเฉพาะบริษัท)
func GetCompany(c *fiber.Ctx) error {
	companyIDStr := c.Params("id")
	companyID, err := strconv.ParseUint(companyIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid company ID"})
	}

	// ดึง ID และ Role ของผู้ใช้จาก Context (Token)
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)
	role := c.Locals("role").(string)

	company, err := services.GetCompanyByID(uint(companyID), userID, role)
	if err != nil {
		switch err.Error() {
		case "company_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Company not found"})
		case "unauthorized_action":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have permission to view this company"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch company"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Company retrieved successfully",
		"company": company,
	})
}

// 3. UpdateCompany (แก้ไขข้อมูลบริษัท)
func UpdateCompany(c *fiber.Ctx) error {
	companyIDStr := c.Params("id")
	companyID, err := strconv.ParseUint(companyIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid company ID"})
	}

	req := new(services.CompanyUpdateInput)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	// ดึง ID และ Role ของผู้ใช้จาก Context (Token)
	userIDFloat, _ := c.Locals("user_id").(float64)
	userID := uint(userIDFloat)
	role := c.Locals("role").(string)

	company, err := services.UpdateCompany(uint(companyID), userID, role, *req)
	if err != nil {
		switch err.Error() {
		case "company_not_found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Company not found"})
		case "unauthorized_action":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You don't have permission to edit this company"})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to update company"})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Company updated successfully",
		"company": company,
	})
}