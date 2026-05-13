package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"`
	ManagerID    *uint          `json:"manager_id"`
	Manager      *User          `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	CompanyID    *uint          `json:"company_id"`
	Company      *Company       `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	Role         string         `gorm:"type:varchar(50);not null" json:"role"`
	Status       string         `gorm:"type:varchar(50);default:'active'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}