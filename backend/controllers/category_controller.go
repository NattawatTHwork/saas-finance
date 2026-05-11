package controllers

import (
	"strconv"
	"github.com/gofiber/fiber/v2"
	"saas-finance-backend/services"
)

type CategoryRequest struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// GetAllCategories Controller
func GetAllCategories(c *fiber.Ctx) error {
	categories, err := services.GetAllCategories()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch categories"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message":    "Categories retrieved successfully",
		"categories": categories,
	})
}

// CreateCategory Controller
func CreateCategory(c *fiber.Ctx) error {
	req := new(CategoryRequest)
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request format"})
	}

	if req.Name == "" || req.Type == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Name and type are required"})
	}

	category, err := services.CreateCategory(req.Name, req.Type)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create category"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":  "Category created successfully",
		"category": category,
	})
}

// DeleteCategory Controller
func DeleteCategory(c *fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid category ID"})
	}

	err = services.DeleteCategory(uint(id))
	if err != nil {
		if err.Error() == "category_not_found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Category not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete category"})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Category deleted successfully",
	})
}