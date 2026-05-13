"use client";

import { useState, useEffect, Suspense } from "react";
import { Check, ArrowRight, Loader2, Package as PkgIcon } from "lucide-react";

interface Package {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
}

function PublicPackagesContent() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        // 📌 เรียก API แบบ Public (ไม่ต้องส่ง Authorization Header)
        const res = await fetch(`${baseUrl}/packages`);
        const data = await res.json();
        setPackages(Array.isArray(data) ? data : data.packages || []);
      } catch (error) {
        console.error("Failed to fetch packages", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-gray-400 mb-4" size={40} />
        <p className="text-gray-500 font-medium">กำลังโหลดแพ็คเกจสุดพิเศษสำหรับคุณ...</p>
      </div>
    );
  }

  return (
    <div className="py-12 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">เลือกแผนที่ใช่สำหรับธุรกิจคุณ</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          เริ่มต้นจัดการการเงินอย่างมืออาชีพด้วยแพ็คเกจที่หลากหลาย ครอบคลุมทุกความต้องการ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div 
            key={pkg.id} 
            className="relative flex flex-col p-8 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
          >
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">฿{pkg.price.toLocaleString()}</span>
                <span className="text-gray-500 font-medium lowercase">/ {pkg.billing_cycle}</span>
              </div>
            </div>

            <div className="flex-1 space-y-4 mb-8">
              <p className="text-gray-600 text-sm leading-relaxed">
                {pkg.description || "เข้าถึงฟีเจอร์การจัดการการเงินและรายงานสรุปผลรายเดือน"}
              </p>
              
              {/* รายการฟีเจอร์จำลอง (สามารถปรับให้ดึงจาก DB ได้ในอนาคต) */}
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500 shrink-0" />
                  <span>บันทึกรายรับ-รายจ่ายไม่จำกัด</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500 shrink-0" />
                  <span>ระบบจัดการผู้ช่วย (Assistants)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-gray-600">
                  <Check size={18} className="text-green-500 shrink-0" />
                  <span>Dashboard สรุปผลแบบ Real-time</span>
                </li>
              </ul>
            </div>

            <button className="w-full py-4 px-6 rounded-xl bg-black text-white font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors group-hover:gap-3">
              เริ่มใช้งานตอนนี้
              <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
      
      {packages.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <PkgIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">ขณะนี้ยังไม่มีแพ็คเกจที่เปิดใช้งาน</p>
        </div>
      )}
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublicPackagesContent />
    </Suspense>
  );
}