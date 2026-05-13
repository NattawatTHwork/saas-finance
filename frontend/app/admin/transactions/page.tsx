"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Edit2, Trash2, Loader2, X, Search, 
  Wallet, AlertTriangle, ArrowUpCircle, ArrowDownCircle, 
  Calendar, Lock, ChevronDown, Check
} from "lucide-react";

// 📌 Interfaces
interface Transaction {
  id: number;
  type: "income" | "expense";
  category_id: number;
  category_name: string;
  amount: number;
  transaction_date: string; 
  note: string;
}

interface Category {
  id: number;
  name: string;
  type?: "income" | "expense"; // 🌟 รองรับการแบ่งประเภทหมวดหมู่จาก API
}

function TransactionManagementContent() {
  const router = useRouter();

  // --- States สำหรับข้อมูล ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // 🌟 State สำหรับเช็คว่ามีแพ็คเกจหรือไม่
  const [hasActivePackage, setHasActivePackage] = useState<boolean>(false);

  // --- States สำหรับ Filter (เดือน / ปี) ---
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState("");

  // --- States สำหรับ Modal (เพิ่ม/แก้ไข) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    type: "income" as "income" | "expense",
    category_id: 0,
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    note: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  // 🌟 States สำหรับ Searchable Category Dropdown
  const [categorySearch, setCategorySearch] = useState("");
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const catDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/login");
        return;
      }

      try {
        const user = JSON.parse(storedUser);
        if (user.role !== "admin") {
          router.push("/login");
          return;
        }
        setIsAuthorized(true);

        await checkSubscriptionStatus();
        await Promise.all([fetchCategories(), fetchTransactions()]);
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  // ดักคลิกนอก Dropdown หมวดหมู่เพื่อปิด
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (catDropdownRef.current && !catDropdownRef.current.contains(event.target as Node)) {
        setIsCatDropdownOpen(false);
        const selected = categories.find(c => c.id === formData.category_id);
        if (selected) setCategorySearch(selected.name || "");
        else setCategorySearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [formData.category_id, categories]);

  const checkSubscriptionStatus = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseUrl}/companies/my-status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setHasActivePackage(data.is_active || false);
      } else {
        setHasActivePackage(false); 
      }
    } catch (error) {
      console.error("Failed to check subscription", error);
      setHasActivePackage(false); 
    }
  };

  const fetchCategories = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/categories`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/transactions`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      
      // 1. ดึง Array ของข้อมูลออกมาก่อน
      const rawTransactions = Array.isArray(data) ? data : data.transactions || [];
      
      // 2. 🌟 แมป (Map) ข้อมูล เพื่อดึงชื่อจาก Object category ออกมาไว้ข้างนอก
      const formattedTransactions = rawTransactions.map((tx: any) => ({
        ...tx,
        // ถ้ามี tx.category ให้ดึง name มาใช้ ถ้าไม่มีให้เว้นว่างไว้
        category_name: tx.category?.name || "ไม่ระบุหมวดหมู่" 
      }));

      // 3. นำข้อมูลที่จัดรูปแบบแล้วไปอัปเดต State
      setTransactions(formattedTransactions);
      
    } catch (error) {
      console.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasActivePackage) return; 
    if (!formData.category_id) {
      alert("กรุณาเลือกหมวดหมู่");
      return;
    }
    
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const url = editingTx ? `${baseUrl}/transactions/${editingTx.id}` : `${baseUrl}/transactions`;
      const method = editingTx ? "PUT" : "POST";

      const payload = {
        ...formData,
        category_id: Number(formData.category_id),
        amount: Number(formData.amount)
      };

      const res = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        fetchTransactions();
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
    if (!hasActivePackage) return;
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบรายการนี้?")) return;
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/transactions/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setTransactions(transactions.filter(t => t.id !== id));
      }
    } catch (error) {
      alert("ลบไม่สำเร็จ");
    }
  };

  const openModal = (tx: Transaction | null = null) => {
    if (!hasActivePackage) return; // ดักเผื่อลืม
    if (tx) {
      setEditingTx(tx);
      setFormData({
        type: tx.type,
        category_id: tx.category_id,
        amount: tx.amount.toString(),
        transaction_date: tx.transaction_date.split("T")[0],
        note: tx.note || ""
      });
      // 🌟 ใส่ Fallback ป้องกัน undefined ตอนเปิดแก้ไข
      setCategorySearch(tx.category_name || "");
    } else {
      setEditingTx(null);
      setFormData({
        type: "income",
        category_id: 0,
        amount: "",
        transaction_date: new Date().toISOString().split("T")[0],
        note: ""
      });
      setCategorySearch("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCatDropdownOpen(false);
  };

  // 🌟 ฟังก์ชันจัดการเมื่อเปลี่ยนประเภท (รายรับ/รายจ่าย)
  const handleTypeChange = (newType: "income" | "expense") => {
    setFormData({ ...formData, type: newType, category_id: 0 });
    setCategorySearch(""); // ล้างช่องค้นหาหมวดหมู่เพื่อบังคับให้เลือกใหม่
  };

  // 🌟 กรองหมวดหมู่ตาม Type และคำค้นหา (แก้ไข Error ตรงนี้แล้ว)
  const filteredCategoriesForDropdown = useMemo(() => {
    return categories.filter(c => {
      const isMatchType = c.type ? c.type === formData.type : true; 
      
      const safeName = c.name || "";
      const safeSearch = categorySearch || "";
      
      const isMatchSearch = safeName.toLowerCase().includes(safeSearch.toLowerCase());
      return isMatchType && isMatchSearch;
    });
  }, [categories, formData.type, categorySearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.transaction_date);
      const isMatchMonth = txDate.getMonth() + 1 === selectedMonth;
      const isMatchYear = txDate.getFullYear() === selectedYear;
      
      const searchLower = searchTerm.toLowerCase();
      const isMatchSearch = (t.note || "").toLowerCase().includes(searchLower) || 
                            (t.category_name || "").toLowerCase().includes(searchLower);

      return isMatchMonth && isMatchYear && isMatchSearch;
    }).sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  }, [transactions, selectedMonth, selectedYear, searchTerm]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
    });
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  const years = Array.from(new Array(5), (val, index) => currentDate.getFullYear() - index);

  if (!isAuthorized) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={40} /></div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      
      {!hasActivePackage && (
        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <Lock className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-bold text-amber-800">โหมดดูข้อมูลเท่านั้น (Read-Only Mode)</h3>
            <p className="text-sm text-amber-700 mt-1">
              บริษัทของคุณยังไม่มีแพ็คเกจที่ใช้งานอยู่ หรือแพ็คเกจหมดอายุแล้ว คุณสามารถดูประวัติการทำธุรกรรมได้ แต่จะไม่สามารถเพิ่ม แก้ไข หรือลบข้อมูลได้ กรุณาสมัครแพ็คเกจเพื่อใช้งานเต็มรูปแบบ
            </p>
            <button 
              onClick={() => router.push('/admin/subscription')}
              className="mt-3 text-sm font-semibold bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
            >
              ดูแพ็คเกจของเรา
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-black text-white rounded-xl">
            <Wallet size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ประวัติธุรกรรม</h1>
            <p className="text-sm text-gray-500">จัดการรายรับ-รายจ่ายของบริษัท</p>
          </div>
        </div>
        
        <button 
          onClick={() => openModal()}
          disabled={!hasActivePackage}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
            hasActivePackage 
              ? "bg-black text-white hover:bg-gray-800" 
              : "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
          }`}
        >
          <Plus size={20} />
          <span>เพิ่มรายการใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">รายรับเดือนนี้</p>
            <p className="text-2xl font-bold text-green-600">฿{summary.income.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600"><ArrowUpCircle size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">รายจ่ายเดือนนี้</p>
            <p className="text-2xl font-bold text-red-600">฿{summary.expense.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-full text-red-600"><ArrowDownCircle size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">ยอดคงเหลือ</p>
            <p className={`text-2xl font-bold ${summary.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              ฿{summary.balance.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-gray-100 rounded-full text-gray-700"><Wallet size={24} /></div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar size={20} className="text-gray-400" />
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-black text-sm"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i+1} value={i+1}>เดือน {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-black text-sm"
          >
            {years.map(y => <option key={y} value={y}>ปี {y}</option>)}
          </select>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" placeholder="ค้นหารายการ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:border-black outline-none"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">วันที่</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">รายการ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">หมวดหมู่</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">จำนวนเงิน</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center"><Loader2 className="animate-spin mx-auto text-gray-400" /></td></tr>
              ) : filteredTransactions.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">ไม่พบรายการในเดือนนี้</td></tr>
              ) : filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(tx.transaction_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{tx.note || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-xs border">{tx.category_name}</span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openModal(tx)} 
                        disabled={!hasActivePackage}
                        className={`p-1.5 rounded-lg transition-colors ${
                          hasActivePackage 
                            ? "text-gray-400 hover:text-blue-600 hover:bg-blue-50" 
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(tx.id)} 
                        disabled={!hasActivePackage}
                        className={`p-1.5 rounded-lg transition-colors ${
                          hasActivePackage 
                            ? "text-gray-400 hover:text-red-600 hover:bg-red-50" 
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && hasActivePackage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6">{editingTx ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher */}
              <div className="flex gap-4 mb-4">
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" className="peer sr-only" checked={formData.type === "income"} onChange={() => handleTypeChange("income")} />
                  <div className="text-center py-2 px-4 rounded-lg border-2 peer-checked:border-green-500 peer-checked:bg-green-50 text-gray-500 peer-checked:text-green-700 font-medium transition-all">รายรับ</div>
                </label>
                <label className="flex-1 cursor-pointer">
                  <input type="radio" name="type" className="peer sr-only" checked={formData.type === "expense"} onChange={() => handleTypeChange("expense")} />
                  <div className="text-center py-2 px-4 rounded-lg border-2 peer-checked:border-red-500 peer-checked:bg-red-50 text-gray-500 peer-checked:text-red-700 font-medium transition-all">รายจ่าย</div>
                </label>
              </div>

              {/* 🌟 Searchable Category Dropdown */}
              <div className="relative" ref={catDropdownRef}>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={categorySearch}
                    onChange={(e) => { setCategorySearch(e.target.value); setIsCatDropdownOpen(true); }}
                    onFocus={() => setIsCatDropdownOpen(true)}
                    placeholder={`ค้นหาหรือเลือกหมวดหมู่${formData.type === 'income' ? 'รายรับ' : 'รายจ่าย'}...`}
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none text-sm"
                    required={!formData.category_id}
                  />
                  <button type="button" onClick={() => setIsCatDropdownOpen(!isCatDropdownOpen)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronDown size={16} className={`transition-transform ${isCatDropdownOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {isCatDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCategoriesForDropdown.length === 0 ? (
                      <div className="p-3 text-center text-sm text-gray-500">ไม่พบหมวดหมู่ที่ตรงกัน</div>
                    ) : (
                      <ul className="py-1">
                        {filteredCategoriesForDropdown.map((cat) => (
                          <li
                            key={cat.id}
                            onClick={() => {
                              setFormData({ ...formData, category_id: cat.id });
                              setCategorySearch(cat.name || "");
                              setIsCatDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${formData.category_id === cat.id ? "bg-gray-50 font-medium" : "text-gray-700"}`}
                          >
                            <div className="flex items-center gap-2">{cat.name}</div>
                            {formData.category_id === cat.id && <Check size={14} className="text-black" />}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">จำนวนเงิน (฿)</label>
                  <input type="number" min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-black" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">วันที่</label>
                  <input type="date" value={formData.transaction_date} onChange={(e) => setFormData({...formData, transaction_date: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-black" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">รายละเอียด (Note)</label>
                <input type="text" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:border-black" placeholder="เช่น ค่าอาหาร, ขายสินค้า..." />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">ยกเลิก</button>
                <button type="submit" disabled={isSaving || !formData.category_id} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : "บันทึกรายการ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center"><Loader2 className="animate-spin inline" /> กำลังโหลด...</div>}>
      <TransactionManagementContent />
    </Suspense>
  );
}