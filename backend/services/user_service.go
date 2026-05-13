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

// 🌟 CreateAssistant แก้ไขให้รองรับโครงสร้างใหม่
func CreateAssistant(input CreateAssistantInput, creatorRole string, creatorID uint) (*models.User, error) {
	// 1. เช็คอีเมลซ้ำ
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email_exists")
	}

	var managerID uint
	var companyID uint

	// 2. จัดการ Manager ID และ Company ID ตาม Role
	if creatorRole == "superadmin" {
		if input.CompanyID == 0 {
			return nil, errors.New("company_id_required")
		}
		companyID = input.CompanyID

		// 📌 หา Admin ที่เป็นเจ้าของบริษัทนี้ เพื่อเอา ID เขามาเป็น ManagerID
		var admin models.User
		if err := database.DB.Where("company_id = ? AND role = ?", companyID, "admin").First(&admin).Error; err != nil {
			return nil, errors.New("admin_not_found_for_company")
		}
		managerID = admin.ID

	} else if creatorRole == "admin" {
		managerID = creatorID
		
		// 📌 หา CompanyID จากตัว Admin ที่ล็อกอินอยู่
		var admin models.User
		if err := database.DB.First(&admin, creatorID).Error; err != nil || admin.CompanyID == nil {
			return nil, errors.New("admin_has_no_company")
		}
		companyID = *admin.CompanyID
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
		ManagerID:    &managerID,
		CompanyID:    &companyID, // 🌟 ยัด CompanyID ให้ Assistant ด้วย
		Status:       "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return nil, err
	}

	return &newUser, nil
}

// 🌟 CreateAssistantByAdmin แก้ไขให้รองรับโครงสร้างใหม่
func CreateAssistantByAdmin(email, password string, adminID uint) (*models.User, error) {
	db := database.DB

	// 1. เช็คว่า Email ซ้ำไหม
	var existingUser models.User
	if err := db.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email_exists")
	}

	// 2. เอา adminID ไปหาตัว Admin เพื่อดึง CompanyID
	var admin models.User
	if err := db.First(&admin, adminID).Error; err != nil || admin.CompanyID == nil {
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
		PasswordHash: string(hashedPassword),
		Role:         "assistant",
		ManagerID:    &adminID,
		CompanyID:    admin.CompanyID, // 🌟 ใส่ CompanyID ตาม Admin
		Status:       "active",
	}

	// 5. บันทึกลง Database
	if err := db.Create(&assistant).Error; err != nil {
		return nil, err
	}

	return &assistant, nil
}

// UpdateUserBySuperAdmin
func UpdateUserBySuperAdmin(userID uint, email, status string) (*models.User, error) {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user_not_found")
	}

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

// UpdateAssistantByAdmin
func UpdateAssistantByAdmin(adminID, assistantID uint, email, status string) (*models.User, error) {
	var assistant models.User
	if err := database.DB.First(&assistant, assistantID).Error; err != nil {
		return nil, errors.New("user_not_found")
	}

	if assistant.ManagerID == nil || *assistant.ManagerID != adminID {
		return nil, errors.New("unauthorized_manager")
	}

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

// ChangePassword
func ChangePassword(userID uint, oldPassword, newPassword string) error {
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return errors.New("user_not_found")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(oldPassword)); err != nil {
		return errors.New("invalid_old_password")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), 10)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return database.DB.Save(&user).Error
}

// GetUsersByRole
func GetUsersByRole(role string) ([]models.User, error) {
	var users []models.User
	query := database.DB.Model(&models.User{})

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if err := query.Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}

// GetAssistantsByAdmin
func GetAssistantsByAdmin(adminID uint) ([]models.User, error) {
	var assistants []models.User
	if err := database.DB.Where("role = ? AND manager_id = ?", "assistant", adminID).Find(&assistants).Error; err != nil {
		return nil, err
	}
	return assistants, nil
}

// DeleteUser
func DeleteUser(deleterID uint, deleterRole string, targetID uint) error {
	var target models.User
	if err := database.DB.First(&target, targetID).Error; err != nil {
		return errors.New("user_not_found")
	}

	if deleterRole == "superadmin" {
		if target.Email == "superadmin@financesaas.com" {
			return errors.New("cannot_delete_main_superadmin")
		}
	} else if deleterRole == "admin" {
		if target.Role != "assistant" {
			return errors.New("unauthorized_delete_role")
		}
		if target.ManagerID == nil || *target.ManagerID != deleterID {
			return errors.New("unauthorized_manager")
		}
	} else {
		return errors.New("unauthorized_role")
	}

	return database.DB.Delete(&target).Error
}