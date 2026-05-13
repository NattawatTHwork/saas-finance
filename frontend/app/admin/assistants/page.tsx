"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit2, Trash2, Loader2, X, Search, 
  ShieldCheck, ShieldAlert, User as UserIcon,
  Eye, EyeOff
} from "lucide-react";

interface Assistant {
  id: number;
  email: string;
  role: string;
  status: string;
}

function AdminAssistantManagement() {
  const router = useRouter();

  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- State สำหรับ Edit Modal ---
  const [editingUser, setEditingUser] = useState<Assistant | null>(null);
  const [editForm, setEditForm] = useState({ email: "", status: "" });
  const [isSaving, setIsSaving] = useState(false);

  // --- State สำหรับ Create Modal ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", confirm_password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }
      try {
        const user = JSON.parse(storedUser);
        // 🌟 บังคับว่าต้องเป็น admin เท่านั้น
        if (user.role !== "admin") {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);
        fetchAssistants();
      } catch (error) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // 🌟 ใช้ API /users/my-assistants สำหรับดึงข้อมูลลูกน้องตัวเอง
  const fetchAssistants = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/users/my-assistants`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setAssistants(data.users || []);
    } catch (error) {
      console.error("Failed to fetch assistants", error);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 ใช้ API /users/:id สำหรับลบ (สิทธิ์ admin ลบได้)
  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ช่วยรายนี้?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/users/${id}`, {
        method: "DELETE", 
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setAssistants(assistants.filter((u) => u.id !== id));
      else alert("ไม่สามารถลบผู้ใช้งานได้ หรือคุณไม่มีสิทธิ์");
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  // 🌟 ใช้ API /users/:id/assistant สำหรับแก้ไข
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/users/${editingUser.id}/assistant`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${localStorage.getItem("token")}`, 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ email: editForm.email, status: editForm.status }),
      });
      if (res.ok) {
        setAssistants(assistants.map((u) => u.id === editingUser.id ? { ...u, ...editForm } : u));
        setEditingUser(null);
      } else {
        const data = await res.json();
        alert(`แก้ไขไม่สำเร็จ: ${data.error}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
  };

  // 🌟 ใช้ API /users/assistantbyadmin สำหรับสร้างใหม่
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    if (createForm.password !== createForm.confirm_password) {
      setCreateError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsCreating(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // ไม่ต้องส่ง company_id เพราะ backend จัดการให้เอง!
      const payload = {
        email: createForm.email,
        password: createForm.password,
      };

      const res = await fetch(`${baseUrl}/users/assistantbyadmin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาดในการสร้างผู้ช่วย");

      setCreateForm({ email: "", password: "", confirm_password: "" });
      setIsCreateModalOpen(false);
      fetchAssistants();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (user: Assistant) => {
    setEditingUser(user);
    setEditForm({ email: user.email, status: user.status });
  };

  const filteredAssistants = useMemo(() => {
    return assistants.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.status.toLowerCase().includes(searchLower)
      );
    });
  }, [assistants, searchTerm]);

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={40} /></div>;
  }

  return (
    <div className="p-6 relative max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-xl shadow-sm">
            <UserIcon size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ช่วย</h1>
            <p className="text-sm text-gray-500">จัดการบัญชีผู้ช่วยสำหรับทำรายการบัญชีของบริษัท</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCreateModalOpen(true)} 
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>เพิ่มผู้ช่วยใหม่</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="ค้นหาด้วยอีเมล หรือสถานะ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">อีเมล</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">สิทธิ์การใช้งาน</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">สถานะ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : filteredAssistants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    {searchTerm ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` : "ยังไม่มีผู้ช่วยในบริษัทของคุณ"}
                  </td>
                </tr>
              ) : filteredAssistants.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors bg-white">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                      <UserIcon size={12} /> ผู้ช่วย (Assistant)
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'active' ? (
                      <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <ShieldCheck size={12} /> เปิดใช้งาน
                      </span>
                    ) : (
                      <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                        <ShieldAlert size={12} /> ปิดใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= CREATE MODAL ======================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-1">เพิ่มผู้ช่วยใหม่</h2>
            <p className="text-sm text-gray-500 mb-6">สร้างบัญชีสำหรับทีมงานเพื่อช่วยจัดการบัญชี</p>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input 
                  type="email" 
                  value={createForm.email} 
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" 
                  required 
                  placeholder="assistant@company.com" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={createForm.password} 
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})} 
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" 
                    required 
                    minLength={6} 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={18} /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={createForm.confirm_password} 
                    onChange={(e) => setCreateForm({...createForm, confirm_password: e.target.value})} 
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" 
                    required 
                    minLength={6} 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={18} /></button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : `สร้างบัญชีผู้ช่วย`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= EDIT MODAL ======================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-4">แก้ไขข้อมูลผู้ช่วย</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">อีเมล</label>
                <input 
                  type="email" 
                  value={editForm.email} 
                  onChange={(e) => setEditForm({...editForm, email: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">สถานะ</label>
                <select 
                  value={editForm.status} 
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white transition-all"
                >
                  <option value="active">เปิดใช้งาน</option>
                  <option value="inactive">ระงับการใช้งาน</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AssistantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={40} /></div>}>
      <AdminAssistantManagement />
    </Suspense>
  );
}