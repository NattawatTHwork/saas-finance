"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, CreditCard, Users,
  Settings, ChevronDown, ChevronRight, LogOut,
  KeyRound, Wallet, Box, Tags, UserPlus, 
  Menu, X // 📌 1. เพิ่มไอคอน Menu และ X สำหรับมือถือ
} from "lucide-react";

const MENU_ITEMS = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "assistant"],
  },
  {
    title: "Companies",
    path: "/superadmin/companies",
    icon: Building2,
    roles: ["superadmin"],
  },
  {
    title: "Categories",
    path: "/superadmin/categories",
    icon: Tags,
    roles: ["superadmin"],
  },
  {
    title: "Packages",
    path: "/superadmin/packages",
    icon: Box,
    roles: ["superadmin"],
  },
  {
    title: "Transactions",
    path: "/admin/transactions",
    icon: Wallet,
    roles: ["admin", "assistant"],
  },
  {
    title: "Team Management",
    path: "/admin/team",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Subscription",
    path: "/admin/subscription",
    icon: CreditCard,
    roles: ["admin"],
  },
  {
    title: "Add Superadmin",               
    path: "/superadmin/create-superadmin", 
    icon: UserPlus,                        
    roles: ["superadmin"],                 
  },
  {
    title: "Add Assistant",               
    path: "/superadmin/create-assistant", 
    icon: UserPlus,                        
    roles: ["superadmin"],                 
  },
  {
    title: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["superadmin", "admin", "assistant"],
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 📌 2. State สำหรับควบคุมการเปิด/ปิด Sidebar บนมือถือ
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login"); 
    }
  }, [router]);

  // 📌 3. ปิด Sidebar อัตโนมัติเมื่อผู้ใช้คลิกเปลี่ยนหน้า (เฉพาะบนมือถือ)
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // โครง Sidebar เปล่าๆ ขณะกำลังโหลด
  if (!isMounted || !user) {
    return (
      <aside className="hidden md:flex w-64 h-screen bg-white border-r border-gray-200 flex-col flex-shrink-0 animate-pulse">
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 bg-gray-200 rounded-md mr-3"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
      </aside>
    );
  }

  const filteredMenus = MENU_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* 📌 4. ปุ่ม Hamburger (แสดงเฉพาะจอมือถือ) */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {/* 📌 5. ฉากหลังสีดำ (Overlay) เมื่อเปิดเมนูบนมือถือ */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* 📌 6. ตัว Sidebar: ซ่อนบนมือถือ(เลื่อนไปซ้าย) และแสดงถาวรบน Desktop */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* ส่วนหัว Sidebar */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-gray-900 font-semibold text-lg tracking-tight">SaaS Finance</span>
          </div>
          
          {/* ปุ่ม X สำหรับปิดเมนูบนมือถือ */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ส่วนเมนูหลัก */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenus.map((item) => {
            const actualPath = item.title === "Dashboard" ? `/${user.role}/dashboard` : item.path;
            const isActive = pathname.startsWith(actualPath);

            return (
              <button
                key={item.title}
                onClick={() => router.push(actualPath)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 text-black font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <item.icon size={18} className={isActive ? "text-black" : "text-gray-500"} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </nav>

        {/* ส่วนโปรไฟล์และออกจากระบบ */}
        <div className="border-t border-gray-100 p-3 bg-white">
          {isProfileOpen && (
            <div className="mb-2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm text-gray-900 absolute bottom-16 left-3 right-3">
              <button className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors">
                <KeyRound size={16} className="text-gray-500" />
                <span>Change Password</span>
              </button>
              <div className="h-[1px] bg-gray-200 w-full"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="text-red-500" />
                <span>Log out</span>
              </button>
            </div>
          )}

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors relative z-10"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-600">
                  {user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col items-start text-left truncate">
                <span className="text-sm font-medium text-gray-900 truncate w-32">{user.email}</span>
                <span className="text-xs text-gray-500 capitalize">{user.role}</span>
              </div>
            </div>
            {isProfileOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          </button>
        </div>
      </aside>
    </>
  );
}