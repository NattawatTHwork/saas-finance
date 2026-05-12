"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// ❌ เอาการ import Sidebar ออกไป
import { Eye, EyeOff, ShieldAlert, ArrowLeft } from "lucide-react";

export default function CreateSuperadminPage() {
  const router = useRouter();

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirm_password: "",
  });

  // State สำหรับจัดการ UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(false);

    // ตรวจสอบรหัสผ่านให้ตรงกัน
    if (formData.password !== formData.confirm_password) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    try {
      // ดึง Token ของ Superadmin ปัจจุบันเพื่อใช้ยืนยันสิทธิ์
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:8000/api/users/superadmin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: "superadmin"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create superadmin");
      }

      setSuccess(true);
      setFormData({ email: "", password: "", confirm_password: "" }); // ล้างฟอร์ม
      
      setTimeout(() => {
        router.push("/superadmin/dashboard");
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 📌 คืนค่าเฉพาะเนื้อหาล้วนๆ (ใช้ Fragment <> คลุม)
  return (
    <>
      {/* ปุ่มย้อนกลับ */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6 w-fit"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* ห่อเนื้อหาด้วย max-w-xl เพื่อไม่ให้ฟอร์มกว้างจนเกินไป */}
      <div className="max-w-xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Add New Superadmin</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create a new top-level administrator for the platform.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 items-start">
          <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-amber-800">High Privilege Level</h3>
            <p className="text-sm text-amber-700 mt-1">
              Users with the Superadmin role will have full access to all system settings, companies, and billing data. Please assign this role carefully.
            </p>
          </div>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
            Superadmin created successfully! Redirecting...
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-5">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="admin@platform.com"
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
                minLength={8}
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
                minLength={8}
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
              {isLoading ? "Creating..." : "Create Superadmin"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}