"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation"; // 🌟 1. นำเข้า useRouter
import {
  Plus, Edit2, Trash2, Loader2, X, Search,
  Package as PkgIcon, CheckCircle2, XCircle,
  CreditCard, Info
} from "lucide-react";

interface Package {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
  is_active: boolean;
}

function PackageManagementContent() {
  const router = useRouter(); // 🌟 2. เรียกใช้งาน router

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 🌟 3. State สำหรับเช็คสิทธิ์
  const [isAuthorized, setIsAuthorized] = useState(false);

  // --- State สำหรับระบบ Modal (เพิ่ม/แก้ไข) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    billing_cycle: "monthly",
    description: "",
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 🌟 4. ฟังก์ชันตรวจสอบสิทธิ์ก่อนโหลดข้อมูล
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        // ถ้าไม่ใช่ superadmin ให้เตะกลับไปหน้า login
        if (user.role !== "superadmin") {
          router.push("/login");
          return;
        }

        // ถ้าผ่าน ให้เซ็ตสถานะและดึงข้อมูลแพ็คเกจ
        setIsAuthorized(true);
        fetchPackages();
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/packages/admin`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : data.packages || []);
    } catch (error) {
      console.error("Failed to fetch packages", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = editingPackage ? `${baseUrl}/packages/${editingPackage.id}` : `${baseUrl}/packages`;
      const method = editingPackage ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchPackages();
        closeModal();
      } else {
        const data = await res.json();
        alert(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบแพ็คเกจนี้?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/packages/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setPackages(packages.filter(p => p.id !== id));
      }
    } catch (error) {
      alert("ลบไม่สำเร็จ");
    }
  };

  const openModal = (pkg: Package | null = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        price: pkg.price,
        billing_cycle: pkg.billing_cycle,
        description: pkg.description,
        is_active: pkg.is_active
      });
    } else {
      setEditingPackage(null);
      setFormData({ name: "", price: 0, billing_cycle: "monthly", description: "", is_active: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPackage(null);
  };

  const filteredPackages = useMemo(() => {
    return packages.filter(p =>
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [packages, searchTerm]);

  // 🌟 5. ถ้ายืนยันสิทธิ์ยังไม่เสร็จ ให้โชว์หน้าโหลดป้องกันไม่ให้ UI กระพริบ
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-xl">
            <PkgIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการแพ็คเกจ</h1>
            <p className="text-sm text-gray-500">จัดการแผนสมาชิกทั้งหมดในระบบ</p>
          </div>
        </div>

        {/* 📌 ปุ่มเพิ่มแพ็คเกจ */}
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-all"
        >
          <Plus size={20} />
          <span>เพิ่มแพ็คเกจ</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาแพ็คเกจ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none"
        />
      </div>

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="animate-spin inline mr-2" /> กำลังโหลด...</div>
        ) : filteredPackages.map((pkg) => (
          <div key={pkg.id} className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${pkg.is_active ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}>
                  {pkg.is_active ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                  {pkg.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </span>

                {/* 📌 ปุ่มแก้ไขและลบภายใน Card */}
                <div className="flex gap-1">
                  <button onClick={() => openModal(pkg)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
              <div className="text-2xl font-black text-gray-900 mt-1">฿{pkg.price.toLocaleString()} <span className="text-xs font-normal text-gray-500">/ {pkg.billing_cycle === 'monthly' ? 'รายเดือน' : pkg.billing_cycle === 'yearly' ? 'รายปี' : '7 วัน'}</span></div>
              <p className="text-sm text-gray-600 mt-4 line-clamp-3">{pkg.description}</p>
            </div>
            <div className="p-4 bg-gray-50 border-t flex items-center gap-2 text-xs text-gray-500">
              <CreditCard size={14} /> รองรับการชำระเงินที่ปลอดภัย
            </div>
          </div>
        ))}
      </div>

      {/* 📌 Modal สำหรับเพิ่ม/แก้ไข */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={24} /></button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Info size={20} /> {editingPackage ? "แก้ไขแพ็คเกจ" : "เพิ่มแพ็คเกจใหม่"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อแพ็คเกจ</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ราคา (฿)</label>
                  <input
                    type="number"
                    // 🌟 เพิ่มเงื่อนไขเช็คว่าถ้าเป็น NaN ให้แสดงเป็นช่องว่าง "" แทน
                    value={Number.isNaN(formData.price) ? "" : formData.price}
                    onChange={(e) => {
                      // 🌟 ดักการเปลี่ยนแปลง ถ้าลบจนหมดให้เก็บค่า 0 หรือค่าว่างเพื่อไม่ให้พัง
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        price: val === "" ? ("" as any) : parseFloat(val)
                      });
                    }}
                    className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รอบบิล</label>
                  <select value={formData.billing_cycle} onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black bg-white">
                    <option value="monthly">รายเดือน</option>
                    <option value="yearly">รายปี</option>
                    <option value="7_days">ทดลองใช้ 7 วัน</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black resize-none" />
              </div>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg border">
                <input type="checkbox" id="is_active" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 accent-black" />
                <label htmlFor="is_active" className="text-sm font-medium cursor-pointer">เปิดใช้งาน (แสดงให้ลูกค้าเห็น)</label>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin inline" /> : "บันทึกข้อมูล"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PackagesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><Loader2 className="animate-spin inline" /> กำลังโหลด...</div>}>
      <PackageManagementContent />
    </Suspense>
  );
}