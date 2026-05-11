package services

import (
	"errors"

	"golang.org/x/crypto/bcrypt"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

type CreateSuperAdminInput struct {
	Email    string
	Password string
}

func CreateSuperAdmin(input CreateSuperAdminInput) (*models.User, error) {
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email_exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := models.User{
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Role:         "superadmin",
		Status:       "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return nil, err
	}

	return &newUser, nil
}

type CreateAssistantInput struct {
	Email     string
	Password  string
	CompanyID uint // อาจจะถูกส่งมาถ้าคนสร้างเป็น superadmin
}

func CreateAssistant(input CreateAssistantInput, creatorRole string, creatorID uint) (*models.User, error) {
	// 1. เช็คอีเมลซ้ำ
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email_exists")
	}

	var managerID uint

	// 2. จัดการ Manager ID ตามเงื่อนไขของคนสร้าง
	if creatorRole == "superadmin" {
		// ถ้าเป็น superadmin สร้าง ต้องมี company_id ส่งมา
		if input.CompanyID == 0 {
			return nil, errors.New("company_id_required")
		}

		// หาว่าบริษัทนี้ใครเป็นเจ้าของ (admin)
		var company models.Company
		if err := database.DB.First(&company, input.CompanyID).Error; err != nil {
			return nil, errors.New("company_not_found")
		}
		
		managerID = company.UserID // เอา UserID ของเจ้าของบริษัทมาเป็น ManagerID
	} else if creatorRole == "admin" {
		// ถ้า admin สร้างเอง เอา ID ของตัวเองเป็น ManagerID ได้เลย
		managerID = creatorID
	} else {
		return nil, errors.New("unauthorized_role")
	}

	// 3. สร้าง User assistant
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := models.User{
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Role:         "assistant",
		ManagerID:    &managerID, // ใส่ Pointer ของ ManagerID
		Status:       "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return nil, err
	}

	return &newUser, nil
}