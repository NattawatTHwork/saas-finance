"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, TrendingDown, Wallet, Users, 
  Loader2, AlertTriangle, ArrowRight 
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [teamCount, setTeamCount] = useState(0);
  const [stats, setStats] = useState({
    income: 0,
    expense: 0,
    balance: 0
  });

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // 1. ตรวจสอบสิทธิ์
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (user.role !== "admin") {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);

        // 2. ดึงข้อมูลทั้งหมดพร้อมกัน
        await Promise.all([
          fetchPackageStatus(),
          fetchTeamMembers(),
          fetchTransactions()
        ]);
      } catch (error) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  // ดึงสถานะแพ็คเกจ
  const fetchPackageStatus = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/companies/my-status`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasActivePackage(data.is_active || false);
      }
    } catch (error) {
      console.error("Failed to fetch package status");
    }
  };

  // ดึงจำนวนผู้ช่วย
  const fetchTeamMembers = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/users/my-assistants`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTeamCount(data.users ? data.users.length : 0);
      }
    } catch (error) {
      console.error("Failed to fetch team members");
    }
  };

  // ดึง Transaction เพื่อคำนวณยอดเดือนนี้
  const fetchTransactions = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/transactions`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        const transactions = Array.isArray(data) ? data : data.transactions || [];
        
        // คำนวณเฉพาะเดือนและปีปัจจุบัน
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach((tx: any) => {
          const txDate = new Date(tx.transaction_date);
          if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
            if (tx.type === "income") {
              totalIncome += tx.amount;
            } else if (tx.type === "expense") {
              totalExpense += tx.amount;
            }
          }
        });

        setStats({
          income: totalIncome,
          expense: totalExpense,
          balance: totalIncome - totalExpense
        });
      }
    } catch (error) {
      console.error("Failed to fetch transactions");
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  // ชื่อเดือนภาษาไทยสำหรับแสดงผล
  const currentMonthName = new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' });

  return (
    // 🌟 เปลี่ยนจาก Flex Sidebar มาเป็นแค่ Container ธรรมดา
    <div className="p-6 md:p-8 w-full">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">ภาพรวมบริษัท (Admin Dashboard)</h1>
        <p className="text-sm text-gray-500 mt-1">สรุปข้อมูลทางการเงินประจำเดือน {currentMonthName}</p>
      </div>

      {/* แจ้งเตือนเมื่อไม่มีแพ็คเกจ */}
      {!hasActivePackage && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
            <div>
              <h3 className="text-sm font-bold text-amber-800">บริษัทยังไม่มีแพ็คเกจที่เปิดใช้งาน</h3>
              <p className="text-sm text-amber-700 mt-1">
                คุณกำลังอยู่ในโหมดดูข้อมูลเท่านั้น กรุณาสมัครแพ็คเกจเพื่อใช้งานฟีเจอร์เพิ่ม/แก้ไขรายการ และเพิ่มผู้ช่วย
              </p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/admin/subscription')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            ดูแพ็คเกจ <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* กราฟ/ตัวเลขสรุป */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        
        {/* Card: รายรับ */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">รายรับรวมเดือนนี้</p>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp size={18} className="text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-green-600">
            ฿{stats.income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Card: รายจ่าย */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">รายจ่ายรวมเดือนนี้</p>
            <div className="p-2 bg-red-50 rounded-lg">
              <TrendingDown size={18} className="text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-red-600">
            ฿{stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Card: ยอดคงเหลือ */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">ยอดคงเหลือสุทธิ</p>
            <div className="p-2 bg-gray-50 rounded-lg">
              <Wallet size={18} className="text-gray-900" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            ฿{stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Card: ผู้ช่วยในทีม */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/admin/assistants')}>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm font-medium text-gray-500">ผู้ช่วยในทีม (คน)</p>
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users size={18} className="text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{teamCount}</h3>
        </div>

      </div>

    </div>
  );
}