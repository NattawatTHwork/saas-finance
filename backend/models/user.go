package models

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Email        string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"not null" json:"-"` // ใช้ "-" เพื่อไม่ให้ส่งรหัสผ่านกลับไปใน JSON
	ManagerID    *uint          `json:"manager_id"`        // เป็น Pointer (*uint) เพื่อให้เป็นค่า Null ได้ (กรณีไม่มีหัวหน้า)
	Manager      *User          `gorm:"foreignKey:ManagerID" json:"manager,omitempty"`
	Role         string         `gorm:"type:varchar(50);not null" json:"role"`
	Status       string         `gorm:"type:varchar(50);default:'active'" json:"status"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"` // ทำหน้าที่แทน is_deleted
}