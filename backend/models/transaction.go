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
	Amount          float64        `gorm:"type:numeric(15,2);not null" json:"amount"`
	TransactionDate time.Time      `gorm:"not null" json:"transaction_date"`
	Note            string         `gorm:"type:text" json:"note"`
	ReferenceNo     string         `gorm:"uniqueIndex;type:varchar(100)" json:"reference_no"`
	Status          string         `gorm:"type:varchar(50);default:'completed'" json:"status"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}