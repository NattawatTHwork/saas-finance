"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // State สำหรับเก็บข้อมูล
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State สำหรับ UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(""); // ล้าง error เมื่อเริ่มพิมพ์ใหม่
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 🌟 เรียกใช้ API URL จาก .env.local
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      // 1. เก็บ Token และข้อมูล User ลงใน Local Storage เพื่อเอาไปใช้ต่อในหน้าอื่นๆ
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // 2. ตรวจสอบ Role และ Redirect ไปยังหน้า Dashboard ที่ถูกต้อง
      const userRole = data.user.role;
      
      if (userRole === "superadmin") {
        router.push("/superadmin/dashboard");
      } else if (userRole === "admin") {
        router.push("/admin/dashboard");
      } else if (userRole === "assistant") {
        router.push("/assistant/dashboard");
      } else {
        // เผื่อกรณีฉุกเฉิน
        router.push("/dashboard");
      }

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
            ยินดีต้อนรับกลับเข้าสู่ระบบ
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            กรุณากรอกข้อมูลของคุณเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
              placeholder="name@company.com"
            />
          </div>

          {/* Password Input (Toggle-able) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <a href="#" className="text-sm text-gray-500 hover:text-black transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-black text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 focus:ring-4 focus:ring-gray-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-sm text-gray-600 mt-8">
          ยังไม่มีบัญชีใช่หรือไม่?{" "}
          <a href="/register" className="text-black font-medium hover:underline">
            สมัครสมาชิกที่นี่
          </a>
        </p>

      </div>
    </div>
  );
}