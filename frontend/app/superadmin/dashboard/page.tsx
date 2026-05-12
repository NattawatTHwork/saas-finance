"use client";

import { Building2, CreditCard, Activity } from "lucide-react";

// สังเกตว่าโค้ดเหลือสั้นนิดเดียว เพราะ Layout จัดการ Sidebar และโครงสร้างให้หมดแล้ว
export default function SuperAdminDashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Superadmin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor your SaaS platform performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* การ์ดที่ 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Companies</p>
            <h3 className="text-2xl font-bold mt-2">142</h3>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg">
            <Building2 size={20} className="text-gray-600" />
          </div>
        </div>

        {/* การ์ดที่ 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
            <h3 className="text-2xl font-bold mt-2">128</h3>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <Activity size={20} className="text-green-600" />
          </div>
        </div>

        {/* การ์ดที่ 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
            <h3 className="text-2xl font-bold mt-2">฿185,000</h3>
          </div>
          <div className="p-2 bg-black rounded-lg">
            <CreditCard size={20} className="text-white" />
          </div>
        </div>
      </div>
    </>
  );
}