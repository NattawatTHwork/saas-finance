package routes

import (
    "saas-finance-backend/controllers"
    "saas-finance-backend/middleware"

    "github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
    api := app.Group("/api")

    // ---------------------------------------------------------
    // 1. เส้นทางสาธารณะ (Public Routes - ไม่ต้อง Login)
    // ---------------------------------------------------------
    auth := api.Group("/auth")
    auth.Post("/register-admin", controllers.RegisterCompanyAdmin)
    auth.Post("/login", controllers.Login)

    // ---------------------------------------------------------
    // 2. เส้นทางที่ต้อง Login ก่อนเข้าใช้งาน (Protected Routes)
    // ---------------------------------------------------------
    // ใส่ middleware.RequireAuth ไว้ตรงนี้ ทำให้ทุกเส้นทางภายใต้ตัวแปร protected ต้องมี Token
    protected := api.Group("/", middleware.RequireAuth)

    // --- โซนของ Superadmin เท่านั้น ---
    superadmin := protected.Group("/superadmin", middleware.RequireRoles("superadmin"))
    superadmin.Get("/dashboard", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"message": "Welcome Boss! This is Superadmin Dashboard."})
    })

    // --- โซนของ Admin บริษัท ---
    company := protected.Group("/company", middleware.RequireRoles("company_admin"))
    company.Get("/dashboard", func(c *fiber.Ctx) error {
        // ดึง company_id จาก Token มาใช้ประโยชน์ได้เลย
        companyID := c.Locals("company_id")
        return c.JSON(fiber.Map{
            "message": "Welcome Company Admin",
            "company_id": companyID,
        })
    })

    // 👇 เพิ่ม API จัดการพนักงาน 3 ตัวใหม่ ตรงนี้ได้เลยครับ 👇
    company.Post("/users", controllers.CreateCompanyUser)       // สร้างพนักงาน (ของเดิม)
    company.Get("/users", controllers.GetCompanyUsers)          // ดึงรายชื่อพนักงานทั้งหมด (ใหม่)
    company.Put("/users/:id", controllers.UpdateCompanyUser)    // แก้ไขข้อมูลพนักงาน (ใหม่)
    company.Delete("/users/:id", controllers.DeleteCompanyUser) // ลบพนักงาน (ใหม่)

    // --- โซนการเงิน (เข้าได้ทั้ง Admin, พนักงาน, นักบัญชี) ---
    finance := protected.Group("/finance", middleware.RequireRoles("company_admin", "accountant", "employee"))
    finance.Get("/records", func(c *fiber.Ctx) error {
        return c.JSON(fiber.Map{"message": "Here are the finance records."})
    })
}