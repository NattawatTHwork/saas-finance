package middlewares

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/database"
	"saas-finance-backend/models"
)

// RequireActivePackage ตรวจสอบว่าบริษัทมีแพ็คเกจที่ยังใช้งานได้หรือไม่
func RequireActivePackage() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. ดึง ID ของคนที่กำลังล็อกอิน
		userIDFloat, ok := c.Locals("user_id").(float64)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Unauthorized"})
		}
		userID := uint(userIDFloat)

		// 2. ค้นหาข้อมูล User จาก Database เพื่อเช็ค Role และ ManagerID
		var user models.User
		if err := database.DB.First(&user, userID).Error; err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User not found"})
		}

		// 3. หาว่าใครคือ "เจ้าของบริษัท" ตัวจริงที่จะต้องเป็นคนจ่ายเงินซื้อแพ็คเกจ
		var ownerID uint
		if user.Role == "admin" {
			ownerID = user.ID // ถ้าเป็น Admin ก็คือตัวเองเป็นเจ้าของ
		} else if user.Role == "assistant" && user.ManagerID != nil {
			ownerID = *user.ManagerID // ถ้าเป็นผู้ช่วย ให้เอา ID ของหัวหน้ามาเช็ค
		} else if user.Role == "superadmin" {
			return c.Next() // Superadmin ข้ามการเช็คแพ็คเกจไปได้เลย
		} else {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Invalid role for this action"})
		}

		// 4. ตรวจสอบว่า Owner มีแพ็คเกจที่ยังไม่หมดอายุหรือไม่
		var activePackageCount int64
		database.DB.Model(&models.PackageTransaction{}).
			Where("user_id = ? AND status = ? AND expired_at > ?", ownerID, "active", time.Now()).
			Count(&activePackageCount)

		// ถ้าไม่มีแพ็คเกจที่ Active เลย ให้บล็อกการทำงาน
		if activePackageCount == 0 {
			return c.Status(fiber.StatusPaymentRequired).JSON(fiber.Map{
				"error": "An active subscription is required to perform this action. Please subscribe to a package.",
			})
		}

		// ถ้ามีแพ็คเกจที่ใช้งานได้ ให้ผ่านไปทำงาน Controller ต่อได้
		return c.Next()
	}
}