"use client";

import React, { useState } from "react";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  clinicName: string;
  isTwoFactorEnabled: boolean;
  status: "active" | "locked";
  createdAt: string;
}

const mockUsers: UserItem[] = [
  {
    id: "user-1",
    fullName: "Quản trị viên Hệ thống",
    email: "admin@clinic.vn",
    roles: ["SuperAdmin"],
    clinicName: "Toàn bộ hệ thống",
    isTwoFactorEnabled: true,
    status: "active",
    createdAt: "01/01/2026",
  },
  {
    id: "user-2",
    fullName: "TS. BS. Nguyễn Văn Toàn",
    email: "toan.nguyen@clinic.vn",
    roles: ["Doctor", "ClinicAdmin"],
    clinicName: "DentalCare Central - Quận 1",
    isTwoFactorEnabled: true,
    status: "active",
    createdAt: "10/01/2026",
  },
  {
    id: "user-3",
    fullName: "ThS. BS. Trần Thị Minh",
    email: "minh.tran@clinic.vn",
    roles: ["Doctor"],
    clinicName: "DentalCare Cầu Giấy",
    isTwoFactorEnabled: false,
    status: "active",
    createdAt: "15/01/2026",
  },
  {
    id: "user-4",
    fullName: "Lễ tân Lê Mai Linh",
    email: "linh.le@clinic.vn",
    roles: ["Receptionist"],
    clinicName: "DentalCare Central - Quận 1",
    isTwoFactorEnabled: false,
    status: "active",
    createdAt: "02/02/2026",
  },
  {
    id: "user-5",
    fullName: "Kỹ thuật viên Phạm Văn Đức",
    email: "duc.pham@clinic.vn",
    roles: ["Staff"],
    clinicName: "DentalCare Hải Châu",
    isTwoFactorEnabled: false,
    status: "locked",
    createdAt: "18/02/2026",
  },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.clinicName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      filterRole === "all" || u.roles.some((r) => r.toLowerCase() === filterRole.toLowerCase());
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Quản lý Người dùng & Nhân sự</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              {mockUsers.length} Tài khoản mẫu
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Quản trị danh tính toàn hệ thống, gán vai trò RBAC và kiểm soát truy cập đa chi nhánh.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Mở form thêm nhân sự mới")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Tạo tài khoản mới</span>
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
            placeholder="Tìm theo họ tên, email hoặc chi nhánh công tác..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="SuperAdmin">SuperAdmin</option>
            <option value="Doctor">Bác sĩ (Doctor)</option>
            <option value="Receptionist">Lễ tân (Receptionist)</option>
            <option value="ClinicAdmin">Quản lý chi nhánh</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Nhân sự</th>
                <th className="px-6 py-4">Vai trò (Roles)</th>
                <th className="px-6 py-4">Chi nhánh trực thuộc</th>
                <th className="px-6 py-4 text-center">Bảo mật 2FA</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-slate-800/40">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-700 to-slate-800 text-xs font-bold text-white uppercase border border-indigo-500/30">
                        {user.fullName.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {user.roles.map((role) => {
                        const isSuper = role.toLowerCase() === "superadmin";
                        const isDoc = role.toLowerCase() === "doctor";
                        return (
                          <span
                            key={role}
                            className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${
                              isSuper
                                ? "bg-indigo-950/80 text-indigo-300 border-indigo-500/40"
                                : isDoc
                                ? "bg-blue-950/80 text-blue-300 border-blue-500/40"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            }`}
                          >
                            {role}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-300">{user.clinicName}</td>
                  <td className="px-6 py-4 text-center">
                    {user.isTwoFactorEnabled ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        Đã bật
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Chưa kích hoạt</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.status === "active" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                        Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => alert(`Chỉnh sửa quyền tài khoản: ${user.email}`)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                      Phân quyền
                    </button>
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
