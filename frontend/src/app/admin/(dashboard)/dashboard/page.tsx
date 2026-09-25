import React from "react";
import Link from "next/link";

const systemStats = [
  {
    label: "Phòng khám & Chi nhánh",
    value: "8",
    detail: "7 Đang hoạt động, 1 Đang chuẩn bị",
    change: "+2 chi nhánh quý này",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    icon: (
      <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    label: "Nhân sự Toàn hệ thống",
    value: "142",
    detail: "48 Bác sĩ, 64 Lễ tân, 30 Quản trị",
    change: "+12 tài khoản mới",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    icon: (
      <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    label: "Hồ sơ Bệnh nhân",
    value: "18,450",
    detail: "Dữ liệu đồng bộ tập trung MongoDB",
    change: "+320 hồ sơ trong tuần",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    icon: (
      <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "An toàn & Phiên đăng nhập",
    value: "99.98%",
    detail: "0 vi phạm, 126 phiên hoạt động",
    change: "Bảo mật cấp cao",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    icon: (
      <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const recentOperations = [
  {
    id: "op-1",
    user: "SuperAdmin (admin@clinic.vn)",
    action: "Cập nhật cấu hình JWT Refresh Token Policy",
    target: "Cấu hình Hệ thống",
    time: "10 phút trước",
    status: "Thành công",
    statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "op-2",
    user: "Dr. Hoàng Nam (nam.hoang@clinic.vn)",
    action: "Chuyển giao hồ sơ điều trị liên chi nhánh",
    target: "Bệnh nhân #BN-88214",
    time: "25 phút trước",
    status: "Thành công",
    statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
  {
    id: "op-3",
    user: "System Daemon",
    action: "Tự động thu hồi 14 token hết hạn (SHA-256 Revoke)",
    target: "Identity MongoDB",
    time: "1 giờ trước",
    status: "Tự động",
    statusColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  },
  {
    id: "op-4",
    user: "Quản trị viên Chi nhánh 2",
    action: "Thêm tài khoản Lễ tân mới: Le Thi Mai",
    target: "Chi nhánh Hà Nội",
    time: "3 giờ trước",
    status: "Thành công",
    statusColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  },
];

const securityAlerts = [
  {
    id: "sec-1",
    level: "Cảnh báo",
    title: "Phát hiện 3 lượt đăng nhập sai mật khẩu liên tiếp",
    description: "Tài khoản le.tan@clinic.vn từ IP 118.69.182.14. Đã kích hoạt cơ chế Rate Limiting.",
    time: "45 phút trước",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  },
  {
    id: "sec-2",
    level: "Thông tin",
    title: "Chu kỳ xoay vòng khóa bí mật (Secret Rotation)",
    description: "Khóa JWT mã hóa dữ liệu còn 12 ngày trước chu kỳ cập nhật tiếp theo.",
    time: "4 giờ trước",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  },
  {
    id: "sec-3",
    level: "Hệ thống",
    title: "Sao lưu cơ sở dữ liệu MongoDB định kỳ",
    description: "Hoàn tất backup tự động phân vùng shard chính (2.4 GB) lên lưu trữ bảo mật.",
    time: "Hôm nay 03:00",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">Tổng quan Hệ thống Quản trị</h1>
            <span className="rounded-md border border-indigo-500/30 bg-indigo-950/70 px-2 py-0.5 text-xs font-semibold text-indigo-300">
              Toàn hệ thống
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Trung tâm giám sát, điều phối phòng khám và an ninh bảo mật cấp cao nhất.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/clinics"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Thêm phòng khám mới</span>
          </Link>
        </div>
      </div>

      {/* Key Metric Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm transition hover:border-slate-700"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
                {stat.icon}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-3xl font-extrabold tracking-tight text-white">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
            </div>

            <div className="mt-4 border-t border-slate-800/80 pt-3 flex items-center justify-between">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${stat.badgeColor}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Operations Stream & Security Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Operations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Thao tác Quản trị Gần đây</h2>
              <p className="text-xs text-slate-400">Ghi nhận tức thì từ hệ thống kiểm toán (Audit Log)</p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition"
            >
              Xem toàn bộ nhật ký &rarr;
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md divide-y divide-slate-800/80 overflow-hidden">
            {recentOperations.map((op) => (
              <div key={op.id} className="p-4 transition hover:bg-slate-800/40">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-100">{op.action}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="text-indigo-400">{op.user}</span>
                      <span>&bull;</span>
                      <span>Mục tiêu: {op.target}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-slate-500">{op.time}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${op.statusColor}`}>
                      {op.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Security Alerts & Infrastructure Status */}
        <div className="space-y-6">
          {/* Security Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Cảnh báo An ninh</h2>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-semibold ${alert.badgeColor}`}>
                      {alert.level}
                    </span>
                    <span className="text-[11px] text-slate-500">{alert.time}</span>
                  </div>
                  <h3 className="text-xs font-semibold text-slate-200">{alert.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{alert.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Status */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trạng thái Hạ tầng Máy chủ
            </h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">ASP.NET Core 9 API Gateway</span>
                <span className="text-emerald-400 font-medium">Bình thường (14ms)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">MongoDB ReplicaSet (Primary)</span>
                <span className="text-emerald-400 font-medium">Kết nối tốt</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Auth Token Rotation Service</span>
                <span className="text-emerald-400 font-medium">Hoạt động</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
