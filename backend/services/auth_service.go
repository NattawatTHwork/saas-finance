package services

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// ข้อมูลที่ Service ต้องการเพื่อใช้สมัครสมาชิก
type RegisterInput struct {
	Email       string
	Password    string
	CompanyName string
}

// ผลลัพธ์ที่จะส่งกลับไปให้ Controller
type RegisterOutput struct {
	User    models.User
	Company models.Company
}

// 🌟 RegisterAdmin ทำหน้าที่จัดการ Business logic สำหรับการสมัครสมาชิก
func RegisterAdmin(input RegisterInput) (*RegisterOutput, error) {
	// 1. ตรวจสอบว่า Email นี้มีในระบบหรือยัง
	var count int64
	database.DB.Model(&models.User{}).Where("email = ?", input.Email).Count(&count)
	if count > 0 {
		return nil, errors.New("email_exists")
	}

	// 2. เข้ารหัสรหัสผ่าน (Hash Password)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// 3. เริ่ม Database Transaction
	tx := database.DB.Begin()

	// 🌟 สลับลำดับ: สร้าง Company ก่อน เพราะ User ต้องใช้ CompanyID
	newCompany := models.Company{
		CompanyName: input.CompanyName,
		Status:      "active",
	}

	if err := tx.Create(&newCompany).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 🌟 สร้าง User และเอา ID ของ Company ที่เพิ่งสร้างเสร็จมาใส่
	newUser := models.User{
		Email:        input.Email,
		PasswordHash: string(hashedPassword),
		Role:         "admin",
		Status:       "active",
		CompanyID:    &newCompany.ID, // 📌 ใส่ CompanyID ให้ตรงกับบริษัทที่เพิ่งสร้าง
	}

	if err := tx.Create(&newUser).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// 4. บันทึกข้อมูล (Commit)
	tx.Commit()

	// 5. ส่งคืนผลลัพธ์
	return &RegisterOutput{
		User:    newUser,
		Company: newCompany,
	}, nil
}

// ข้อมูลที่ Service ต้องการเพื่อใช้ Login
type LoginInput struct {
	Email    string
	Password string
}

// ผลลัพธ์ที่จะส่งกลับไป (Token และข้อมูล User)
type LoginOutput struct {
	Token string
	User  models.User
}

// Login ทำหน้าที่ตรวจสอบอีเมล รหัสผ่าน และออก JWT Token
func Login(input LoginInput) (*LoginOutput, error) {
	var user models.User

	// 1. ค้นหา User จาก Email
	if err := database.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		return nil, errors.New("invalid_credentials") // ไม่พบอีเมล
	}

	// 2. ตรวจสอบรหัสผ่านว่าตรงกันหรือไม่
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password))
	if err != nil {
		return nil, errors.New("invalid_credentials") // รหัสผ่านผิด
	}

	// 3. ตรวจสอบสถานะบัญชี (เช่น ถูกระงับหรือไม่)
	if user.Status != "active" {
		return nil, errors.New("account_inactive")
	}

	// 4. สร้าง JWT Token
	claims := jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 72).Unix(), // Token หมดอายุใน 72 ชั่วโมง
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// นำ JWT_SECRET จาก .env มาใช้เซ็น Token
	secretKey := os.Getenv("JWT_SECRET")
	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return nil, errors.New("failed_to_generate_token")
	}

	// 5. ส่งคืนผลลัพธ์
	return &LoginOutput{
		Token: tokenString,
		User:  user,
	}, nil
}