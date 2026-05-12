"use client";

import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, Wallet, Users } from "lucide-react";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Company Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Financial summary for this month.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <h3 className="text-2xl font-bold">฿450,200</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <h3 className="text-2xl font-bold">฿120,400</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <Wallet size={18} className="text-black" />
            </div>
            <h3 className="text-2xl font-bold">฿329,800</h3>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-500">Team Members</p>
              <Users size={18} className="text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold">4</h3>
          </div>
        </div>

      </main>
    </div>
  );
}