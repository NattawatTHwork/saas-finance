"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Plus, Edit2, Trash2, Loader2, X, Search, 
  ShieldCheck, ShieldAlert, Crown, Shield, User as UserIcon,
  Eye, EyeOff, Building2, ChevronDown, Check
} from "lucide-react";

interface User {
  id: number;
  email: string;
  role: string;
  status: string;
}

interface Company {
  id: number;
  company_name: string;
}

function UserManagementContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roleFilter = searchParams.get("role") || "admin";

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- State สำหรับ Edit Modal ---
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ email: "", status: "" });
  const [isSaving, setIsSaving] = useState(false);

  // --- State สำหรับ Create Modal (รวม Superadmin & Assistant) ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ email: "", password: "", confirm_password: "", company_id: 0 });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // --- State สำหรับ Dropdown เลือกบริษัท (เฉพาะ Assistant) ---
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        setCurrentUser(user);
        setIsAuthorized(true);
        fetchUsers();
      } catch (error) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [roleFilter, router]);

  // ดึงข้อมูลบริษัทเฉพาะเมื่อเปิด Modal สร้าง Assistant
  useEffect(() => {
    if (isCreateModalOpen && roleFilter === "assistant") {
      const fetchCompanies = async () => {
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL;
          const token = localStorage.getItem("token");
          const res = await fetch(`${baseUrl}/companies`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : data.companies || []);
          }
        } catch (err) {
          console.error("Failed to fetch companies:", err);
        }
      };
      fetchCompanies();
    }
  }, [isCreateModalOpen, roleFilter]);

  // ดักการคลิกนอก Dropdown เลือกบริษัท
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        if (selectedCompany) setCompanySearchQuery(selectedCompany.company_name);
        else setCompanySearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCompany]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const endpoint = roleFilter === "my-assistants" ? "/users/my-assistants" : `/users?role=${roleFilter}`;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/users/${id}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setUsers(users.filter((u) => u.id !== id));
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = currentUser?.role === "superadmin" ? `/users/${editingUser.id}/superadmin` : `/users/${editingUser.id}/assistant`;
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email: editForm.email, status: editForm.status }),
      });
      if (res.ok) {
        setUsers(users.map((u) => u.id === editingUser.id ? { ...u, ...editForm } : u));
        setEditingUser(null);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsSaving(false);
    }
  };

  // ฟังก์ชันจัดการการสร้างผู้ใช้ใหม่
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setIsCreating(true);

    if (createForm.password !== createForm.confirm_password) {
      setCreateError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsCreating(false);
      return;
    }

    if (roleFilter === "assistant" && !createForm.company_id) {
      setCreateError("กรุณาเลือกบริษัทสำหรับผู้ช่วยนี้");
      setIsCreating(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const endpoint = `/users/${roleFilter}`; 

      const payload: any = {
        email: createForm.email,
        password: createForm.password,
        role: roleFilter
      };

      if (roleFilter === "assistant") {
        payload.company_id = createForm.company_id;
      }

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `เกิดข้อผิดพลาดในการสร้าง ${roleFilter}`);

      alert(`สร้าง ${roleFilter} สำเร็จ!`);
      fetchUsers();
      closeCreateModal();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({ email: user.email, status: user.status });
  };

  // เปิด/ปิด Create Modal
  const openCreateModal = () => {
    setCreateForm({ email: "", password: "", confirm_password: "", company_id: 0 });
    setCompanySearchQuery("");
    setSelectedCompany(null);
    setCreateError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => setIsCreateModalOpen(false);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.status.toLowerCase().includes(searchLower)
      );
    });
  }, [users, searchTerm]);

  const filteredCompanies = companies.filter((company) => 
    (company?.company_name || "").toLowerCase().includes(companySearchQuery.toLowerCase())
  );

  const showAddButton = currentUser?.role === "superadmin" && roleFilter !== "admin";

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={40} /></div>;
  }

  return (
    <div className="p-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 capitalize">จัดการ {roleFilter === 'my-assistants' ? 'ผู้ช่วย (Assistants)' : roleFilter}</h1>
          <p className="text-sm text-gray-500">จัดการข้อมูลและสิทธิ์การใช้งานของผู้ใช้ในระบบ</p>
        </div>
        
        {showAddButton && (
          <button 
            onClick={openCreateModal} 
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shrink-0"
          >
            <Plus size={18} />
            <span className="capitalize">เพิ่ม {roleFilter}</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-gray-400" /></div>
            <input type="text" placeholder="ค้นหาด้วยอีเมล, สิทธิ์ หรือสถานะ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all" />
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
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                    {searchTerm ? `ไม่พบข้อมูลที่ตรงกับ "${searchTerm}"` : "ไม่พบข้อมูลผู้ใช้"}
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors bg-white">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.email}</td>
                  <td className="px-6 py-4">
                    {user.role === "superadmin" && <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 capitalize"><Crown size={12} /> {user.role}</span>}
                    {user.role === "admin" && <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 capitalize"><Shield size={12} /> {user.role}</span>}
                    {user.role === "assistant" && <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100 capitalize"><UserIcon size={12} /> {user.role}</span>}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'active' ? (
                      <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100 capitalize"><ShieldCheck size={12} /> เปิดใช้งาน</span>
                    ) : (
                      <span className="flex items-center w-fit gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 capitalize"><ShieldAlert size={12} /> ปิดใช้งาน</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= EDIT MODAL ======================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-4">แก้ไขผู้ใช้งาน</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1">อีเมล</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none" required /></div>
              <div><label className="block text-sm font-medium mb-1">สถานะ</label><select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none bg-white"><option value="active">เปิดใช้งาน</option><option value="inactive">ปิดใช้งาน</option></select></div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : "บันทึกข้อมูล"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= CREATE MODAL ======================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button onClick={closeCreateModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-1 capitalize">เพิ่ม {roleFilter} ใหม่</h2>
            <p className="text-sm text-gray-500 mb-6">
              {roleFilter === "superadmin" ? "สร้างผู้ดูแลระบบระดับสูงสุดใหม่" : "เพิ่มผู้ช่วยใหม่และกำหนดบริษัทที่รับผิดชอบ"}
            </p>

            {roleFilter === "superadmin" && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 items-start">
                <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Superadmin มีสิทธิ์การเข้าถึงการตั้งค่า บริษัท และข้อมูลการเรียกเก็บเงินทั้งหมดในระบบ โปรดกำหนดสิทธิ์ด้วยความระมัดระวัง
                </p>
              </div>
            )}

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-xs font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              
              {roleFilter === "assistant" && (
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">กำหนดบริษัทที่รับผิดชอบ</label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      value={companySearchQuery}
                      onChange={(e) => { setCompanySearchQuery(e.target.value); setIsDropdownOpen(true); }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="ค้นหาหรือเลือกบริษัท..."
                      className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
                    />
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredCompanies.length === 0 ? (
                        <div className="p-3 text-center text-sm text-gray-500">ไม่พบข้อมูลบริษัท</div>
                      ) : (
                        <ul className="py-1">
                          {filteredCompanies.map((company) => (
                            <li
                              key={company.id}
                              onClick={() => {
                                setSelectedCompany(company);
                                setCompanySearchQuery(company.company_name);
                                setCreateForm({ ...createForm, company_id: company.id });
                                setIsDropdownOpen(false);
                                setCreateError("");
                              }}
                              className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${selectedCompany?.id === company.id ? "bg-gray-50 font-medium" : "text-gray-700"}`}
                            >
                              <div className="flex items-center gap-2"><Building2 size={14} className="text-gray-400" />{company.company_name}</div>
                              {selectedCompany?.id === company.id && <Check size={14} className="text-black" />}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                <input type="email" value={createForm.email} onChange={(e) => setCreateForm({...createForm, email: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" required placeholder="example@domain.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={createForm.password} onChange={(e) => setCreateForm({...createForm, password: e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" required minLength={6} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                <div className="relative">
                  <input type={showConfirmPassword ? "text" : "password"} value={createForm.confirm_password} onChange={(e) => setCreateForm({...createForm, confirm_password: e.target.value})} className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm" required minLength={6} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><Eye size={16} /></button>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeCreateModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button type="submit" disabled={isCreating} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2">
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : `สร้างบัญชี`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div>กำลังโหลด...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}