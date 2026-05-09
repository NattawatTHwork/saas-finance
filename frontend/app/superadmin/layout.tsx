'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { MenuItem } from '../../components/Sidebar';

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) router.push('/login');
    else if (role !== 'superadmin') {
      router.push('/login'); // ไม่ใช่ Superadmin เตะออก
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // เมนูเฉพาะ Superadmin
  const menus: MenuItem[] = [
    { label: 'ภาพรวมระบบ', href: '/superadmin/dashboard', icon: '📊' },
    { label: 'จัดการบริษัทลูกค้า', href: '/superadmin/companies', icon: '🏢' },
    { label: 'จัดการแพ็คเกจ', href: '/superadmin/packages', icon: '📦' },
  ];

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">กำลังตรวจสอบสิทธิ์...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      <Sidebar roleName="Super Admin" menuItems={menus} onLogout={handleLogout} isOpenMobile={isOpenMobile} setIsOpenMobile={setIsOpenMobile} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header (แสดงเฉพาะจอมือถือ) */}
        <header className="lg:hidden h-16 bg-white border-b flex items-center px-4 justify-between z-30">
          <h1 className="font-bold">System Admin</h1>
          <button onClick={() => setIsOpenMobile(true)} className="text-xl">🍔</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}