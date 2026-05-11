package services

import (
	"errors"
	"time"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// โครงสร้างข้อมูลขาเข้าสำหรับสร้าง/แก้ไข Transaction
type TransactionInput struct {
	CompanyID       uint    `json:"company_id"`
	CategoryID      uint    `json:"category_id"`
	Amount          float64 `json:"amount"`
	TransactionDate string  `json:"transaction_date"` // รับเป็น string เช่น "2024-05-20"
	Note            string  `json:"note"`
	ReferenceNo     string  `json:"reference_no"`
	Status          string  `json:"status"`
}

// 1. Create Transaction (เพิ่มข้อมูล)
func CreateTransaction(userID uint, input TransactionInput) (*models.Transaction, error) {
	// แปลงวันที่จาก String เป็น time.Time
	parsedDate, err := time.Parse("2006-01-02", input.TransactionDate)
	if err != nil {
		parsedDate = time.Now() // ถ้าแปลงไม่ได้ให้ใช้วันที่ปัจจุบัน
	}

	tx := models.Transaction{
		CompanyID:       input.CompanyID,
		UserID:          userID,
		CategoryID:      input.CategoryID,
		Amount:          input.Amount,
		TransactionDate: parsedDate,
		Note:            input.Note,
		ReferenceNo:     input.ReferenceNo,
		Status:          input.Status,
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		return nil, err
	}

	return &tx, nil
}

// 2. Get All Transactions (อ่านข้อมูลทั้งหมดของบริษัท)
func GetTransactions(companyID uint) ([]models.Transaction, error) {
	var transactions []models.Transaction
	// Preload Category เพื่อให้แสดงชื่อหมวดหมู่มาด้วย
	if err := database.DB.Preload("Category").Where("company_id = ?", companyID).Find(&transactions).Error; err != nil {
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

	// อัปเดตข้อมูล (เฉพาะฟิลด์ที่ส่งมา)
	if input.CategoryID != 0 {
		transaction.CategoryID = input.CategoryID
	}
	if input.Amount != 0 {
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
		transaction.ReferenceNo = input.ReferenceNo
	}
	if input.Status != "" {
		transaction.Status = input.Status
	}

	if err := database.DB.Save(&transaction).Error; err != nil {
		return nil, err
	}

	return &transaction, nil
}

// 5. Delete Transaction (ลบข้อมูล - Soft Delete)
func DeleteTransaction(id uint) error {
	var transaction models.Transaction
	if err := database.DB.First(&transaction, id).Error; err != nil {
		return errors.New("transaction_not_found")
	}

	// GORM จะทำ Soft Delete ให้อัตโนมัติ เพราะเรามีฟิลด์ DeletedAt ใน Model
	if err := database.DB.Delete(&transaction).Error; err != nil {
		return err
	}

	return nil
}