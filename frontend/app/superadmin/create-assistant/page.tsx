"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Search, Building2, ChevronDown, Check } from "lucide-react";

// 📌 1. แก้ไข Interface ให้ตรงกับที่ Backend ส่งมา
interface Company {
  id: number;
  company_name: string; 
}

export default function CreateAssistantPage() {
  const router = useRouter();

  // 1. State สำหรับจัดการฟอร์ม
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
    company_id: 0, 
  });

  // 2. State สำหรับระบบ Searchable Dropdown
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); 

  // 3. State ควบคุม UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ดึงข้อมูลบริษัททั้งหมดเมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:8000/api/companies", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCompanies(data.companies || data); 
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
      }
    };
    fetchCompanies();
  }, []);

  // ดักการคลิกพื้นที่อื่น (Click Outside) เพื่อปิด Dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        // 📌 2. แก้ตอนกดออก ให้ใช้ company_name
        if (selectedCompany) {
          setSearchQuery(selectedCompany.company_name);
        } else {
          setSearchQuery("");
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCompany]);

  // 📌 3. ฟังก์ชันกรองบริษัทแบบปลอดภัย (ป้องกัน undefined error)
  const filteredCompanies = companies.filter((company) => {
    const name = company?.company_name || ""; 
    const query = searchQuery || "";
    return name.toLowerCase().includes(query.toLowerCase());
  });

  // ฟังก์ชันเมื่อเลือกบริษัท
  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    // 📌 4. แสดงชื่อ company_name ในช่อง input
    setSearchQuery(company.company_name); 
    setFormData({ ...formData, company_id: company.id }); 
    setIsDropdownOpen(false);
    setError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    if (!formData.company_id) {
      setError("Please select a company for this assistant.");
      setIsLoading(false);
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const payload = {
        email: formData.email,
        password: formData.password,
        company_id: formData.company_id, 
      };

      const response = await fetch("http://localhost:8000/api/users/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create assistant");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/superadmin/dashboard"); 
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6 w-fit"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="max-w-xl">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Add New Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign a new assistant to a specific company.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            Assistant created successfully! Redirecting...
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
          
          {/* Searchable Select สำหรับบริษัท */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to Company
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true); 
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search or select a company..."
                className="w-full pl-10 pr-10 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all cursor-text"
              />
              
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={18} className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* รายการ Dropdown */}
            {isDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredCompanies.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No companies found.
                  </div>
                ) : (
                  <ul className="py-1">
                    {filteredCompanies.map((company) => (
                      <li
                        key={company.id}
                        onClick={() => handleSelectCompany(company)}
                        className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors ${
                          selectedCompany?.id === company.id 
                            ? "bg-gray-50 text-black font-medium" 
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-gray-400" />
                          {/* 📌 5. แสดงชื่อ company_name ในลิสต์ */}
                          <span>{company.company_name}</span>
                        </div>
                        {selectedCompany?.id === company.id && (
                          <Check size={16} className="text-black" />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assistant Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="assistant@thaicodelab.com"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-10 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-10 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating..." : "Create Assistant"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}