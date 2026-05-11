package models

import (
	"time"
	"gorm.io/gorm"
)

type Package struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Name         string         `gorm:"not null" json:"name"`
	Price        float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	BillingCycle string         `gorm:"type:varchar(50)" json:"billing_cycle"` // เช่น monthly, yearly
	Description  string         `gorm:"type:text" json:"description"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}