package models

import (
	"time"
)

type User struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	CompanyID    *uint     `json:"company_id"` // ใส่ * เพื่อให้เป็น NULL ได้ (สำหรับ Superadmin)
	Email        string    `gorm:"unique;not null" json:"email"`
	PasswordHash string    `json:"-"` // ใส่ "-" เพื่อไม่ให้ส่ง Password กลับไปใน JSON API
	Role         string    `json:"role"` // 'superadmin', 'company_admin', 'employee', 'accountant'
	CreatedAt    time.Time `json:"created_at"`
	Company      Company   `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
}