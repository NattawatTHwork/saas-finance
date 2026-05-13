"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  TrendingUp, TrendingDown, Wallet, 
  Loader2, AlertTriangle, ArrowRight, PlusCircle 
} from "lucide-react";

export default function AssistantDashboard() {
  const router = useRouter();

  // --- States ---
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [hasActivePackage, setHasActivePackage] = useState(false);
  const [userEmail, setUserEmail] = useState("");
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
        if (user.role !== "assistant") {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);
        setUserEmail(user.email); // เก็บอีเมลไว้ทักทาย

        // 2. ดึงข้อมูลสถานะแพ็คเกจและธุรกรรมพร้อมกัน
        await Promise.all([
          fetchPackageStatus(),
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  // ชื่อเดือนภาษาไทยสำหรับแสดงผล
  const currentMonthName = new Date().toLocaleString('th-TH', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">ยินดีต้อนรับ, ผู้ช่วย</h1>
        <p className="text-sm text-gray-500 mt-1">
          {userEmail} • สรุปข้อมูลทางการเงินประจำเดือน {currentMonthName}
        </p>
      </div>

      {/* แจ้งเตือนเมื่อไม่มีแพ็คเกจ (แบบ Assistant) */}
      {!hasActivePackage && (
        <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-sm font-bold text-amber-800">บริษัทยังไม่มีแพ็คเกจที่เปิดใช้งาน</h3>
            <p className="text-sm text-amber-700 mt-1 mb-2">
              คุณกำลังอยู่ในโหมดดูข้อมูลเท่านั้น ไม่สามารถเพิ่ม แก้ไข หรือลบรายการธุรกรรมได้ในขณะนี้
            </p>
            <span className="inline-block text-xs font-bold text-amber-900 bg-amber-200/50 px-3 py-1.5 rounded-lg border border-amber-200">
              🔒 กรุณาติดต่อ Admin (เจ้าของบริษัท) เพื่อดำเนินการต่ออายุแพ็คเกจ
            </span>
          </div>
        </div>
      )}

      {/* กราฟ/ตัวเลขสรุป (ใช้ 3 คอลัมน์) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
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

      </div>

      {/* Quick Action สำหรับ Assistant */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">จัดการประวัติธุรกรรม</h2>
            <p className="text-sm text-gray-500">
              บันทึกรายรับ-รายจ่าย, ดูประวัติย้อนหลัง และจัดการข้อมูลทางการเงินของบริษัท
            </p>
          </div>
          <button 
            onClick={() => router.push('/assistant/transactions')}
            className="w-full md:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
          >
            <PlusCircle size={18} />
            จัดการธุรกรรม
          </button>
        </div>
      </div>

    </div>
  );
}