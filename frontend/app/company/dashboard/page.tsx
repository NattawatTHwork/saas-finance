'use client';

import { useEffect, useState } from 'react';

export default function CompanyDashboardPage() {
  const [companyName, setCompanyName] = useState('บริษัทของคุณ');

  // สมมติว่าดึงชื่อบริษัทมาจาก LocalStorage หรือ API (เดี๋ยวเราค่อยเชื่อม API จริงทีหลัง)
  useEffect(() => {
    // โค้ดสำหรับดึงข้อมูลสรุปจาก Backend จะมาอยู่ตรงนี้
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* ส่วนหัวข้อ (Header) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-2">
            ภาพรวมบริษัท (Overview)
          </h1>
          <p className="text-slate-500">
            ยินดีต้อนรับเข้าสู่ระบบจัดการของ <span className="font-semibold text-blue-600">{companyName}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm shadow-sm">
            📄 ออกรายงาน
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm">
            + เพิ่มพนักงาน
          </button>
        </div>
      </div>

      {/* การ์ดสรุปข้อมูล (Stat Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* การ์ดที่ 1: พนักงาน */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">
            👥
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">พนักงานทั้งหมด</p>
            <h3 className="text-2xl font-bold text-slate-800">12 <span className="text-sm font-normal text-slate-400">คน</span></h3>
          </div>
        </div>

        {/* การ์ดที่ 2: รายจ่ายเดือนนี้ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
            💸
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">รายจ่ายเดือนนี้</p>
            <h3 className="text-2xl font-bold text-slate-800">฿45,200</h3>
          </div>
        </div>

        {/* การ์ดที่ 3: รออนุมัติ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0">
            ⏳
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">รอตรวจสอบ/อนุมัติ</p>
            <h3 className="text-2xl font-bold text-slate-800">3 <span className="text-sm font-normal text-slate-400">รายการ</span></h3>
          </div>
        </div>
      </div>

      {/* ส่วนเนื้อหาด้านล่าง (ตารางกิจกรรมล่าสุด) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">พนักงานที่เพิ่มล่าสุด</h2>
          <button className="text-sm text-blue-600 font-medium hover:underline">ดูทั้งหมด</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-100">
                <th className="px-6 py-3 font-medium">อีเมล / ชื่อผู้ใช้</th>
                <th className="px-6 py-3 font-medium">ตำแหน่ง</th>
                <th className="px-6 py-3 font-medium">วันที่เพิ่ม</th>
                <th className="px-6 py-3 font-medium text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {/* ข้อมูลจำลอง (Mock Data) */}
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">somchai@company.com</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-medium">Employee</span></td>
                <td className="px-6 py-4 text-slate-500">09 พ.ค. 2026</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ใช้งานปกติ
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-800">account1@company.com</td>
                <td className="px-6 py-4"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">Accountant</span></td>
                <td className="px-6 py-4 text-slate-500">08 พ.ค. 2026</td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ใช้งานปกติ
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}