"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, Package, Tags, Users, 
  Loader2, ArrowRight, LayoutDashboard,
  PlusCircle, BarChart3
} from "lucide-react";

export default function SuperadminDashboard() {
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [stats, setStats] = useState({
    totalCompanies: 0,
    totalPackages: 0,
    totalCategories: 0,
  });

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (user.role !== "superadmin") {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);

        // ดึงข้อมูลภาพรวมระบบพร้อมกัน
        await Promise.all([
          fetchCompanyCount(),
          fetchPackageCount(),
          fetchCategoryCount()
        ]);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const fetchCompanyCount = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/companies`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, totalCompanies: data.companies.length || 0 }));
      }
    } catch (error) {
      console.error("Failed to fetch companies count");
    }
  };

  const fetchPackageCount = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/packages/admin`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, totalPackages: data.length || 0 }));
      }
    } catch (error) {
      console.error("Failed to fetch packages count");
    }
  };

  const fetchCategoryCount = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/categories`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        const cats = Array.isArray(data) ? data : data.categories || [];
        setStats(prev => ({ ...prev, totalCategories: cats.length || 0 }));
      }
    } catch (error) {
      console.error("Failed to fetch categories count");
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">ระบบจัดการสูงสุด (Superadmin Dashboard)</h1>
        <p className="text-sm text-gray-500 mt-1">
          ภาพรวมและการจัดการโครงสร้างพื้นฐานของระบบ SaaS Finance ทั้งหมด
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card: บริษัททั้งหมด */}
        <div 
          onClick={() => router.push('/superadmin/companies')}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">บริษัทในระบบ</p>
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors text-blue-600">
              <Building2 size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</h3>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            ดูรายละเอียดบริษัททั้งหมด <ArrowRight size={12} />
          </p>
        </div>

        {/* Card: แพ็คเกจ */}
        <div 
          onClick={() => router.push('/superadmin/packages')}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">แพ็คเกจที่เปิดอยู่</p>
            <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors text-purple-600">
              <Package size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalPackages}</h3>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            จัดการแผนสมาชิก <ArrowRight size={12} />
          </p>
        </div>

        {/* Card: หมวดหมู่ */}
        <div 
          onClick={() => router.push('/superadmin/categories')}
          className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">หมวดหมู่ทั้งหมด</p>
            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors text-orange-600">
              <Tags size={20} />
            </div>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">{stats.totalCategories}</h3>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            ตั้งค่าหมวดหมู่รายรับ-รายจ่าย <ArrowRight size={12} />
          </p>
        </div>

      </div>

      {/* Quick Links Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* จัดการระบบ */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-2 font-bold text-gray-900">
            <LayoutDashboard size={18} /> ทางลัดการจัดการ
          </div>
          <div className="p-2">
            <button 
              onClick={() => router.push('/superadmin/packages')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-md group-hover:bg-black group-hover:text-white transition-colors">
                  <PlusCircle size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">สร้างแพ็คเกจใหม่</p>
                  <p className="text-xs text-gray-500">เพิ่มแผนการสมัครสมาชิกสำหรับลูกค้า</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>

            <button 
              onClick={() => router.push('/superadmin/categories')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-md group-hover:bg-black group-hover:text-white transition-colors">
                  <PlusCircle size={18} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">สร้างหมวดหมู่ใหม่</p>
                  <p className="text-xs text-gray-500">เพิ่มประเภทรายรับ-รายจ่ายส่วนกลาง</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>
          </div>
        </div>

        {/* รายงานระบบ */}
        <div className="bg-black text-white rounded-xl shadow-lg p-8 flex flex-col justify-between relative overflow-hidden group">
          <BarChart3 className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 group-hover:text-white/10 transition-all" />
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-2 text-white">รายงานการสมัครสมาชิก</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              ตรวจสอบสถานะการใช้งานแพ็คเกจของทุกบริษัทในระบบ เพื่อดูแนวโน้มและการเติบโตของธุรกิจคุณ
            </p>
          </div>
          <button 
            onClick={() => router.push('/superadmin/companies')}
            className="relative z-10 w-fit flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-100 transition-colors"
          >
            ไปหน้า Report <ArrowRight size={18} />
          </button>
        </div>

      </div>

    </div>
  );
}