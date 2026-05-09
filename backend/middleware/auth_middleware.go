package middleware

import (
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// 1. RequireAuth: ด่านตรวจว่า Login เข้ามาหรือยัง (มี Token ที่ถูกต้องไหม)
func RequireAuth(c *fiber.Ctx) error {
	// ดึง Token จาก Header ที่ชื่อว่า Authorization
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Missing Authorization header"})
	}

	// ตัดคำว่า "Bearer " ออก เพื่อเอาแค่ตัว Token เพียวๆ
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// ตรวจสอบความถูกต้องของ Token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Invalid or expired token"})
	}

	// แกะข้อมูลที่ฝังไว้ใน Token (User ID, Role, Company ID)
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"message": "Invalid token claims"})
	}

	// เก็บข้อมูลลงใน Context ของ Fiber เพื่อให้ส่งต่อไปใช้ใน Controller ได้
	c.Locals("user_id", claims["user_id"])
	c.Locals("role", claims["role"])
	c.Locals("company_id", claims["company_id"])

	// ผ่านด่าน! ให้ทำงานในฟังก์ชันถัดไปได้
	return c.Next()
}

// 2. RequireRoles: ด่านตรวจเฉพาะกลุ่ม (เช่น กำหนดให้เฉพาะ superadmin หรือ company_admin เข้าได้)
func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ดึง Role ของคนที่ Login มาจากด่านตรวจ RequireAuth
		userRole := c.Locals("role").(string)

		// วนลูปเช็คว่า Role ของผู้ใช้ ตรงกับที่อนุญาตหรือไม่
		for _, role := range allowedRoles {
			if role == userRole {
				return c.Next() // ถ้าตรงกัน ให้ผ่านได้
			}
		}

		// ถ้าไม่ตรงเลย ให้ปฏิเสธการเข้าถึง
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "Access denied. You don't have permission to access this route.",
		})
	}
}