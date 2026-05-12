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

// CreateAssistantByAdmin - Service สำหรับสร้าง Assistant โดยหาบริษัทจากตาราง Company ด้วย adminID
func CreateAssistantByAdmin(email, password string, adminID uint) (*models.User, error) {
	db := database.DB

	// 1. เช็คว่า Email ซ้ำไหม
	var existingUser models.User
	if err := db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email_exists")
	}

	// 2. เอา adminID (user_id จาก token) ไปค้นหาในตาราง Company
	var company models.Company
	if err := db.Where("user_id = ?", adminID).First(&company).Error; err != nil {
		// 📌 ถ้า Error แสดงว่าหาไม่เจอ = คนนี้ไม่ใช่ Admin (เพราะถ้าเป็น Admin ต้องมีบริษัทเสมอ)
		return nil, errors.New("not_an_admin")
	}

	// 3. เข้ารหัสรหัสผ่าน
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	if err != nil {
		return nil, err
	}

	// 4. สร้างข้อมูล Assistant
	assistant := models.User{
		Email:        email,
		PasswordHash: string(hashedPassword), // 📌 ใช้ PasswordHash ให้ตรงกับ Model ล่าสุด
		Role:         "assistant",
		ManagerID:    &adminID, // 📌 เอา adminID มาเป็น Manager ให้ Assistant คนนี้
	}

	// 5. บันทึกลง Database
	if err := db.Create(&assistant).Error; err != nil {
		return nil, err
	}

	return &assistant, nil
}

// UpdateUserBySuperAdmin - Service สำหรับ Superadmin แก้ไข Email และ Status ของใครก็ได้
func UpdateUserBySuperAdmin(userID uint, email, status string) (*models.User, error) {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user_not_found")
	}

	// เช็คว่าถ้ามีการเปลี่ยน Email จะซ้ำกับคนอื่นไหม
	if email != "" && email != user.Email {
		var count int64
		database.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
		if count > 0 {
			return nil, errors.New("email_exists")
		}
		user.Email = email
	}

	if status != "" {
		user.Status = status
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// UpdateAssistantByAdmin - Service สำหรับ Admin แก้ไข Assistant ของตัวเอง
func UpdateAssistantByAdmin(adminID, assistantID uint, email, status string) (*models.User, error) {
	var assistant models.User
	if err := database.DB.First(&assistant, assistantID).Error; err != nil {
		return nil, errors.New("user_not_found")
	}

	// ตรวจสอบสิทธิ์: Assistant คนนี้ต้องมี ManagerID ตรงกับ adminID
	if assistant.ManagerID == nil || *assistant.ManagerID != adminID {
		return nil, errors.New("unauthorized_manager")
	}

	// เช็ค Email ซ้ำ
	if email != "" && email != assistant.Email {
		var count int64
		database.DB.Model(&models.User{}).Where("email = ?", email).Count(&count)
		if count > 0 {
			return nil, errors.New("email_exists")
		}
		assistant.Email = email
	}

	if status != "" {
		assistant.Status = status
	}

	if err := database.DB.Save(&assistant).Error; err != nil {
		return nil, err
	}

	return &assistant, nil
}

// ChangePassword - Service สำหรับเปลี่ยนรหัสผ่านของตนเอง
func ChangePassword(userID uint, oldPassword, newPassword string) error {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return errors.New("user_not_found")
	}

	// 1. ตรวจสอบรหัสผ่านเดิม
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("invalid_old_password")
	}

	// 2. เข้ารหัสรหัสผ่านใหม่
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		return err
	}

	// 3. บันทึกรหัสผ่านใหม่
	user.PasswordHash = string(hashedPassword)
	return database.DB.Save(&user).Error
}