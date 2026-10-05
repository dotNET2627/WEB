"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  RotateCcw,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  Headphones,
  User as UserIcon,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { validateVietnamesePhone, maskPhoneDisplay } from "@/lib/phone-utils";
import { SITE } from "@/config/site";

function PatientLoginForm() {
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = rawReturnUrl && rawReturnUrl.startsWith("/portal") ? rawReturnUrl : "/portal/dashboard";

  const { loginWithPhoneOtp, loginWithGoogle } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [genericNotice, setGenericNotice] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setErrorMessage("Vui lòng xác thực số điện thoại để truy cập hồ sơ.");
    }
  }, [searchParams]);

  // Khắc phục triệt để lỗi khi người dùng bấm nút Back từ /portal/login về URL có hash (/portal#hotline, v.v.)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== "undefined" && window.location.pathname !== "/portal/login") {
        window.location.reload();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!consentAgreed) {
      setErrorMessage("Vui lòng đồng ý với Điều khoản sử dụng và Chính sách bảo mật.");
      checkboxRef.current?.focus();
      return;
    }

    const phoneValidation = validateVietnamesePhone(phoneNumber);
    if (!phoneValidation.isValid) {
      setErrorMessage("Số điện thoại chưa đúng. Ví dụ: 0912 345 678.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setGenericNotice(null);

    try {
      const response = await fetch("/api/auth/patient/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneValidation.normalizedPhone,
          captchaToken: "verified-client-session"
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 429) {
          if (data?.cooldownSeconds) {
            setCountdown(data.cooldownSeconds);
          }
          throw new Error(data.error || "Bạn đã yêu cầu gửi mã quá nhiều lần. Hãy thử lại sau 15 phút.");
        }
        throw new Error(data.error || "Không thể gửi mã. Vui lòng thử lại sau.");
      }

      setNormalizedPhone(phoneValidation.normalizedPhone);
      setMaskedPhone(data.phoneMasked || maskPhoneDisplay(phoneValidation.normalizedPhone));
      setGenericNotice("Mã xác thực gồm 6 chữ số đã được gửi qua tin nhắn SMS.");
      setStep("otp");
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi khi gửi mã. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      await loginWithGoogle();
      window.location.href = returnUrl;
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Không thể đăng nhập bằng Google. Vui lòng thử lại sau.");
      }
      setIsGoogleLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = clean.slice(-1) || "";
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join("").trim();
    if (fullOtp.length !== 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã xác thực OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginWithPhoneOtp(normalizedPhone || phoneNumber, fullOtp);
      window.location.href = returnUrl;
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Mã xác thực không chính xác hoặc đã hết hiệu lực.");
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#0f172a] relative overflow-hidden select-none">
      
      {/* Decorative ambient background glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      {/* Main Central Card Container */}
      <div className="w-full max-w-5xl rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-indigo-950/50 border border-white/20 grid grid-cols-1 lg:grid-cols-12 relative z-10">
        
        {/* ========================================================= */}
        {/* CỘT TRÁI: ILLUSTRATION & BRANDING (5 / 12 Cột) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#4338ca] via-[#3730a3] to-[#1e1b4b] p-8 lg:p-10 flex-col justify-between relative overflow-hidden text-white">
          
          {/* Header Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-teal-300 shadow-md">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C7.5 2 4 4.5 4 8c0 2.5 1.5 5 2.5 7.5S8 21 10 22c1.5.8 2.5-.5 2-.5-.5 0-1-1-1-2s1-2 1-3.5c0-.5 0-1-.5-1.5s-1-.5-1-.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5c1.2 0 2 .8 2 2 0 1-.5 2-.5 3s.5 2 1 2c1.2 0 2-1 2-2s-.5-2-.5-3.5c0-1.5.5-2.5 1.5-3.5s1.5-2 1.5-3.5c0-3.5-3.5-6-8-6z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block">
                {SITE.name}
              </span>
              <span className="text-xs text-indigo-200 tracking-wide">
                Hệ thống Nha khoa Kỹ thuật số
              </span>
            </div>
          </div>

          {/* Centerpiece Vector Illustration */}
          <div className="relative z-10 my-auto py-6 flex flex-col items-center">
            
            {/* SVG Artwork: Character, Wave, Plants & Flying Paper Plane */}
            <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
              
              {/* Fluid Organic Backdrop Waves */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300" fill="none">
                <path
                  d="M45 150C30 90 85 45 150 45C215 45 270 90 255 150C240 210 190 265 130 260C70 255 60 210 45 150Z"
                  fill="url(#organicGrad)"
                  opacity="0.35"
                />
                <path
                  d="M60 170C40 120 90 70 150 70C210 70 250 110 240 170C230 230 180 250 135 245C90 240 80 220 60 170Z"
                  fill="url(#organicGrad2)"
                  opacity="0.5"
                />
                
                {/* Botanical Leaves Left */}
                <path
                  d="M50 220C40 180 70 160 90 175C110 190 85 230 50 220Z"
                  fill="#14b8a6"
                  opacity="0.8"
                />
                <path
                  d="M35 190C25 160 55 140 70 155C85 170 60 200 35 190Z"
                  fill="#2dd4bf"
                  opacity="0.9"
                />

                {/* Botanical Leaves Right (Coral & Orange Accents) */}
                <path
                  d="M230 210C260 180 240 150 220 165C200 180 210 220 230 210Z"
                  fill="#f97316"
                  opacity="0.85"
                />
                <path
                  d="M245 175C270 150 250 130 235 145C220 160 230 185 245 175Z"
                  fill="#fb923c"
                  opacity="0.9"
                />

                {/* Flying Paper Plane (Signature element from sample) */}
                <g transform="translate(60, 75) rotate(-15) scale(0.9)">
                  <path d="M0 25L35 0L15 35L12 22L0 25Z" fill="#38bdf8" />
                  <path d="M12 22L35 0L15 35L12 22Z" fill="#0284c7" opacity="0.6" />
                </g>

                {/* Sparkling Stars */}
                <circle cx="230" cy="85" r="3" fill="#fde047" />
                <path d="M220 60L222 66L228 68L222 70L220 76L218 70L212 68L218 66Z" fill="#fde047" opacity="0.8" />
                <circle cx="80" cy="110" r="2.5" fill="#f43f5e" />
                <circle cx="100" cy="65" r="2" fill="#38bdf8" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="organicGrad" x1="0" y1="0" x2="300" y2="300" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="1" stopColor="#06b6d4" />
                  </linearGradient>
                  <linearGradient id="organicGrad2" x1="50" y1="50" x2="250" y2="250" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8b5cf6" />
                    <stop offset="1" stopColor="#0d9488" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Patient Vector Character Silhouette / Smile Illustration */}
              <div className="relative z-10 w-44 h-44 rounded-full bg-white/10 backdrop-blur-md border border-white/20 p-4 shadow-xl flex items-center justify-center">
                <svg className="w-28 h-28 text-white drop-shadow-md" viewBox="0 0 100 100" fill="none">
                  {/* Modern Smiling Character */}
                  <circle cx="50" cy="36" r="18" fill="#fde047" />
                  {/* Hair */}
                  <path d="M32 32C32 20 40 14 52 14C64 14 70 22 68 34C60 26 44 26 32 32Z" fill="#1e1b4b" />
                  {/* Smile */}
                  <path d="M43 40C45 44 55 44 57 40" stroke="#1e1b4b" strokeWidth="2.5" strokeLinecap="round" />
                  {/* Eyes */}
                  <circle cx="43" cy="32" r="2" fill="#1e1b4b" />
                  <circle cx="57" cy="32" r="2" fill="#1e1b4b" />
                  {/* Torso */}
                  <path d="M26 78C26 62 36 56 50 56C64 56 74 62 74 78" fill="#38bdf8" />
                  {/* Digital Tablet / Health record */}
                  <rect x="38" y="62" width="24" height="28" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
                  {/* Tooth emblem on tablet */}
                  <path d="M50 69C48 69 46 70 46 72C46 73 47 75 48 76L50 78L52 76C53 75 54 73 54 72C54 70 52 69 50 69Z" fill="#14b8a6" />
                  <line x1="42" y1="82" x2="58" y2="82" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="44" y1="86" x2="56" y2="86" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>

            </div>

            {/* Inspiring Headline */}
            <div className="text-center mt-4">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Chăm sóc Nụ cười Toàn diện
              </h2>
              <p className="text-sm text-indigo-200 mt-2 max-w-[280px] leading-relaxed">
                Tra cứu sổ khám bệnh điện tử, theo dõi phác đồ và đơn thuốc mọi lúc, mọi nơi.
              </p>
            </div>

          </div>

          {/* Left Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-xs text-indigo-300 border-t border-white/10 pt-4">
            <span>Bảo mật y tế cá nhân</span>
            <span>Hỗ trợ 24/7</span>
          </div>

        </div>

        {/* ========================================================= */}
        {/* CỘT PHẢI: FORM ĐĂNG NHẬP & GOOGLE AUTH (7 / 12 Cột) */}
        {/* ========================================================= */}
        <div className="col-span-1 lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          
          {/* Top Bar for Back Navigation & Hotline */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-indigo-600 transition"
              title="Quay lại Trang chủ Cổng bệnh nhân"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>

            <div className="ml-auto">
              <a
                href="tel:19006868"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 px-3 py-1.5 rounded-full transition"
              >
                <Headphones className="w-4 h-4" />
                <span>Hotline: 1900 6868</span>
              </a>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="my-auto py-4 max-w-[380px] w-full mx-auto">
            
            {/* User Icon Circle Avatar (Style inspired from top-left sample) */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-inner">
                <UserIcon className="w-8 h-8" />
              </div>
            </div>

            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {step === "phone" ? "Đăng nhập" : "Xác thực mã bảo mật"}
              </h1>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {step === "phone"
                  ? "Chọn phương thức thuận tiện để vào sổ khám bệnh"
                  : `Mã OTP gồm 6 chữ số đã được gửi tới ${maskedPhone || phoneNumber}.`}
              </p>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-700"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-700 font-bold text-lg leading-none"
                >
                  &times;
                </button>
              </div>
            )}

            {/* STEP 1: PHONE OR GOOGLE LOGIN */}
            {step === "phone" && (
              <div className="space-y-4">
                
                {/* 1. GOOGLE LOGIN BUTTON */}
                <button
                  type="button"
                  disabled={isGoogleLoading || isLoading}
                  onClick={handleGoogleLogin}
                  className="w-full h-12 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-60"
                >
                  {isGoogleLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
                      <span>Đang kết nối Google...</span>
                    </>
                  ) : (
                    <>
                      {/* Official Google Multicolor 'G' Icon */}
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Tiếp tục với Google</span>
                    </>
                  )}
                </button>

                {/* Divider Line */}
                <div className="relative flex items-center justify-center my-4">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-xs uppercase font-medium text-slate-400 shrink-0">
                    Hoặc số điện thoại
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                {/* 2. PHONE OTP FORM */}
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label
                      htmlFor="patient-phone"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5"
                    >
                      Số điện thoại khám bệnh
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        id="patient-phone"
                        type="tel"
                        required
                        autoFocus
                        inputMode="numeric"
                        autoComplete="tel-national"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0912 345 678"
                        className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-base font-semibold placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all"
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div>
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
                      <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={consentAgreed}
                        onChange={(e) => setConsentAgreed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span>
                        Tôi đồng ý với{" "}
                        <Link
                          href={SITE.termsUrl}
                          target="_blank"
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                        >
                          Điều khoản
                        </Link>{" "}
                        và{" "}
                        <Link
                          href={SITE.privacyUrl}
                          target="_blank"
                          rel="noopener"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                        >
                          Chính sách bảo mật
                        </Link>
                        .
                      </span>
                    </label>
                  </div>

                  {/* Primary Action Button (Gradient Violet/Indigo - matching samples) */}
                  <button
                    type="submit"
                    disabled={isLoading || isGoogleLoading}
                    className="w-full h-12 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                        <span>Đang gửi mã...</span>
                      </>
                    ) : (
                      <>
                        <span>Nhận mã xác thực OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

              </div>
            )}

            {/* STEP 2: VERIFY 6-DIGIT OTP */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                
                {/* Phone recap card */}
                <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                  <div>
                    <span className="text-indigo-600 font-medium">Mã gửi tới:</span>
                    <p className="font-bold text-sm text-indigo-950 mt-0.5">{maskedPhone || phoneNumber}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setErrorMessage(null);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đổi số</span>
                  </button>
                </div>

                {/* 6 Auto-Advancing OTP Inputs */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 text-center">
                    Nhập mã 6 chữ số
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputsRef.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        aria-label={`Chữ số xác thực thứ ${idx + 1}`}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`h-13 w-full text-center text-xl font-bold font-mono rounded-xl border transition-all focus:outline-none ${
                          digit
                            ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-2 ring-indigo-200"
                            : "border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend Controls */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Không nhận được tin nhắn?</span>
                  {countdown > 0 ? (
                    <span className="flex items-center gap-1 font-semibold text-indigo-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Gửi lại sau {countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      disabled={isLoading}
                      className="font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                    >
                      Gửi lại mã mới
                    </button>
                  )}
                </div>

                {/* Confirm Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-white" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Xác nhận & Vào sổ khám</span>
                    </>
                  )}
                </button>
              </form>
            )}

          </div>

          {/* Card Footer with Policy Links */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span>&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</span>
            <div className="flex gap-3">
              <Link href={SITE.privacyUrl} className="hover:text-indigo-600 transition">
                Chính sách bảo mật
              </Link>
              <Link href={SITE.termsUrl} className="hover:text-indigo-600 transition">
                Điều khoản
              </Link>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <PatientLoginForm />
    </Suspense>
  );
}
