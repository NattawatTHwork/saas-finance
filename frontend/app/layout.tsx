import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google"; // 🌟 1. เปลี่ยนมานำเข้าฟอนต์ Noto Sans Thai
import "./globals.css";

// 🌟 2. ตั้งค่าฟอนต์ (เลือกน้ำหนักที่ใช้บ่อยในงาน UI)
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// 🌟 3. อัปเดต Metadata ให้ตรงกับโปรเจกต์ของคุณ
export const metadata: Metadata = {
  title: "Finance SaaS",
  description: "ระบบจัดการบัญชีรายรับ-รายจ่ายสำหรับบริษัท",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th" // 🌟 4. เปลี่ยนเป็นภาษาไทย (มีผลดีต่อ SEO และการอ่านของ Browser)
      className="h-full antialiased" // antialiased ทำให้ตัวอักษรดูสมูทขึ้น
    >
      {/* 🌟 5. นำ notoSansThai.className มาแทรกไว้ใน body */}
      <body className={`${notoSansThai.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}