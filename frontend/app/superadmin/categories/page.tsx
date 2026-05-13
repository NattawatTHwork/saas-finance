"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, X, Search, Tags } from "lucide-react";

// 🌟 1. เพิ่ม type ใน Interface
interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  created_at?: string;
}

function CategoryManagementContent() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isAuthorized, setIsAuthorized] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  // 🌟 2. เพิ่ม State สำหรับเก็บประเภท (ค่าเริ่มต้นเป็นรายรับ)
  const [categoryType, setCategoryType] = useState<"income" | "expense">("income");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
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
        fetchCategories();
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/categories`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        }
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?")) return;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/categories/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        const errorData = await res.json();
        alert(`ลบไม่สำเร็จ: ${errorData.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/categories`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        // 🌟 3. ส่ง type แนบไปด้วยตามที่ Backend ต้องการ
        body: JSON.stringify({ name: categoryName, type: categoryType }),
      });

      if (res.ok) {
        await fetchCategories();
        closeModal();
      } else {
        const data = await res.json();
        alert(`เพิ่มไม่สำเร็จ: ${data.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
  };

  const openAddModal = () => {
    setCategoryName("");
    setCategoryType("income"); // รีเซ็ตค่าตอนเปิด
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCategoryName("");
    setCategoryType("income");
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <Tags size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
            <p className="text-sm text-gray-500">จัดการหมวดหมู่รายรับ-รายจ่ายของระบบ</p>
          </div>
        </div>
        
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>เพิ่มหมวดหมู่</span>
        </button>
      </div>

      {/* DataTable Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อหมวดหมู่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            />
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            ทั้งหมด {filteredCategories.length} รายการ
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ชื่อหมวดหมู่</th>
                {/* 🌟 4. เพิ่มคอลัมน์ "ประเภท" ในตาราง */}
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภท</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-400">
                    ไม่พบข้อมูลหมวดหมู่
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors bg-white">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{category.name}</div>
                    </td>
                    {/* 🌟 5. แสดง Badge รายรับ/รายจ่าย */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-md ${
                        category.type === "income" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
                        {category.type === "income" ? "รายรับ" : "รายจ่าย"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900 mb-4">เพิ่มหมวดหมู่ใหม่</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* 🌟 6. เพิ่ม Type Switcher ให้เลือกว่าเป็นรายรับหรือรายจ่าย */}
              <div className="flex gap-4 mb-4">
                <label className="flex-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    className="peer sr-only" 
                    checked={categoryType === "income"} 
                    onChange={() => setCategoryType("income")} 
                  />
                  <div className="text-center py-2 px-4 rounded-lg border-2 peer-checked:border-green-500 peer-checked:bg-green-50 text-gray-500 peer-checked:text-green-700 font-medium transition-all">
                    รายรับ
                  </div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input 
                    type="radio" 
                    name="type" 
                    className="peer sr-only" 
                    checked={categoryType === "expense"} 
                    onChange={() => setCategoryType("expense")} 
                  />
                  <div className="text-center py-2 px-4 rounded-lg border-2 peer-checked:border-red-500 peer-checked:bg-red-50 text-gray-500 peer-checked:text-red-700 font-medium transition-all">
                    รายจ่าย
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหมวดหมู่</label>
                <input 
                  type="text" 
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="เช่น รายได้จากการขาย, ค่าเช่าที่พัก"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || !categoryName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "สร้างหมวดหมู่"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">กำลังโหลดหมวดหมู่...</div>}>
      <CategoryManagementContent />
    </Suspense>
  );
}