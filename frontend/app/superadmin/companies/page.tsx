"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation"; // 🌟 1. นำเข้า useRouter
import { Building2, Search, Loader2, Ban, Calendar, ShieldCheck, ShieldAlert, Package as PkgIcon } from "lucide-react";

interface CompanyReport {
  id: number;
  name: string;
  owner_email: string;
  package_name: string | null;
  expiry_date: string | null;
  status: string;
  transaction_id: number | null;
}

function CompanyManagementContent() {
  const router = useRouter(); // 🌟 2. เรียกใช้งาน router

  const [companies, setCompanies] = useState<CompanyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 🌟 3. State สำหรับเช็คสิทธิ์
  const [isAuthorized, setIsAuthorized] = useState(false);

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
        
        // ถ้าผ่าน ให้เซ็ตสถานะและดึงข้อมูลบริษัท
        setIsAuthorized(true);
        fetchCompanies();
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/companies/subscriptions/report`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : data.companies || []);
    } catch (error) {
      console.error("Failed to fetch companies", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPackage = async (company: CompanyReport) => {
    if (!company.transaction_id) return;
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะยกเลิกแพ็คเกจ ${company.package_name} ของบริษัท ${company.name}?`)) return;

    setProcessingId(company.id);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/packages/transactions/${company.transaction_id}/cancel`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        alert("ยกเลิกแพ็คเกจเรียบร้อยแล้ว");
        fetchCompanies();
      } else {
        const err = await res.json();
        alert(`ผิดพลาด: ${err.error || "ไม่สามารถยกเลิกได้"}`);
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCompanies = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return companies.filter((c) =>
      (c.name || "").toLowerCase().includes(searchLower) ||
      (c.owner_email || "").toLowerCase().includes(searchLower) ||
      (c.package_name || "").toLowerCase().includes(searchLower)
    );
  }, [companies, searchTerm]);

  // 🌟 5. ถ้ายืนยันสิทธิ์ยังไม่เสร็จ ให้โชว์หน้าโหลดป้องกันไม่ให้ UI กระพริบ
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
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">สถานะแพ็คเกจบริษัท</h1>
            <p className="text-sm text-gray-500">ตรวจสอบสถานะการเป็นสมาชิกของบริษัทต่างๆ ในระบบ</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อบริษัท, อีเมล, หรือแพ็คเกจ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
            />
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            ทั้งหมด {filteredCompanies.length} บริษัท
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">บริษัทและเจ้าของ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">แพ็คเกจที่ใช้งาน</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">วันหมดอายุ</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center">
                    <Loader2 className="animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-400">ไม่พบข้อมูลบริษัท</td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors bg-white">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{company.name}</div>
                      <div className="text-xs text-gray-500">{company.owner_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {company.package_name && company.transaction_id ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                            <ShieldCheck size={12} /> ใช้งานอยู่
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-600 mt-1 font-medium">
                             <PkgIcon size={12} className="text-blue-500" />
                             {company.package_name}
                          </span>
                        </div>
                      ) : (
                        <span className="flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <ShieldAlert size={12} /> ไม่มีแพ็คเกจที่เปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {company.expiry_date 
                          ? new Date(company.expiry_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })
                          : <span className="text-gray-400 text-xs italic">-</span>
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {company.transaction_id && (
                        <button 
                          onClick={() => handleCancelPackage(company)}
                          disabled={processingId === company.id}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100 disabled:opacity-50"
                        >
                          {processingId === company.id ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                          ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">กำลังโหลด...</div>}>
      <CompanyManagementContent />
    </Suspense>
  );
}