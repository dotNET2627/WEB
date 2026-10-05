"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Headphones,
  CheckCircle2,
  Sparkles,
  Award,
  ChevronRight,
  Activity
} from "lucide-react";
import { SITE } from "@/config/site";

export default function PatientPortalLandingPage() {
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Cập nhật hash trên URL bằng replaceState để không tạo thêm entry rác trong browser history stack
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#${id}`);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const id = window.location.hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500/20 selection:text-indigo-700">
      
      {/* ========================================================= */}
      {/* 1. STICKY TOP NAVIGATION BAR */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/portal" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C7.5 2 4 4.5 4 8c0 2.5 1.5 5 2.5 7.5S8 21 10 22c1.5.8 2.5-.5 2-.5-.5 0-1-1-1-2s1-2 1-3.5c0-.5 0-1-.5-1.5s-1-.5-1-.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5c1.2 0 2 .8 2 2 0 1-.5 2-.5 3s.5 2 1 2c1.2 0 2-1 2-2s-.5-2-.5-3.5c0-1.5.5-2.5 1.5-3.5s1.5-2 1.5-3.5c0-3.5-3.5-6-8-6z" />
              </svg>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-tight">
                {SITE.name}
              </span>
              <span className="text-[11px] font-semibold text-indigo-600 tracking-wider uppercase">
                Cổng Bệnh Nhân Điện Tử
              </span>
            </div>
          </Link>

          {/* Center Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a
              href="#tinh-nang"
              onClick={(e) => scrollToSection(e, "tinh-nang")}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Tiện ích sổ khám
            </a>
            <a
              href="#quy-trinh"
              onClick={(e) => scrollToSection(e, "quy-trinh")}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Quy trình 3 bước
            </a>
            <a
              href="#bao-mat"
              onClick={(e) => scrollToSection(e, "bao-mat")}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Bảo mật y tế
            </a>
            <a
              href="#hotline"
              onClick={(e) => scrollToSection(e, "hotline")}
              className="hover:text-indigo-600 transition cursor-pointer"
            >
              Hỗ trợ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <a
              href="tel:19006868"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/70 transition"
            >
              <Headphones className="w-4 h-4 text-indigo-600" />
              <span>1900 6868</span>
            </a>

            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <span>Vào sổ khám</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50">
        
        {/* Ambient background blur circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-purple-300/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-80 h-80 rounded-full bg-teal-200/30 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100/80 border border-indigo-200/70 text-indigo-700 text-xs font-bold tracking-wide shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>NỀN TẢNG NHA KHOA KỸ THUẬT SỐ THẾ HỆ MỚI</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
                Sổ Khám Răng Điện Tử <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600">
                  Minh Bạch & Tiện Lợi
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Không cần mang theo sổ giấy, không lo thất lạc đơn thuốc hay phim chụp X-quang. Chỉ với một cú chạm, bạn có thể theo dõi tiến độ điều trị, răng sứ, niềng răng và nhận lịch nhắc hẹn tự động ngay trên điện thoại.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/portal/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/30 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <span>Truy cập Sổ khám ngay</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#tinh-nang"
                  onClick={(e) => scrollToSection(e, "tinh-nang")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-semibold text-base text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-100 border border-slate-200/80 shadow-xs transition-all cursor-pointer"
                >
                  <span>Khám phá tính năng</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm font-semibold text-slate-600">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Đăng nhập OTP & Google
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Bảo mật y tế đa tầng
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Đồng bộ phác đồ tức thì
                </span>
              </div>

            </div>

            {/* Right Mockup Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative shadow frame */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-indigo-500 to-teal-400 opacity-20 blur-xl" />

                {/* Patient Record Preview Card */}
                <div className="relative rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-6">
                  
                  {/* Card Header: Patient Identity */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                        BN
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">Hồ Sơ Nụ Cười</h4>
                        <p className="text-xs font-mono font-medium text-indigo-600">Mã BN: BN-2026-8888</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                      ĐANG ĐIỀU TRỊ
                    </span>
                  </div>

                  {/* Active Treatment Progress */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Chỉnh nha & Răng sứ Thẩm mỹ</span>
                      <span className="font-bold text-indigo-700">Hoàn thành 85%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-600 to-teal-500 h-full w-[85%] rounded-full transition-all" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Răng #11, #21, #22</span>
                      <span className="text-emerald-600 font-semibold">Tái khám: 15/10/2026</span>
                    </div>
                  </div>

                  {/* Feature Quick Grid inside Preview */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <p className="font-bold text-xs text-slate-800">Lịch Hẹn Khám</p>
                      <p className="text-[11px] text-slate-500">09:30 - Thứ Bảy tới</p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <p className="font-bold text-xs text-slate-800">Đơn Thuốc Online</p>
                      <p className="text-[11px] text-slate-500">3 loại thuốc chỉ định</p>
                    </div>
                  </div>

                  {/* Callout */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      Dữ liệu mã hóa bảo mật
                    </span>
                    <Link href="/portal/login" className="text-teal-300 font-bold hover:underline flex items-center gap-1">
                      Xem chi tiết &rarr;
                    </Link>
                  </div>

                </div>

              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================= */}
      {/* 3. CORE BENEFITS / BENTO GRID */}
      {/* ========================================================= */}
      <section id="tinh-nang" className="py-20 lg:py-28 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full">
              Tiện Ích Vượt Trội
            </h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tất Cả Thông Tin Nha Khoa Nằm Gọn Trong Tay Bạn
            </h3>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Được thiết kế tinh tế nhằm mang lại trải nghiệm khám chữa bệnh răng miệng minh bạch, chủ động và không còn cảm giác lo âu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Tra cứu hồ sơ & phác đồ */}
            <div className="p-7 rounded-3xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 hover:border-indigo-200 transition-all duration-300 space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Phác Đồ & Tiến Độ Trực Quan
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Xem chi tiết từng giai đoạn điều trị răng, hình ảnh chụp X-quang, mô phỏng kết quả sau khi niềng răng hoặc bọc sứ thẩm mỹ.
              </p>
            </div>

            {/* Card 2: Lịch hẹn & Nhắc hẹn tự động */}
            <div className="p-7 rounded-3xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-200 transition-all duration-300 space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Nhắc Lịch Tái Khám Tự Động
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Không lo quên lịch siết mắc cài, cạo vôi răng định kỳ. Nhận thông báo nhắc hẹn trước 24 giờ qua tin nhắn SMS và Zalo.
              </p>
            </div>

            {/* Card 3: Đơn thuốc & Hướng dẫn y khoa */}
            <div className="p-7 rounded-3xl bg-slate-50 hover:bg-purple-50/50 border border-slate-200/80 hover:border-purple-200 transition-all duration-300 space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Đơn Thuốc & Hướng Dẫn Tại Nhà
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Xem lại liều dùng đơn thuốc chính xác của bác sĩ phụ trách và cẩm nang chăm sóc răng miệng sau nhổ răng hoặc phẫu thuật.
              </p>
            </div>

            {/* Card 4: Minh bạch chi phí & Thẻ bảo hành */}
            <div className="p-7 rounded-3xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-200 transition-all duration-300 space-y-4 group">
              <div className="w-13 h-13 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                Bảo Hành & Lịch Sử Chi Phí
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed font-normal">
                Lưu trữ thẻ bảo hành chính hãng (răng sứ, trụ implant), hóa đơn điện tử minh bạch từng hạng mục thanh toán.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. 3-STEP EASY ONBOARDING */}
      {/* ========================================================= */}
      <section id="quy-trinh" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 bg-teal-950/60 border border-teal-800/60 px-3.5 py-1 rounded-full">
              ĐƠN GIẢN & NHANH CHÓNG
            </span>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              3 Bước Đăng Nhập Sổ Khám Trong 30 Giây
            </h3>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed font-normal">
              Không cần đăng ký phức tạp hay ghi nhớ mật khẩu rườm rà.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/70 relative space-y-4 backdrop-blur-md">
              <span className="text-5xl font-black text-indigo-400/30">01</span>
              <h4 className="text-xl font-bold text-white">Nhập số điện thoại</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Nhập số điện thoại bạn đã đăng ký tại phòng khám hoặc chọn đăng nhập nhanh bằng tài khoản Google.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/70 relative space-y-4 backdrop-blur-md">
              <span className="text-5xl font-black text-purple-400/30">02</span>
              <h4 className="text-xl font-bold text-white">Nhập mã xác thực OTP</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Hệ thống gửi mã bảo mật 6 chữ số qua tin nhắn SMS tới điện thoại của bạn, có hiệu lực trong 5 phút.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-slate-800/60 border border-slate-700/70 relative space-y-4 backdrop-blur-md">
              <span className="text-5xl font-black text-teal-400/30">03</span>
              <h4 className="text-xl font-bold text-white">Theo dõi hồ sơ ngay</h4>
              <p className="text-sm text-slate-300 leading-relaxed font-normal">
                Truy cập ngay bảng điều khiển cá nhân, xem phác đồ điều trị, đơn thuốc và lịch hẹn tái khám đã sẵn sàng.
              </p>
            </div>

          </div>

          <div className="text-center mt-12">
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-all cursor-pointer"
            >
              <span>Trải nghiệm ngay</span>
              <ArrowRight className="w-5 h-5 text-indigo-600" />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SECURITY & COMPLIANCE SECTION */}
      {/* ========================================================= */}
      <section id="bao-mat" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-8 space-y-4 text-center lg:text-left">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  BẢO VỆ DỮ LIỆU Y TẾ
                </span>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
                  Thông Tin Bệnh Án Của Bạn Được Bảo Vệ Tuyệt Đối
                </h3>
                <p className="text-sm sm:text-base text-indigo-200 leading-relaxed max-w-2xl font-normal">
                  Mọi hồ sơ chụp chiếu, đơn thuốc và nhật ký điều trị được mã hóa chuẩn y khoa. Chỉ bạn mới có quyền truy cập thông qua mã OTP di động xác thực một lần hoặc tài khoản Google liên kết.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Link
                  href="/portal/login"
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-center text-slate-900 bg-white hover:bg-slate-100 shadow-lg transition"
                >
                  Đăng nhập bảo mật
                </Link>
                <Link
                  href="/privacy"
                  className="px-6 py-3.5 rounded-xl font-semibold text-sm text-center text-indigo-200 hover:text-white border border-indigo-700/80 hover:bg-white/10 transition"
                >
                  Chính sách quyền riêng tư
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. CALL TO ACTION & SUPPORT HOTLINE */}
      {/* ========================================================= */}
      <section id="hotline" className="py-16 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
            <Headphones className="w-8 h-8" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Cần Hỗ Trợ Đăng Nhập Hoặc Đổi Số Điện Thoại?
          </h3>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal max-w-xl mx-auto">
            Tổng đài chăm sóc khách hàng và lễ tân nha khoa luôn sẵn sàng hỗ trợ bạn kích hoạt hồ sơ, đặt lịch khẩn cấp hoặc giải đáp thắc mắc phác đồ điều trị.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <a
              href="tel:19006868"
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl font-bold text-base text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
            >
              <Headphones className="w-5 h-5" />
              <span>Gọi Hotline 1900 6868 (24/7)</span>
            </a>

            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-base text-slate-700 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition"
            >
              <span>Vào Sổ Khám Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================= */}
      <footer className="bg-white border-t border-slate-200/80 py-10 text-xs sm:text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{SITE.name}</span>
            <span>&copy; {new Date().getFullYear()}. Nền tảng chăm sóc nụ cười số.</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-indigo-600 transition">
              Chính sách bảo mật
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 transition">
              Điều khoản sử dụng
            </Link>
            <Link href="/portal/login" className="font-semibold text-indigo-600 hover:underline">
              Đăng nhập cổng bệnh nhân
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
