package controllers

import (
    "saas-finance-backend/database"
    "saas-finance-backend/models"

    "github.com/gofiber/fiber/v2"
    "golang.org/x/crypto/bcrypt"
)

// ... (Your CreateCompanyUser code remains here) ...

// 1. Get all employees in the company
func GetCompanyUsers(c *fiber.Ctx) error {
    companyID := c.Locals("company_id").(float64) 

    var users []models.User
    
    database.DB.Select("id, email, role, created_at").
        Where("company_id = ?", uint(companyID)).
        Find(&users)

    return c.Status(200).JSON(fiber.Map{
        "users": users,
    })
}

// 2. Update employee data (Role, Password)
func UpdateCompanyUser(c *fiber.Ctx) error {
    companyID := c.Locals("company_id").(float64)
    userID := c.Params("id") 

    var updateData struct {
        Role     string `json:"role"`
        Password string `json:"password"`
    }

    if err := c.BodyParser(&updateData); err != nil {
        return c.Status(400).JSON(fiber.Map{"message": "Invalid request data"})
    }

    var user models.User
    
    if err := database.DB.Where("id = ? AND company_id = ?", userID, uint(companyID)).First(&user).Error; err != nil {
        return c.Status(404).JSON(fiber.Map{"message": "User not found or unauthorized access"})
    }

    if updateData.Role != "" {
        user.Role = updateData.Role
    }

    if updateData.Password != "" {
        hash, err := bcrypt.GenerateFromPassword([]byte(updateData.Password), 10)
        if err != nil {
            return c.Status(500).JSON(fiber.Map{"message": "Failed to hash password"})
        }
        user.PasswordHash = string(hash)
    }

    database.DB.Save(&user)

    return c.Status(200).JSON(fiber.Map{
        "message": "User updated successfully",
    })
}

// 3. Delete employee
func DeleteCompanyUser(c *fiber.Ctx) error {
    companyID := c.Locals("company_id").(float64)
    userID := c.Params("id")

    result := database.DB.Where("id = ? AND company_id = ?", userID, uint(companyID)).Delete(&models.User{})
    
    if result.RowsAffected == 0 {
        return c.Status(404).JSON(fiber.Map{"message": "User not found or unauthorized to delete"})
    }

    return c.Status(200).JSON(fiber.Map{
        "message": "User deleted successfully",
    })
}