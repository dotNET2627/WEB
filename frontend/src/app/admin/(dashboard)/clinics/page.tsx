"use client";

import React, { useState } from "react";

interface ClinicItem {
  id: string;
  code: string;
  name: string;
  address: string;
  hotline: string;
  manager: string;
  staffCount: number;
  patientsCount: number;
  plan: string;
  status: "active" | "maintenance" | "inactive";
  lastSync: string;
}

const mockClinics: ClinicItem[] = [
  {
    id: "clinic-1",
    code: "CLI-SGN-01",
    name: "DentalCare Central - Quận 1",
    address: "128 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    hotline: "028 3822 1999",
    manager: "TS. BS. Nguyễn Văn Toàn",
    staffCount: 34,
    patientsCount: 6840,
    plan: "Enterprise",
    status: "active",
    lastSync: "Vừa xong",
  },
  {
    id: "clinic-2",
    code: "CLI-HAN-01",
    name: "DentalCare Cầu Giấy",
    address: "72 Trần Thái Tông, Dịch Vọng Hậu, Cầu Giấy, Hà Nội",
    hotline: "024 3795 8888",
    manager: "ThS. BS. Trần Thị Minh",
    staffCount: 28,
    patientsCount: 4920,
    plan: "Enterprise",
    status: "active",
    lastSync: "2 phút trước",
  },
  {
    id: "clinic-3",
    code: "CLI-DAD-01",
    name: "DentalCare Hải Châu",
    address: "45 Nguyễn Văn Linh, Phước Ninh, Hải Châu, Đà Nẵng",
    hotline: "0236 365 2222",
    manager: "BS. CKI. Lê Quốc Bảo",
    staffCount: 22,
    patientsCount: 3150,
    plan: "Standard",
    status: "active",
    lastSync: "5 phút trước",
  },
  {
    id: "clinic-4",
    code: "CLI-SGN-02",
    name: "DentalCare Thủ Đức Center",
    address: "215 Võ Văn Ngân, Linh Chiểu, TP. Thủ Đức, TP. Hồ Chí Minh",
    hotline: "028 3722 5566",
    manager: "BS. Phạm Gia Huy",
    staffCount: 18,
    patientsCount: 2180,
    plan: "Standard",
    status: "active",
    lastSync: "12 phút trước",
  },
  {
    id: "clinic-5",
    code: "CLI-HAN-02",
    name: "DentalCare Tây Hồ (Cơ sở mới)",
    address: "18 Xuân Diệu, Quảng An, Tây Hồ, Hà Nội",
    hotline: "024 3998 1234",
    manager: "BS. Đặng Thu Thảo",
    staffCount: 12,
    patientsCount: 460,
    plan: "Standard",
    status: "maintenance",
    lastSync: "1 giờ trước",
  },
];

export default function AdminClinicsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredClinics = mockClinics.filter((clinic) => {
    const matchesSearch =
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || clinic.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Phòng khám & Chi nhánh</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              {mockClinics.length} Chi nhánh
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Giám sát, cấp phát cơ sở dữ liệu và quản lý gói dịch vụ của từng phòng khám.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Mở modal tạo phòng khám mới")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Thêm phòng khám mới</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên chi nhánh, mã số hoặc địa chỉ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="maintenance">Đang bảo trì/cấu hình</option>
          </select>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Phòng khám & Chi nhánh</th>
                <th className="px-6 py-4">Mã số</th>
                <th className="px-6 py-4">Trưởng cơ sở</th>
                <th className="px-6 py-4 text-center">Quy mô</th>
                <th className="px-6 py-4">Gói dịch vụ</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="transition hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-white">{clinic.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{clinic.address}</p>
                      <p className="text-[11px] text-indigo-400 mt-0.5 font-mono">{clinic.hotline}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">{clinic.code}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{clinic.manager}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-block text-center">
                      <p className="font-semibold text-white">{clinic.staffCount} NS</p>
                      <p className="text-[11px] text-slate-400">{clinic.patientsCount.toLocaleString()} BN</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-200">
                      {clinic.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {clinic.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Bảo trì
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => alert(`Xem chi tiết phòng khám: ${clinic.name}`)}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
