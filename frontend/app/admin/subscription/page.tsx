"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { 
  Package as PkgIcon, Loader2, CheckCircle2, 
  ShieldCheck, AlertCircle, ArrowRight, Lock
} from "lucide-react";

interface Package {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
  is_active: boolean;
}

function SubscriptionContent() {
  const router = useRouter();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // สถานะแพ็คเกจปัจจุบัน
  const [hasActivePackage, setHasActivePackage] = useState(false);
  
  // State สำหรับปุ่ม Loading ตอนกดสมัคร
  const [subscribingId, setSubscribingId] = useState<number | null>(null);

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

        // ดึงสถานะปัจจุบัน และรายการแพ็คเกจพร้อมกัน
        await Promise.all([
          checkCurrentStatus(),
          fetchPackages()
        ]);
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const checkCurrentStatus = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/companies/my-status`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHasActivePackage(data.is_active);
      }
    } catch (error) {
      console.error("Failed to check status");
    }
  };

  const fetchPackages = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      // เรียก API ตัว public ที่ดึงเฉพาะแพ็คเกจที่ is_active = true
      const res = await fetch(`${baseUrl}/packages`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch packages");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (pkg: Package) => {
    if (hasActivePackage) {
      alert("คุณมีแพ็คเกจที่กำลังใช้งานอยู่แล้ว");
      return;
    }

    if (!confirm(`คุณต้องการสมัครแพ็คเกจ "${pkg.name}" ใช่หรือไม่?\n(ระบบจะเริ่มใช้งานให้ทันที)`)) {
      return;
    }

    setSubscribingId(pkg.id);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${baseUrl}/packages/subscribe`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ package_id: pkg.id }),
      });

      if (res.ok) {
        alert("สมัครแพ็คเกจสำเร็จ! เริ่มต้นใช้งานได้ทันที");
        setHasActivePackage(true);
        // เด้งกลับไปหน้า Dashboard หรือ Transactions หลังจากสมัครเสร็จ
        router.push("/admin/dashboard");
      } else {
        const data = await res.json();
        // จัดการข้อความ Error ให้เป็นภาษาไทยอ่านง่าย
        if (data.error === "trial_already_used") {
          alert("คุณเคยใช้งานแพ็คเกจทดลองฟรีไปแล้ว");
        } else if (data.error === "you_already_have_an_active_subscription") {
          alert("คุณมีแพ็คเกจที่กำลังใช้งานอยู่แล้ว");
        } else {
          alert(`ไม่สามารถสมัครได้: ${data.error}`);
        }
      }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setSubscribingId(null);
    }
  };

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12 mt-8">
        <div className="inline-flex items-center justify-center p-3 bg-black text-white rounded-2xl mb-4 shadow-md">
          <PkgIcon size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
          เลือกแพ็คเกจที่เหมาะกับธุรกิจคุณ
        </h1>
        <p className="text-gray-500 text-base">
          ยกระดับการจัดการบัญชีรายรับ-รายจ่ายของบริษัทให้เป็นเรื่องง่าย ด้วยระบบของเรา
        </p>
      </div>

      {/* แจ้งเตือนกรณีมีแพ็คเกจอยู่แล้ว */}
      {hasActivePackage && (
        <div className="max-w-2xl mx-auto mb-10 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="text-sm font-bold text-green-800">คุณมีแพ็คเกจที่กำลังใช้งานอยู่</h3>
            <p className="text-sm text-green-700 mt-1">
              ปัจจุบันบริษัทของคุณสามารถใช้งานฟีเจอร์ต่างๆ ได้อย่างเต็มรูปแบบแล้ว หากต้องการเปลี่ยนแพ็คเกจ กรุณารอให้แพ็คเกจปัจจุบันหมดอายุ หรือติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      )}

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.length === 0 ? (
          <div className="col-span-full py-10 text-center text-gray-500 flex flex-col items-center">
            <AlertCircle size={40} className="mb-3 text-gray-300" />
            <p>ยังไม่มีแพ็คเกจที่เปิดให้บริการในขณะนี้</p>
          </div>
        ) : (
          packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col relative group"
            >
              {/* Badge สำหรับ Trial (ถ้ามี) */}
              {pkg.billing_cycle === "7_days" && (
                <div className="absolute top-0 right-0 bg-black text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                  แนะนำสำหรับผู้เริ่มต้น
                </div>
              )}

              <div className="p-8 flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-gray-900">
                    {pkg.price === 0 ? "ฟรี" : `฿${pkg.price.toLocaleString()}`}
                  </span>
                  {pkg.price > 0 && (
                    <span className="text-sm font-medium text-gray-500">
                      / {pkg.billing_cycle === 'monthly' ? 'เดือน' : pkg.billing_cycle === 'yearly' ? 'ปี' : '7 วัน'}
                    </span>
                  )}
                </div>

                <div className="h-px bg-gray-100 w-full mb-6" />

                <div className="space-y-4 mb-8">
                  {/* แยก Description ด้วยการตัดคำขึ้นบรรทัดใหม่ (ถ้าระบุใน Backend แบบมี Enter) 
                      หรือจะแสดงเป็นก้อนเดียวก็ได้ */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {pkg.description}
                  </p>
                  
                  {/* ตัวอย่าง Feature List หลอกๆ เพื่อความสวยงาม */}
                  <ul className="space-y-3 mt-4">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-black" /> ไม่จำกัดจำนวนรายการ
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-black" /> จัดการหมวดหมู่ได้อิสระ
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-black" /> เพิ่มบัญชีผู้ช่วยได้
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => handleSubscribe(pkg)}
                  disabled={hasActivePackage || subscribingId === pkg.id}
                  className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    hasActivePackage
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-lg active:scale-[0.98]"
                  }`}
                >
                  {subscribingId === pkg.id ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : hasActivePackage ? (
                    <>
                      <Lock size={18} /> ใช้งานอยู่
                    </>
                  ) : (
                    <>
                      {pkg.price === 0 ? "เริ่มทดลองใช้ฟรี" : "สมัครใช้งานทันที"} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={40} /></div>}>
      <SubscriptionContent />
    </Suspense>
  );
}