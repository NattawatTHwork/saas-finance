package models

import (
	"time"
)

type Company struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `json:"name"`
	PackageType string    `json:"package_type"` // 'basic', 'premium'
	CreatedAt   time.Time `json:"created_at"`
	Users       []User    `gorm:"foreignKey:CompanyID" json:"users,omitempty"`
}