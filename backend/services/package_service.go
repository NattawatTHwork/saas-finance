package services

import (
	"errors"
	"time"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// SubscribePackage จัดการการสมัครแพ็คเกจของ Admin
func SubscribePackage(userID uint, packageID uint) (*models.PackageTransaction, error) {
	var pkg models.Package
	if err := database.DB.First(&pkg, packageID).Error; err != nil {
		return nil, errors.New("package_not_found")
	}

	// 🌟 1. ป้องกันการซื้อซ้ำ ถ้ายังมีแพ็คเกจที่สถานะ Active และยังไม่หมดอายุ
	var activeCount int64
	database.DB.Model(&models.PackageTransaction{}).
		Where("user_id = ? AND status = ? AND expired_at > ?", userID, "active", time.Now()).
		Count(&activeCount)

	if activeCount > 0 {
		return nil, errors.New("you_already_have_an_active_subscription")
	}

	// 2. ตรวจสอบการสมัครซ้ำซ้อนสำหรับ Trial (7_days)
	if pkg.BillingCycle == "7_days" {
		var trialCount int64
		// ค้นหาว่า User นี้เคยสมัครแพ็คเกจที่มี BillingCycle เป็น "7_days" ไปแล้วหรือยัง
		database.DB.Table("package_transactions").
			Joins("JOIN packages ON packages.id = package_transactions.package_id").
			Where("package_transactions.user_id = ? AND packages.billing_cycle = ?", userID, "7_days").
			Count(&trialCount)

		// ถ้าเคยมีแล้ว ไม่อนุญาตให้สมัครซ้ำ
		if trialCount > 0 {
			return nil, errors.New("trial_already_used")
		}
	}

	// 3. คำนวณวันหมดอายุ (ExpiredAt) ตาม BillingCycle
	now := time.Now()
	var expiredAt time.Time

	switch pkg.BillingCycle {
	case "7_days":
		expiredAt = now.AddDate(0, 0, 7) // เพิ่ม 7 วัน
	case "monthly":
		expiredAt = now.AddDate(0, 1, 0) // เพิ่ม 1 เดือน
	case "yearly":
		expiredAt = now.AddDate(1, 0, 0) // เพิ่ม 1 ปี
	default:
		expiredAt = now.AddDate(0, 1, 0) // ค่าเริ่มต้น
	}

	// 4. สร้าง Transaction และบันทึกวันหมดอายุ
	transaction := models.PackageTransaction{
		PackageID:       pkg.ID,
		UserID:          userID,
		TransactionDate: now,
		Price:           pkg.Price,
		Discount:        0,
		PriceNet:        pkg.Price,
		Status:          "active",
		ExpiredAt:       expiredAt, // บันทึกวันหมดอายุลง Database
	}

	if err := database.DB.Create(&transaction).Error; err != nil {
		return nil, err
	}

	return &transaction, nil
}

// CancelPackage จัดการการยกเลิกแพ็คเกจโดย Superadmin
func CancelPackage(transactionID uint) (*models.PackageTransaction, error) {
	var transaction models.PackageTransaction

	// 1. ค้นหา Transaction จาก ID
	if err := database.DB.First(&transaction, transactionID).Error; err != nil {
		return nil, errors.New("transaction_not_found")
	}

	// 2. ตรวจสอบว่ายกเลิกไปแล้วหรือยัง
	if transaction.Status == "cancelled" {
		return nil, errors.New("already_cancelled")
	}

	// 3. เปลี่ยนสถานะเป็น cancelled
	transaction.Status = "cancelled"
	if err := database.DB.Save(&transaction).Error; err != nil {
		return nil, err
	}

	return &transaction, nil
}

// GetAllPackages - Service สำหรับดึงรายการแพ็คเกจทั้งหมดที่เปิดใช้งานอยู่
func GetAllPackages() ([]models.Package, error) {
	var packages []models.Package
	// ดึงเฉพาะแพ็คเกจที่มี IsActive = true
	if err := database.DB.Where("is_active = ?", true).Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

// GetAllPackagesAdmin - ดึงทุกแพ็คเกจ (รวม Inactive) สำหรับ Superadmin
func GetAllPackagesAdmin() ([]models.Package, error) {
	var packages []models.Package
	if err := database.DB.Find(&packages).Error; err != nil {
		return nil, err
	}
	return packages, nil
}

// CreatePackage - สร้างแพ็คเกจใหม่
func CreatePackage(pkg models.Package) (*models.Package, error) {
	if err := database.DB.Create(&pkg).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

// UpdatePackage - แก้ไขข้อมูลแพ็คเกจ
func UpdatePackage(id uint, input models.Package) (*models.Package, error) {
	var pkg models.Package
	if err := database.DB.First(&pkg, id).Error; err != nil {
		return nil, errors.New("package_not_found")
	}

	// อัปเดตฟิลด์ต่างๆ
	pkg.Name = input.Name
	pkg.Price = input.Price
	pkg.BillingCycle = input.BillingCycle
	pkg.Description = input.Description
	pkg.IsActive = input.IsActive

	if err := database.DB.Save(&pkg).Error; err != nil {
		return nil, err
	}
	return &pkg, nil
}

// DeletePackage - ลบแพ็คเกจ (Soft Delete)
func DeletePackage(id uint) error {
	var pkg models.Package
	if err := database.DB.First(&pkg, id).Error; err != nil {
		return errors.New("package_not_found")
	}
	return database.DB.Delete(&pkg).Error
}