'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// กำหนดโครงสร้างเมนูที่จะรับเข้ามา
export type MenuItem = {
  label: string;
  href: string;
  icon?: string | React.ReactNode;
};

interface SidebarProps {
  roleName: string; // ชื่อที่จะแสดงใน Sidebar (เช่น "Super Admin")
  menuItems: MenuItem[]; // รับรายการเมนูมาจาก Layout
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (isOpen: boolean) => void;
}

export default function Sidebar({ roleName, menuItems, onLogout, isOpenMobile, setIsOpenMobile }: SidebarProps) {
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsDesktopOpen(false);
      else {
        setIsDesktopOpen(true);
        setIsOpenMobile(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setIsOpenMobile]);

  return (
    <>
      {isOpenMobile && <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpenMobile(false)} />}

      <aside className={`fixed lg:relative top-0 left-0 h-screen z-50 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none flex flex-col ${isOpenMobile ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'} ${isDesktopOpen ? 'lg:w-64' : 'lg:w-20'}`}>
        
        {/* Header โลโก้ */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">S</div>
            <h2 className={`text-xl font-bold tracking-tight whitespace-nowrap transition-opacity ${!isDesktopOpen && !isOpenMobile ? 'opacity-0 hidden lg:block' : 'opacity-100'}`}>
              Finance
            </h2>
          </div>
        </div>

        {/* เมนูนำทาง (รับค่า menuItems มาวนลูปสร้าง) */}
        <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item, idx) => {
            const isActive = pathname.startsWith(item.href); // เช็คว่ากำลังอยู่หน้านี้ไหม
            return (
              <Link 
                key={idx}
                href={item.href}
                onClick={() => setIsOpenMobile(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {item.icon && <span className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{item.icon}</span>}
                <span className={`${!isDesktopOpen && !isOpenMobile ? 'opacity-0 hidden lg:block' : 'opacity-100'}`}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* ผู้ใช้งาน & Logout */}
        <div className={`p-4 border-t border-gray-100 ${!isDesktopOpen && !isOpenMobile ? 'flex justify-center' : ''}`}>
          <div className={`mb-3 px-2 ${!isDesktopOpen && !isOpenMobile ? 'hidden' : 'block'}`}>
            <p className="text-xs text-gray-400">เข้าใช้งานโดย</p>
            <p className="text-sm font-medium text-gray-800">{roleName}</p>
          </div>
          <button onClick={onLogout} className={`flex items-center gap-3 w-full px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors ${!isDesktopOpen && !isOpenMobile ? 'justify-center' : ''}`}>
            <span className={`${!isDesktopOpen && !isOpenMobile ? 'hidden' : 'block'}`}>🚪 ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}