package middlewares

import (
	"github.com/gofiber/fiber/v2"
)

// RequireRoles เป็น Middleware สำหรับเช็คสิทธิ์ (Role)
func RequireRoles(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ดึง Role จากที่ auth_middleware แปะไว้ให้ใน Locals
		userRole, ok := c.Locals("role").(string)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Unable to verify permissions",
			})
		}

		// ตรวจสอบว่า Role ของ User ตรงกับที่อนุญาตหรือไม่
		for _, role := range allowedRoles {
			if userRole == role {
				return c.Next() // ผ่าน
			}
		}

		// ถ้าไม่ตรงเลย ให้ปฏิเสธการเข้าถึง
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Access denied",
		})
	}
}