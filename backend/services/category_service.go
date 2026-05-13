package services

import (
	"errors"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// GetAllCategories ดึงข้อมูลหมวดหมู่ทั้งหมด
func GetAllCategories() ([]models.Category, error) {
	var categories []models.Category
	if err := database.DB.Find(&categories).Error; err != nil {
		return nil, err
	}
	return categories, nil
}

// CreateCategory สร้างหมวดหมู่ใหม่
func CreateCategory(name string, catType string) (*models.Category, error) {
	// 🌟 2. เช็คว่ามีหมวดหมู่นี้ในระบบหรือยัง (ชื่อเดียวกันและประเภทเดียวกัน)
	var count int64
	database.DB.Model(&models.Category{}).Where("name = ? AND type = ?", name, catType).Count(&count)
	if count > 0 {
		return nil, errors.New("category_exists")
	}

	category := models.Category{
		Name: name,
		Type: catType, // "income" หรือ "expense"
	}

	if err := database.DB.Create(&category).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

// DeleteCategory ลบหมวดหมู่ (Soft Delete)
func DeleteCategory(id uint) error {
	var category models.Category
	if err := database.DB.First(&category, id).Error; err != nil {
		return errors.New("category_not_found")
	}

	if err := database.DB.Delete(&category).Error; err != nil {
		return err
	}
	return nil
}