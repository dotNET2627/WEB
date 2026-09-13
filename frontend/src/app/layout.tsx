import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dental Management",
  description: "Hệ thống quản lý phòng khám nha khoa"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
