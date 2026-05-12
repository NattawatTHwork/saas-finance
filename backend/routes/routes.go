package routes

import (
	"github.com/gofiber/fiber/v2"

	"saas-finance-backend/controllers"
	"saas-finance-backend/middlewares"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api")

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

	// กลุ่ม Packages (ต้องมี Token)
	packageGroup := api.Group("/packages", middlewares.Protected())

	// API สำหรับ Admin: ซื้อแพ็คเกจ
	packageGroup.Post("/subscribe", middlewares.RequireRoles("admin"), controllers.SubscribePackage)

	// API สำหรับ Superadmin: ยกเลิกแพ็คเกจของลูกค้า (อ้างอิงจาก ID ของ Transaction)
	packageGroup.Put("/transactions/:id/cancel", middlewares.RequireRoles("superadmin"), controllers.CancelPackage)

	// กลุ่ม Transactions (ต้องล็อกอิน -> ต้องเป็น admin/assistant -> ต้องมีแพ็คเกจที่ยังไม่หมดอายุ)
	transactionGroup := api.Group("/transactions",
		middlewares.Protected(),
		middlewares.RequireRoles("admin", "assistant"),
		middlewares.RequireActivePackage(), // 📌 ใส่ยามตรวจสอบแพ็คเกจเพิ่มตรงนี้
	)

	transactionGroup.Post("/", controllers.CreateTransaction)
	transactionGroup.Get("/", controllers.GetTransactions)
	transactionGroup.Get("/:id", controllers.GetTransaction)
	transactionGroup.Put("/:id", controllers.UpdateTransaction)
	transactionGroup.Delete("/:id", controllers.DeleteTransaction)

	// กลุ่ม Companies (ต้องมี Token)
	companyGroup := api.Group("/companies", middlewares.Protected())

	// Superadmin เท่านั้นที่ดูทั้งหมดได้
	companyGroup.Get("/", middlewares.RequireRoles("superadmin"), controllers.GetAllCompanies)

	// Superadmin หรือ Admin สามารถดูและแก้ไขได้ (แต่ Admin จะถูกกรองใน Service ว่าต้องเป็นบริษัทตัวเอง)
	companyGroup.Get("/:id", middlewares.RequireRoles("superadmin", "admin"), controllers.GetCompany)
	companyGroup.Put("/:id", middlewares.RequireRoles("superadmin", "admin"), controllers.UpdateCompany)

	// Category Group (เฉพาะ Superadmin เท่านั้น)
	categoryGroup := api.Group("/categories", middlewares.Protected(), middlewares.RequireRoles("superadmin"))

	categoryGroup.Get("/", controllers.GetAllCategories)     // อ่านทั้งหมด
	categoryGroup.Post("/", controllers.CreateCategory)      // เพิ่มหมวดหมู่
	categoryGroup.Delete("/:id", controllers.DeleteCategory) // ลบหมวดหมู่
}
