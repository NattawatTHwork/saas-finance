'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar, { MenuItem } from '../../components/Sidebar';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token) router.push('/login');
    else if (role !== 'company_admin') {
      router.push('/login'); // ไม่ใช่ Company Admin เตะออก
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  // เมนูเฉพาะ Admin บริษัท
  const menus: MenuItem[] = [
    { label: 'ภาพรวมบริษัท', href: '/company/dashboard', icon: '📈' },
    { label: 'จัดการพนักงาน', href: '/company/users', icon: '👥' },
    { label: 'บันทึกการเงิน', href: '/company/finance', icon: '💰' },
    { label: 'ตั้งค่าบริษัท', href: '/company/settings', icon: '⚙️' },
  ];

  if (isCheckingAuth) return <div className="min-h-screen flex items-center justify-center">กำลังตรวจสอบสิทธิ์...</div>;

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-800">
      <Sidebar roleName="Company Admin" menuItems={menus} onLogout={handleLogout} isOpenMobile={isOpenMobile} setIsOpenMobile={setIsOpenMobile} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b flex items-center px-4 justify-between z-30">
          <h1 className="font-bold">Company Admin</h1>
          <button onClick={() => setIsOpenMobile(true)} className="text-xl">🍔</button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}