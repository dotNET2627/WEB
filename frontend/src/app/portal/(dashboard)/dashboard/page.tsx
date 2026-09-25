"use client";

import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const displayName = user?.fullName || "Bệnh nhân";
  const patientCode = user?.patientCode || "BN-2026-9812";
  const phone = user?.phoneNumber || user?.email?.split("@")[0] || "0912345678";

  const handleQuickBook = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBookingOpen(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 p-6 sm:p-8 text-white shadow-xl shadow-cyan-600/20">
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-md">
                Sổ Khám Răng Điện Tử
              </span>
              <span className="text-cyan-200 text-xs font-mono">#{patientCode}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Xin chào, {displayName}!
            </h1>
            <p className="text-sm text-cyan-100 max-w-lg">
              Chào mừng bạn đến với Cổng thông tin chăm sóc răng miệng DentalCare. Theo dõi lịch hẹn và toa thuốc của bạn mọi lúc mọi nơi.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setIsBookingOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-cyan-800 shadow-md transition hover:bg-cyan-50 active:scale-[0.98] cursor-pointer"
            >
              <svg className="h-4 w-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Đặt lịch khám mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Booking Alert Banner */}
      {bookingSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold">Yêu cầu đặt lịch đã được ghi nhận thành công!</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Lễ tân phòng khám sẽ gọi đến số <strong className="font-mono">{phone}</strong> trong 15 phút để xác nhận.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBookingSuccess(false)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            &times;
          </button>
        </div>
      )}

      {/* Grid: Upcoming Appointment & Quick Profile */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left 2 Cols: Upcoming Appointment Card */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Lịch Hẹn Khám Sắp Tới
            </h2>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold">
              Đã xác nhận
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Thời gian hẹn</p>
                <p className="text-xl font-extrabold text-slate-900 mt-1">
                  09:30 - Thứ Bảy, Ngày 26/09/2026
                </p>
                <p className="text-xs text-cyan-700 font-medium mt-0.5">Khám định kỳ & Lấy vôi răng chuyên sâu</p>
              </div>

              <div className="flex sm:flex-col items-end gap-2">
                <span className="rounded-xl bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800 border border-cyan-100">
                  Phòng khám 02 - Ghế số 3
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-5 text-sm">
              <div className="space-y-1">
                <p className="text-xs text-slate-400">Bác sĩ phụ trách:</p>
                <p className="font-bold text-slate-800">TS. BS. Nguyễn Văn Toàn</p>
                <p className="text-xs text-slate-500">Chuyên khoa Răng Hàm Mặt & Phục hình</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-400">Địa điểm chi nhánh:</p>
                <p className="font-bold text-slate-800">DentalCare Central - Quận 1</p>
                <p className="text-xs text-slate-500">128 Nguyễn Huệ, P. Bến Nghé, Q.1, TP. HCM</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <svg className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <strong>Lời dặn trước khi khám:</strong> Vui lòng có mặt trước giờ hẹn 10 phút để hoàn thiện thủ tục tiếp đón. Mang theo thẻ BHYT hoặc bảo lãnh viện phí (nếu có).
              </span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Patient Card Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Thẻ Bệnh Nhân</h2>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-lg shadow-md shadow-cyan-500/20">
                {displayName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{displayName}</p>
                <p className="text-xs font-mono text-cyan-700">{patientCode}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-semibold text-slate-700 font-mono">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Nhóm máu:</span>
                <span className="font-semibold text-slate-700">O+</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tiền sử dị ứng:</span>
                <span className="font-semibold text-emerald-600">Không có</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chi nhánh quen thuộc:</span>
                <span className="font-semibold text-slate-700">Quận 1, TP. HCM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column: Active Prescription & Past Dental Visits */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Prescription */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Đơn Thuốc Hiện Tại
            </h2>
            <span className="text-xs text-slate-400">Kê ngày 15/09/2026</span>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-bold text-slate-800 text-sm">1. Amoxicillin 500mg</p>
                  <p className="text-xs text-slate-500 mt-0.5">Kháng sinh chống nhiễm khuẩn răng miệng</p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  21 viên (Ngày 3 lần, 1 viên/lần)
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="font-bold text-slate-800 text-sm">2. Paracetamol 500mg</p>
                  <p className="text-xs text-slate-500 mt-0.5">Giảm đau, hạ sốt sau can thiệp nha chu</p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  10 viên (Uống khi đau, cách 6h)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">3. Nước súc miệng Chlorohexidine 0.12%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Súc miệng diệt khuẩn khoang miệng</p>
                </div>
                <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                  1 chai (Súc 2 lần/ngày sau ăn)
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
              <strong>Bác sĩ chỉ định:</strong> Uống thuốc đủ liều, kiêng đồ ăn quá cay nóng hoặc quá cứng trong 5 ngày.
            </div>
          </div>
        </div>

        {/* Past Dental Visits */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lịch Sử Điều Trị Gần Đây
          </h2>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xs font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">Trám răng Composite thẩm mỹ</p>
                    <span className="text-xs text-slate-400 font-mono">15/08/2026</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Răng hàm số 46 - Hoàn tất phục hình</p>
                  <p className="text-[11px] text-cyan-700 mt-0.5">BS. Trần Thị Minh &bull; DentalCare Cầu Giấy</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-xs font-bold">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm">Chụp X-quang Panorex toàn cảnh</p>
                    <span className="text-xs text-slate-400 font-mono">02/06/2026</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">Khảo sát răng khôn ngầm số 38</p>
                  <p className="text-[11px] text-cyan-700 mt-0.5">TS. BS. Nguyễn Văn Toàn &bull; Chi nhánh Quận 1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-800">Đặt Lịch Khám Răng Mới</h3>
              <button
                type="button"
                onClick={() => setIsBookingOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Dịch vụ mong muốn
                </label>
                <select className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none">
                  <option>Khám tổng quát & Lấy vôi răng</option>
                  <option>Tẩy trắng răng thẩm mỹ</option>
                  <option>Niềng răng / Chỉnh nha chuyên sâu</option>
                  <option>Nhổ răng khôn không đau</option>
                  <option>Trồng răng Implant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Chi nhánh thuận tiện
                </label>
                <select className="w-full rounded-2xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none">
                  <option>DentalCare Central - Quận 1, TP. HCM</option>
                  <option>DentalCare Cầu Giấy, Hà Nội</option>
                  <option>DentalCare Hải Châu, Đà Nẵng</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Ngày khám mong muốn
                  </label>
                  <input
                    type="date"
                    defaultValue="2026-09-28"
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                    Khung giờ
                  </label>
                  <select className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:border-cyan-500 focus:outline-none">
                    <option>Sáng (08:30 - 11:30)</option>
                    <option>Chiều (13:30 - 17:00)</option>
                    <option>Tối (17:30 - 20:00)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:from-cyan-500 hover:to-blue-500"
                >
                  Xác nhận đặt hẹn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
