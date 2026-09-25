"use client";

import React, { useState } from "react";

interface RoleDef {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isSystem: boolean;
  color: string;
}

const mockRoles: RoleDef[] = [
  {
    id: "r-1",
    name: "SuperAdmin",
    description: "Quản trị viên toàn hệ thống, nắm toàn bộ quyền kiểm soát đa chi nhánh và cấu hình máy chủ.",
    userCount: 3,
    isSystem: true,
    color: "border-indigo-500/40 bg-indigo-950/60 text-indigo-300",
  },
  {
    id: "r-2",
    name: "ClinicAdmin",
    description: "Quản lý cấp chi nhánh, có quyền điều phối nhân sự, duyệt phác đồ và xem báo cáo tài chính chi nhánh.",
    userCount: 8,
    isSystem: true,
    color: "border-purple-500/40 bg-purple-950/60 text-purple-300",
  },
  {
    id: "r-3",
    name: "Doctor",
    description: "Bác sĩ điều trị nha khoa, có quyền khám chữa bệnh, lập hồ sơ bệnh án, phác đồ điều trị và kê đơn.",
    userCount: 48,
    isSystem: true,
    color: "border-blue-500/40 bg-blue-950/60 text-blue-300",
  },
  {
    id: "r-4",
    name: "Receptionist",
    description: "Nhân viên tiếp đón và điều phối lịch hẹn, tạo hồ sơ tiếp nhận ban đầu và thu ngân viện phí.",
    userCount: 64,
    isSystem: true,
    color: "border-emerald-500/40 bg-emerald-950/60 text-emerald-300",
  },
];

interface PermissionModule {
  category: string;
  permissions: {
    code: string;
    description: string;
    roles: string[];
  }[];
}

const permissionModules: PermissionModule[] = [
  {
    category: "Hệ thống & Danh tính (Identity)",
    permissions: [
      { code: "system.admin.access", description: "Truy cập cổng Quản trị SuperAdmin Portal", roles: ["SuperAdmin"] },
      { code: "users.manage", description: "Tạo, cập nhật và khóa tài khoản nhân sự", roles: ["SuperAdmin", "ClinicAdmin"] },
      { code: "roles.assign", description: "Phân bổ vai trò và cấp quyền hạn", roles: ["SuperAdmin"] },
      { code: "audit.logs.view", description: "Truy vấn nhật ký kiểm toán và an ninh", roles: ["SuperAdmin"] },
    ],
  },
  {
    category: "Quản lý Chi nhánh & Phòng khám",
    permissions: [
      { code: "clinics.create", description: "Thêm chi nhánh phòng khám mới", roles: ["SuperAdmin"] },
      { code: "clinics.settings", description: "Cấu hình giờ làm việc, thông tin pháp lý chi nhánh", roles: ["SuperAdmin", "ClinicAdmin"] },
      { code: "clinics.switch", description: "Chuyển đổi bối cảnh làm việc giữa các chi nhánh", roles: ["SuperAdmin", "Doctor"] },
    ],
  },
  {
    category: "Nghiệp vụ Y tế & Bệnh nhân",
    permissions: [
      { code: "patients.read", description: "Xem danh sách và hồ sơ bệnh án", roles: ["SuperAdmin", "ClinicAdmin", "Doctor", "Receptionist"] },
      { code: "patients.write", description: "Tạo và cập nhật thông tin bệnh nhân", roles: ["SuperAdmin", "Doctor", "Receptionist"] },
      { code: "treatment.prescribe", description: "Kê đơn thuốc và chỉ định thủ thuật", roles: ["SuperAdmin", "Doctor"] },
      { code: "invoices.create", description: "Lập phiếu thu và thanh toán viện phí", roles: ["SuperAdmin", "Receptionist"] },
    ],
  },
];

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState<string>("SuperAdmin");

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Vai trò & Phân quyền (RBAC Matrix)</h1>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-950/70 px-2.5 py-0.5 text-xs font-semibold text-indigo-300">
              Role-Based Access Control
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Định nghĩa ma trận quyền hạn cho từng vai trò trong hệ thống nha khoa phân tán.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert("Mở form tạo Role tùy chỉnh")}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Tạo vai trò mới</span>
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockRoles.map((role) => {
          const isSelected = selectedRole === role.name;
          return (
            <button
              type="button"
              key={role.id}
              onClick={() => setSelectedRole(role.name)}
              className={`text-left rounded-2xl border p-5 transition cursor-pointer ${
                isSelected
                  ? "border-indigo-500 bg-slate-900 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/30"
                  : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${role.color}`}>
                  {role.name}
                </span>
                {role.isSystem && (
                  <span className="text-[10px] font-medium text-slate-400">Hệ thống</span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                {role.description}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Số tài khoản gán:</span>
                <span className="font-semibold text-white">{role.userCount} người dùng</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Permission Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md overflow-hidden">
        <div className="border-b border-slate-800 bg-slate-950/70 p-4 sm:flex sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">
              Ma trận Quyền hạn: <span className="text-indigo-400">{selectedRole}</span>
            </h2>
            <p className="text-xs text-slate-400">
              Kiểm tra các hành động mà vai trò {selectedRole} được phép thực thi
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800/80">
          {permissionModules.map((module) => (
            <div key={module.category} className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                {module.category}
              </h3>
              <div className="space-y-2">
                {module.permissions.map((perm) => {
                  const hasAccess = perm.roles.includes(selectedRole);
                  return (
                    <div
                      key={perm.code}
                      className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 transition hover:bg-slate-800/30"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-medium text-indigo-300">
                            {perm.code}
                          </code>
                        </div>
                        <p className="text-xs text-slate-400">{perm.description}</p>
                      </div>

                      <div className="shrink-0">
                        {hasAccess ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Cho phép
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
                            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Từ chối
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
