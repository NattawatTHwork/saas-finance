"use client";

import Sidebar from "@/components/Sidebar";
import { FileText, Clock, PlusCircle } from "lucide-react";

export default function AssistantDashboard() {
  return (
    <div className="flex h-screen w-full bg-gray-50 text-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Workspace</h1>
            <p className="text-sm text-gray-500 mt-1">Manage daily transactions and records.</p>
          </div>
          <button className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
            <PlusCircle size={16} />
            New Transaction
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <FileText size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Entries Today</p>
              <h3 className="text-xl font-bold mt-1">12 Transactions</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
              <Clock size={20} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <h3 className="text-xl font-bold mt-1">0 Pending</h3>
            </div>
          </div>
        </div>

        {/* Placeholder สำหรับตาราง */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="h-40 flex items-center justify-center text-sm text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            No recent transactions found.
          </div>
        </div>

      </main>
    </div>
  );
}