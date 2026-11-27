"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  href: string;
  label: string;
  requiredRole?: string[];
}

const allItems: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/doctor/workspace", label: "Bàn khám bác sĩ", requiredRole: ["doctor", "superadmin", "clinicadmin", "admin"] },
  { href: "/patients", label: "Bệnh nhân" },
  { href: "/appointments", label: "Lịch hẹn" },
  { href: "/treatment-plans", label: "Phác đồ điều trị" },
  { href: "/services", label: "Danh mục dịch vụ" },
  { href: "/promotions", label: "Khuyến mãi" },
  { href: "/prescriptions", label: "Đơn thuốc" },
  { href: "/invoices", label: "Hóa đơn & Thu ngân" },
  { href: "/doctors", label: "Bác sĩ & Ca trực" },
  { href: "/clinics", label: "Chi nhánh" },
  { href: "/inventory", label: "Kho vật tư" },
  { href: "/insurance", label: "Bảo hiểm" },
  { href: "/settings", label: "Thiết lập" }
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRoles = user?.roles?.map((r) => r.toLowerCase()) || [];
  const isSuperAdmin = userRoles.includes("superadmin");

  const visibleItems = allItems.filter((item) => {
    if (!item.requiredRole || isSuperAdmin) return true;
    if (process.env.NODE_ENV !== "production") return true;
    return item.requiredRole.some((role) => userRoles.includes(role));
  });

  return (
    <aside className="border-b border-[var(--border)] bg-slate-950 p-4 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r">
      <Link className="mb-8 block px-3 text-lg font-bold" href="/dashboard">
        Dental<span className="text-blue-400">Care</span>
      </Link>
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {visibleItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
                active
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
              href={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
