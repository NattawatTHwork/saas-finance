import Sidebar from "@/components/Sidebar";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      
      {/* 1. เรียกใช้ Sidebar เสมอสำหรับทุกหน้าของ Assistant */}
      <Sidebar />

      {/* 2. พื้นที่แสดงเนื้อหาหลักของหน้านั้นๆ */}
      <main className="flex-1 overflow-y-auto relative">
        {/* จัด Padding กันปุ่มเมนูทับบนมือถือ (pt-20) และจัดขอบเขตความกว้างให้อ่านง่าย */}
        <div className="p-4 pt-20 md:p-8 md:pt-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      
    </div>
  );
}