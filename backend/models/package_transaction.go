package models

import (
	"gorm.io/gorm"
	"time"
)

type PackageTransaction struct {
	ID              uint           `gorm:"primaryKey" json:"id"`
	PackageID       uint           `gorm:"not null" json:"package_id"`
	Package         Package        `gorm:"foreignKey:PackageID" json:"package,omitempty"`
	UserID          uint           `gorm:"not null" json:"user_id"`
	User            User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	TransactionDate time.Time      `gorm:"not null" json:"transaction_date"`
	Price           float64        `gorm:"type:numeric(10,2);not null" json:"price"`
	Discount        float64        `gorm:"type:numeric(10,2);default:0" json:"discount"`
	PriceNet        float64        `gorm:"type:numeric(10,2);not null" json:"price_net"`
	Status          string         `gorm:"type:varchar(50);default:'active'" json:"status"`
	ExpiredAt       time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}
