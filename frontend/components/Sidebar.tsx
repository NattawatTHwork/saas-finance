"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, CreditCard, Users,
  Settings, ChevronDown, ChevronRight, LogOut,
  KeyRound, Wallet, Box, Tags, Menu, X
} from "lucide-react";

// 📌 1. แปลงเมนูเป็นภาษาไทย
const MENU_ITEMS = [
  {
    title: "แดชบอร์ด",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "assistant"],
  },
  {
    title: "จัดการบริษัท",
    path: "/superadmin/companies",
    icon: Building2,
    roles: ["superadmin"],
  },
  {
    title: "จัดการหมวดหมู่",
    path: "/superadmin/categories",
    icon: Tags,
    roles: ["superadmin"],
  },
  {
    title: "จัดการแพ็คเกจ",
    path: "/superadmin/packages",
    icon: Box,
    roles: ["superadmin"],
  },
  {
    title: "ประวัติธุรกรรม",
    path: "/admin/transactions",
    icon: Wallet,
    roles: ["admin"],
  },
  {
    title: "ประวัติธุรกรรม",
    path: "/assistant/transactions",
    icon: Wallet,
    roles: ["assistant"],
  },
  {
    title: "จัดการทีม",
    path: "/admin/assistants",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "แพ็คเกจการใช้งาน",
    path: "/admin/subscription",
    icon: CreditCard,
    roles: ["admin"],
  },
  {
    title: "จัดการผู้ใช้งาน",
    icon: Users,
    roles: ["superadmin"],
    subItems: [
      {
        title: "ผู้ดูแลระบบสูงสุด",
        path: "/superadmin/users?role=superadmin",
        roles: ["superadmin"],
      },
      {
        title: "ผู้ดูแลระบบ",
        path: "/superadmin/users?role=admin",
        roles: ["superadmin"],
      },
      {
        title: "ผู้ช่วย",
        path: "/superadmin/users?role=assistant",
        roles: ["superadmin"],
      },
    ]
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setIsMounted(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      router.push("/login"); 
    }
  }, [router]);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleSubMenu = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 hover:bg-gray-50 focus:outline-none"
      >
        <Menu size={20} />
      </button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-black rounded-md flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">SF</span>
            </div>
            <span className="text-gray-900 font-semibold text-lg tracking-tight">SaaS Finance</span>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenus.map((item) => {
            if (item.subItems) {
              const filteredSubItems = item.subItems.filter(sub => sub.roles.includes(user.role));
              if (filteredSubItems.length === 0) return null;

              const isOpen = openMenus[item.title];
              const isAnyChildActive = filteredSubItems.some(sub => pathname.startsWith(sub.path));

              return (
                <div key={item.title} className="flex flex-col space-y-1">
                  <button
                    onClick={() => toggleSubMenu(item.title)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isAnyChildActive
                        ? "bg-gray-50 text-black font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={isAnyChildActive ? "text-black" : "text-gray-500"} />
                      <span>{item.title}</span>
                    </div>
                    {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </button>

                  {isOpen && (
                    <div className="ml-7 flex flex-col space-y-1">
                      {filteredSubItems.map((sub) => {
                        const isSubActive = pathname === sub.path || pathname.startsWith(sub.path);
                        return (
                          <button
                            key={sub.title}
                            onClick={() => router.push(sub.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              isSubActive
                                ? "bg-gray-100 text-black font-medium"
                                : "text-gray-500 hover:bg-gray-50 hover:text-black"
                            }`}
                          >
                            <span>{sub.title}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // 📌 2. เปลี่ยนเงื่อนไขตรวจจับให้ตรงกับภาษาไทย
            const actualPath = item.title === "แดชบอร์ด" ? `/${user.role}/dashboard` : item.path;
            const isActive = pathname.startsWith(actualPath as string);

            return (
              <button
                key={item.title}
                onClick={() => router.push(actualPath as string)}
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

        <div className="border-t border-gray-100 p-3 bg-white">
          {isProfileOpen && (
            <div className="mb-2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden shadow-sm text-gray-900 absolute bottom-16 left-3 right-3">
              
              <button 
                onClick={() => {
                  setIsProfileOpen(false); 
                  router.push("/settings/password"); 
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors"
              >
                <KeyRound size={16} className="text-gray-500" />
                <span>เปลี่ยนรหัสผ่าน</span>
              </button>
              
              <div className="h-[1px] bg-gray-200 w-full"></div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} className="text-red-500" />
                <span>ออกจากระบบ</span>
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
              
              {/* 📌 3. เพิ่ม title เพื่อแสดง Tooltip เมื่อเอาเมาส์วาง */}
              <div className="flex flex-col items-start text-left truncate" title={user.email}>
                <span className="text-sm font-medium text-gray-900 truncate w-32">{user.email}</span>
                <span className="text-xs text-gray-500 capitalize">{user.role === 'superadmin' ? 'Superadmin' : user.role === 'admin' ? 'Admin' : 'Assistant'}</span>
              </div>
            </div>
            {isProfileOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
          </button>
        </div>
      </aside>
    </>
  );
}