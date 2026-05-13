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

// CheckActiveSubscription ตรวจสอบว่าบริษัทของผู้ใช้ (หรือหัวหน้า) มีแพ็คเกจที่ใช้งานอยู่หรือไม่
func CheckActiveSubscription(userID uint, role string) (bool, error) {
	var ownerID uint

	if role == "admin" {
		ownerID = userID
	} else if role == "assistant" {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			return false, err
		}

		if user.ManagerID == nil || *user.ManagerID == 0 {
			return false, errors.New("assistant has no manager assigned")
		}
		ownerID = *user.ManagerID
	} else {
		return true, nil
	}

	var transaction models.PackageTransaction
	err := database.DB.Where("user_id = ? AND status = ? AND expired_at > NOW()", ownerID, "active").First(&transaction).Error
	
	if err != nil {
		return false, nil
	}

	return true, nil
}

// 1. GetAllCompanies
func GetAllCompanies() ([]models.Company, error) {
	var companies []models.Company
	if err := database.DB.Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}

// 2. GetCompanyByID (ดึงข้อมูลเฉพาะบริษัท - ปรับลอจิกการเช็คสิทธิ์ใหม่)
func GetCompanyByID(companyID uint, userID uint, role string) (*models.Company, error) {
	var company models.Company

	if err := database.DB.First(&company, companyID).Error; err != nil {
		return nil, errors.New("company_not_found")
	}

	// 🌟 เช็คสิทธิ์ใหม่: ถ้าเป็น admin ต้องเช็คว่า CompanyID ในตาราง User ของเขา ตรงกับบริษัทนี้ไหม
	if role == "admin" {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil || user.CompanyID == nil || *user.CompanyID != companyID {
			return nil, errors.New("unauthorized_action")
		}
	}

	return &company, nil
}

// 3. UpdateCompany (แก้ไขข้อมูลบริษัท - ปรับลอจิกการเช็คสิทธิ์ใหม่)
func UpdateCompany(companyID uint, userID uint, role string, input CompanyUpdateInput) (*models.Company, error) {
	var company models.Company

	if err := database.DB.First(&company, companyID).Error; err != nil {
		return nil, errors.New("company_not_found")
	}

	// 🌟 เช็คสิทธิ์ใหม่: เหมือนฟังก์ชันด้านบน
	if role == "admin" {
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil || user.CompanyID == nil || *user.CompanyID != companyID {
			return nil, errors.New("unauthorized_action")
		}
	}

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

	if err := database.DB.Save(&company).Error; err != nil {
		return nil, err
	}

	return &company, nil
}

// GetCompaniesSubscriptionReport (ปรับการหา Admin ของบริษัทใหม่)
func GetCompaniesSubscriptionReport() ([]map[string]interface{}, error) {
	var companies []models.Company
	// ❌ เอา Preload("User") ออก เพราะไม่มีความสัมพันธ์นั้นแล้ว
	if err := database.DB.Find(&companies).Error; err != nil {
		return nil, err
	}

	var report []map[string]interface{}

	for _, company := range companies {
		// 🌟 1. หาว่าใครคือ Admin ที่เป็นเจ้าของบริษัทนี้
		var admin models.User
		ownerEmail := "No Admin"
		var adminID uint = 0

		err := database.DB.Where("company_id = ? AND role = ?", company.ID, "admin").First(&admin).Error
		if err == nil {
			ownerEmail = admin.Email
			adminID = admin.ID
		}

		var packageName interface{} = nil
		var expiryDate interface{} = nil
		var transactionID interface{} = nil

		// 🌟 2. ถ้ามี Admin ให้เอา ID Admin ไปหา Transaction แพ็คเกจ
		if adminID != 0 {
			var transaction models.PackageTransaction
			err = database.DB.Preload("Package").
				Where("user_id = ? AND status = ?", adminID, "active").
				Order("created_at DESC").
				First(&transaction).Error

			if err == nil {
				packageName = transaction.Package.Name
				expiryDate = transaction.ExpiredAt 
				transactionID = transaction.ID
			}
		}

		report = append(report, map[string]interface{}{
			"id":             company.ID,
			"name":           company.CompanyName, 
			"owner_email":    ownerEmail, // 🌟 ใช้อีเมลที่ดึงมาใหม่
			"package_name":   packageName,
			"expiry_date":    expiryDate,
			"status":         company.Status,
			"transaction_id": transactionID,
		})
	}

	return report, nil
}