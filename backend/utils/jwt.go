package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(userId uint, role string, companyId *uint) (string, error) {
	claims := jwt.MapClaims{
		"user_id":    userId,
		"role":       role,
		"company_id": companyId,
		"exp":        time.Now().Add(time.Hour * 24).Unix(), // Token หมดอายุใน 24 ชม.
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}