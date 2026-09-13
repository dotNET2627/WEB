"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/patients", label: "Bệnh nhân" },
  { href: "/appointments", label: "Lịch hẹn" },
  { href: "/treatment-plans", label: "Phác đồ điều trị" },
  { href: "/prescriptions", label: "Đơn thuốc" },
  { href: "/inventory", label: "Kho vật tư" },
  { href: "/invoices", label: "Hóa đơn" },
  { href: "/insurance", label: "Bảo hiểm" },
  { href: "/settings", label: "Thiết lập" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-[var(--border)] bg-slate-950 p-4 text-slate-100 lg:min-h-screen lg:border-b-0 lg:border-r">
      <Link className="mb-8 block px-3 text-lg font-bold" href="/dashboard">
        Dental<span className="text-blue-400">Care</span>
      </Link>
      <nav className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
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
