package services

import (
	"errors"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// Struct รับข้อมูลสำหรับอัปเดตบริษัท
type CompanyUpdateInput struct {
	CompanyName string `json:"company_name"`
	TaxID       string `json:"tax_id"`
	Industry    string `json:"industry"`
	Address     string `json:"address"`
	Status      string `json:"status"`
}

// 1. GetAllCompanies (ดึงข้อมูลบริษัททั้งหมด - สำหรับ Superadmin)
func GetAllCompanies() ([]models.Company, error) {
	var companies []models.Company
	if err := database.DB.Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}

// 2. GetCompanyByID (ดึงข้อมูลเฉพาะบริษัท - สำหรับ Superadmin หรือ Admin ที่เป็นเจ้าของ)
func GetCompanyByID(companyID uint, userID uint, role string) (*models.Company, error) {
	var company models.Company

	if err := database.DB.First(&company, companyID).Error; err != nil {
		return nil, errors.New("company_not_found")
	}

	// เช็คสิทธิ์ความเป็นเจ้าของ: ถ้าเป็น admin ต้องเป็นเจ้าของบริษัทนี้เท่านั้นถึงจะดูได้
	if role == "admin" && company.UserID != userID {
		return nil, errors.New("unauthorized_action")
	}

	return &company, nil
}

// 3. UpdateCompany (แก้ไขข้อมูลบริษัท)
func UpdateCompany(companyID uint, userID uint, role string, input CompanyUpdateInput) (*models.Company, error) {
	var company models.Company

	// ค้นหาบริษัทก่อน
	if err := database.DB.First(&company, companyID).Error; err != nil {
		return nil, errors.New("company_not_found")
	}

	// เช็คสิทธิ์ความเป็นเจ้าของ: ถ้าเป็น admin ต้องเป็นเจ้าของบริษัทนี้เท่านั้นถึงจะแก้ได้
	if role == "admin" && company.UserID != userID {
		return nil, errors.New("unauthorized_action")
	}

	// อัปเดตข้อมูล (แก้ไขเฉพาะฟิลด์ที่มีการส่งค่ามา)
	if input.CompanyName != "" {
		company.CompanyName = input.CompanyName
	}
	if input.TaxID != "" {
		company.TaxID = input.TaxID
	}
	if input.Industry != "" {
		company.Industry = input.Industry
	}
	if input.Address != "" {
		company.Address = input.Address
	}
	if input.Status != "" {
		company.Status = input.Status
	}

	// บันทึกลงฐานข้อมูล
	if err := database.DB.Save(&company).Error; err != nil {
		return nil, err
	}

	return &company, nil
}