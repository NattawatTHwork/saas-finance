package models

import (
	"time"

	"gorm.io/gorm"
)

type Company struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CompanyName string         `gorm:"not null" json:"company_name"`
	TaxID       string         `gorm:"uniqueIndex" json:"tax_id"`
	Industry    string         `gorm:"type:varchar(100)" json:"industry"`
	Address     string         `gorm:"type:text" json:"address"`
	Status      string         `gorm:"type:varchar(50);default:'active'" json:"status"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}