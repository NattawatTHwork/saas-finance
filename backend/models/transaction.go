package models

import (
	"time"

	"gorm.io/gorm"
)

type Transaction struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	CompanyID       uint           `gorm:"not null" json:"company_id"`
	Company         Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	UserID          uint           `gorm:"not null" json:"user_id"`
	User            User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CategoryID      uint           `gorm:"not null" json:"category_id"`
	Category        Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	
	// 🌟 1. เพิ่มฟิลด์ Type (จำเป็นมาก เพื่อแยกว่าเป็น income หรือ expense)
	Type            string         `gorm:"type:varchar(20);not null" json:"type"`
	
	Amount          float64        `gorm:"type:numeric(15,2);not null" json:"amount"`
	TransactionDate time.Time      `gorm:"not null" json:"transaction_date"`
	Note            string         `gorm:"type:text" json:"note"`
	
	// 🌟 2. เปลี่ยน ReferenceNo เป็น Pointer (*string) 
	// เพื่อให้เวลาเราไม่กรอกค่า มันจะเก็บเป็น NULL ในฐานข้อมูลแทนที่จะเป็น "" (String ว่าง)
	// การเก็บเป็น NULL จะไม่ทำให้ uniqueIndex ชนกันครับ
	ReferenceNo     *string        `gorm:"uniqueIndex;type:varchar(100)" json:"reference_no"`
	
	Status          string         `gorm:"type:varchar(50);default:'completed'" json:"status"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}