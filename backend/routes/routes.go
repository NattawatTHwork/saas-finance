package routes

import (
	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/controllers"
	"saas-finance-backend/middlewares"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

	api.Get("/packages", controllers.GetAllPackages)

	// กลุ่ม Authentication (ไม่ต้องมี Token)
	authGroup := api.Group("/auth")
	authGroup.Post("/register", controllers.Register)
	authGroup.Post("/login", controllers.Login)

	// กลุ่ม Users (ต้องมี Token)
	userGroup := api.Group("/users", middlewares.Protected())
	userGroup.Post("/superadmin", middlewares.RequireRoles("superadmin"), controllers.CreateSuperAdmin)
	userGroup.Post("/assistant", middlewares.RequireRoles("superadmin"), controllers.CreateAssistant)
	userGroup.Post("/assistantbyadmin", middlewares.RequireRoles("admin"), controllers.CreateAssistantByAdmin)
	userGroup.Put("/password", controllers.ChangePassword)
	userGroup.Put("/:id/superadmin", middlewares.RequireRoles("superadmin"), controllers.UpdateUserBySuperAdmin)
	userGroup.Put("/:id/assistant", middlewares.RequireRoles("admin"), controllers.UpdateAssistantByAdmin)
	userGroup.Get("/", middlewares.RequireRoles("superadmin"), controllers.GetUsersByRole)
	userGroup.Get("/my-assistants", middlewares.RequireRoles("admin"), controllers.GetMyAssistants)
	userGroup.Delete("/:id", middlewares.RequireRoles("superadmin", "admin"), controllers.DeleteUser)

	// กลุ่ม Packages (ต้องมี Token)
	packageGroup := api.Group("/packages", middlewares.Protected())

	// API สำหรับ Admin: ซื้อแพ็คเกจ
	packageGroup.Post("/subscribe", middlewares.RequireRoles("admin"), controllers.SubscribePackage)

	// API สำหรับ Superadmin (จัดการแพ็คเกจแบบ CRUD)
	packageGroup.Get("/admin", middlewares.RequireRoles("superadmin"), controllers.GetAllPackagesAdmin)
	packageGroup.Post("/", middlewares.RequireRoles("superadmin"), controllers.CreatePackage)
	packageGroup.Put("/:id", middlewares.RequireRoles("superadmin"), controllers.UpdatePackage)
	packageGroup.Delete("/:id", middlewares.RequireRoles("superadmin"), controllers.DeletePackage)

	// API สำหรับ Superadmin: ยกเลิกแพ็คเกจของลูกค้า (อ้างอิงจาก ID ของ Transaction)
	packageGroup.Put("/transactions/:id/cancel", middlewares.RequireRoles("superadmin"), controllers.CancelPackage)

	// กลุ่ม Transactions (ต้องล็อกอิน -> ต้องเป็น admin/assistant -> ต้องมีแพ็คเกจที่ยังไม่หมดอายุ)
	transactionGroup := api.Group("/transactions",
		middlewares.Protected(),
		middlewares.RequireRoles("admin", "assistant"),
		middlewares.RequireActivePackage(),
	)

	transactionGroup.Post("/", controllers.CreateTransaction)
	transactionGroup.Get("/", controllers.GetTransactions)
	transactionGroup.Get("/:id", controllers.GetTransaction)
	transactionGroup.Put("/:id", controllers.UpdateTransaction)
	transactionGroup.Delete("/:id", controllers.DeleteTransaction)

	// กลุ่ม Companies (ต้องมี Token)
	companyGroup := api.Group("/companies", middlewares.Protected())

	// 🌟 API ใหม่: เช็คสถานะแพ็คเกจ (วางไว้ก่อน /:id เพื่อป้องกันการชนกัน)
	companyGroup.Get("/my-status", middlewares.RequireRoles("admin", "assistant"), controllers.GetMySubscriptionStatus)

	// Superadmin เท่านั้นที่ดูทั้งหมดได้
	companyGroup.Get("/", middlewares.RequireRoles("superadmin"), controllers.GetAllCompanies)

	// Superadmin หรือ Admin สามารถดูและแก้ไขได้
	companyGroup.Get("/:id", middlewares.RequireRoles("superadmin", "admin"), controllers.GetCompany)
	companyGroup.Put("/:id", middlewares.RequireRoles("superadmin", "admin"), controllers.UpdateCompany)
	
	// API สำหรับ Superadmin ดู Report ทั้งหมด
	companyGroup.Get("/subscriptions/report", middlewares.RequireRoles("superadmin"), controllers.GetCompaniesSubscriptionReport)

	// Category Group
	categoryGroup := api.Group("/categories", middlewares.Protected())

	// ให้ superadmin, admin และ assistant สามารถ "อ่าน" หมวดหมู่ได้
	categoryGroup.Get("/", middlewares.RequireRoles("superadmin", "admin", "assistant"), controllers.GetAllCategories)

	// ส่วนการ "เพิ่ม" และ "ลบ" ให้เฉพาะ superadmin ทำได้เท่านั้น
	categoryGroup.Post("/", middlewares.RequireRoles("superadmin"), controllers.CreateCategory)
	categoryGroup.Delete("/:id", middlewares.RequireRoles("superadmin"), controllers.DeleteCategory)
}