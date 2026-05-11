package middlewares

import (
	"fmt"
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// Protected เป็น Middleware ตรวจสอบ JWT Token
func Protected() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. ดึงค่า Authorization จาก Header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing Authorization header",
			})
		}

		// 2. ตรวจสอบรูปแบบว่าต้องขึ้นต้นด้วย "Bearer "
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format (must be Bearer <token>)",
			})
		}

		tokenString := parts[1]
		secretKey := os.Getenv("JWT_SECRET")

		// 3. แกะและตรวจสอบความถูกต้องของ Token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// ตรวจสอบว่าใช้วิธีเข้ารหัสแบบ HMAC ตามที่เราสร้างไว้หรือไม่
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secretKey), nil
		})

		// กรณี Token หมดอายุ หรือไม่ถูกต้อง
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		// 4. ดึงข้อมูล (Claims) ออกมาและเก็บไว้ใน Fiber Context (c.Locals)
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// เก็บ user_id และ role ไว้ เพื่อให้ Controller ที่ทำงานต่อสามารถดึงไปใช้ได้
			c.Locals("user_id", claims["user_id"])
			c.Locals("role", claims["role"])
		} else {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// 5. ให้ทำงานใน Controller หรือ Middleware ตัวถัดไปได้
		return c.Next()
	}
}