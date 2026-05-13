package services

import (
	"errors"
	"time"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// โครงสร้างข้อมูลขาเข้าสำหรับสร้าง/แก้ไข Transaction
type TransactionInput struct {
	Type            string  `json:"type"`
	CategoryID      uint    `json:"category_id"`
	Amount          float64 `json:"amount"`
	TransactionDate string  `json:"transaction_date"` // รับเป็น string เช่น "2024-05-20"
	Note            string  `json:"note"`
	ReferenceNo     string  `json:"reference_no"`
	Status          string  `json:"status"`
}

// 1. Create Transaction (เพิ่มข้อมูล)
func CreateTransaction(userID uint, input TransactionInput) (*models.Transaction, error) {
	// 1. ดึงข้อมูล User เพื่อหา CompanyID อัตโนมัติ
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, errors.New("user_not_found")
	}

	if user.CompanyID == nil || *user.CompanyID == 0 {
		return nil, errors.New("no_company_assigned")
	}

	// 2. แปลงวันที่จาก String เป็น time.Time
	parsedDate, err := time.Parse("2006-01-02", input.TransactionDate)
	if err != nil {
		parsedDate = time.Now() // ถ้าแปลงไม่ได้ให้ใช้วันที่ปัจจุบัน
	}

	// 3. จัดการ ReferenceNo ให้เป็น Pointer (ถ้าส่งมาว่างๆ ให้เป็น nil เพื่อไม่ให้ unique index error)
	var refNo *string
	if input.ReferenceNo != "" {
		refNo = &input.ReferenceNo
	}

	// กำหนดสถานะเริ่มต้นถ้าไม่ได้ส่งมา
	status := input.Status
	if status == "" {
		status = "completed"
	}

	// 4. สร้างรายการโดยใช้ CompanyID จากตัว User
	tx := models.Transaction{
		CompanyID:       *user.CompanyID,
		UserID:          userID,
		CategoryID:      input.CategoryID,
		Type:            input.Type,
		Amount:          input.Amount,
		TransactionDate: parsedDate,
		Note:            input.Note,
		ReferenceNo:     refNo,
		Status:          status,
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		return nil, err
	}

	// โหลดข้อมูล Category กลับไปให้ Frontend ด้วย เพื่อใช้โชว์ชื่อหมวดหมู่ทันที
	database.DB.Preload("Category").First(&tx, tx.ID)

	return &tx, nil
}

// 2. Get All Transactions (อ่านข้อมูลทั้งหมดของบริษัทตัวเอง)
func GetTransactions(userID uint) ([]models.Transaction, error) {
	// หา CompanyID ของคนที่ล็อกอินมา
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return nil, err
	}
	
	if user.CompanyID == nil || *user.CompanyID == 0 {
		return []models.Transaction{}, nil // ถ้าไม่มีบริษัท ให้คืนค่าว่าง
	}

	var transactions []models.Transaction
	
	// Query เฉพาะข้อมูลของบริษัทตัวเอง พร้อมดึงข้อมูลหมวดหมู่ (Category) มาด้วย
	if err := database.DB.Preload("Category").
		Where("company_id = ?", *user.CompanyID).
		Order("transaction_date DESC, created_at DESC"). // เรียงลำดับวันที่ล่าสุดขึ้นก่อน
		Find(&transactions).Error; err != nil {
		return nil, err
	}
	
	return transactions, nil
}

// 3. Get Transaction by ID (อ่านเฉพาะ ID)
func GetTransactionByID(id uint) (*models.Transaction, error) {
	var transaction models.Transaction
	if err := database.DB.Preload("Category").First(&transaction, id).Error; err != nil {
		return nil, errors.New("transaction_not_found")
	}
	return &transaction, nil
}

// 4. Update Transaction (แก้ไขข้อมูล)
func UpdateTransaction(id uint, input TransactionInput) (*models.Transaction, error) {
	var transaction models.Transaction
	if err := database.DB.First(&transaction, id).Error; err != nil {
		return nil, errors.New("transaction_not_found")
	}

	// อัปเดตข้อมูล (แก้ไขเฉพาะฟิลด์ที่ส่งมา)
	if input.Type != "" {
		transaction.Type = input.Type
	}
	if input.CategoryID != 0 {
		transaction.CategoryID = input.CategoryID
	}
	if input.Amount > 0 { // ให้มั่นใจว่าไม่เผลออัปเดตเป็น 0 หากไม่ได้ส่งค่ามา
		transaction.Amount = input.Amount
	}
	if input.TransactionDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", input.TransactionDate); err == nil {
			transaction.TransactionDate = parsedDate
		}
	}
	if input.Note != "" {
		transaction.Note = input.Note
	}
	if input.ReferenceNo != "" {
		transaction.ReferenceNo = &input.ReferenceNo
	}
	if input.Status != "" {
		transaction.Status = input.Status
	}

	if err := database.DB.Save(&transaction).Error; err != nil {
		return nil, err
	}

	// โหลดข้อมูล Category กลับไปเผื่อกรณีที่มีการเปลี่ยนหมวดหมู่
	database.DB.Preload("Category").First(&transaction, transaction.ID)

	return &transaction, nil
}

// 5. Delete Transaction (ลบข้อมูล - Soft Delete)
func DeleteTransaction(id uint) error {
	var transaction models.Transaction
	if err := database.DB.First(&transaction, id).Error; err != nil {
		return errors.New("transaction_not_found")
	}

	// GORM จะทำ Soft Delete ให้อัตโนมัติ เพราะเรามีฟิลด์ DeletedAt ใน Model Transaction
	if err := database.DB.Delete(&transaction).Error; err != nil {
		return err
	}

	return nil
}