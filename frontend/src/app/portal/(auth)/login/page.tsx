"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

function PatientLoginForm() {
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl");
  const returnUrl = rawReturnUrl && rawReturnUrl.startsWith("/portal") ? rawReturnUrl : "/portal/dashboard";

  const { loginWithPhoneOtp } = useAuth();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized") {
      setErrorMessage("Vui lòng xác thực tài khoản Bệnh nhân để truy cập sổ khám.");
    }
  }, [searchParams]);

  // Bộ đếm thời gian gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = phoneNumber.trim().replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMessage("Vui lòng nhập số điện thoại Việt Nam hợp lệ gồm 10 chữ số (Ví dụ: 0912345678).");
      return;
    }

    setErrorMessage(null);
    setStep("otp");
    setCountdown(60);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage("Vui lòng nhập đủ 6 chữ số mã xác thực OTP.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await loginWithPhoneOtp(phoneNumber, otp.trim());
      // Chuyển hướng dứt khoát để Next.js Edge Middleware nhận diện cookie tức thì
      window.location.href = returnUrl;
    } catch (err) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại với mã 123456.");
      }
      setIsLoading(false);
    }
  };

  const handleFillDemoPhone = () => {
    setPhoneNumber("0912345678");
    setErrorMessage(null);
  };

  const handleFillDemoOtp = () => {
    setOtp("123456");
    setErrorMessage(null);
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-cyan-50/70 via-sky-50/40 to-emerald-50/50 text-slate-800 overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />

      <div className="relative w-full max-w-[440px] z-10">
        <div className="rounded-3xl border border-cyan-100 bg-white/95 p-8 shadow-2xl shadow-cyan-100/60 backdrop-blur-md">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-semibold text-cyan-700 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              Cổng Bệnh nhân (Patient Portal)
            </span>
          </div>

          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-3.5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 ring-4 ring-cyan-50">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sổ Khám Bệnh Điện Tử</h1>
            <p className="mt-1 text-sm text-slate-500">
              Tra cứu hồ sơ răng miệng, đơn thuốc và lịch hẹn nha khoa không cần mật khẩu
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-xs text-red-700">
              <svg className="h-4 w-4 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-600"
              >
                &times;
              </button>
            </div>
          )}

          {/* Step 1: Input Phone Number */}
          {step === "phone" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2" htmlFor="phone-input">
                  Số điện thoại đăng ký khám
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 text-sm font-medium">
                    <span>🇻🇳 +84</span>
                    <span className="h-4 w-px bg-slate-200" />
                  </div>
                  <input
                    id="phone-input"
                    type="tel"
                    required
                    autoFocus
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0912345678"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-24 pr-4 py-3 text-sm font-semibold tracking-wide text-slate-800 placeholder:text-slate-400 placeholder:font-normal transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleFillDemoPhone}
                  className="text-xs font-medium text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
                >
                  Dùng SĐT mẫu: 0912345678
                </button>
              </div>

              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition hover:from-cyan-500 hover:to-blue-500 active:scale-[0.99] cursor-pointer"
              >
                <span>Nhận mã xác thực OTP</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </form>
          )}

          {/* Step 2: Input 6-Digit OTP */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="rounded-2xl border border-cyan-100 bg-cyan-50/50 p-3.5 text-xs text-cyan-900 flex items-center justify-between">
                <div>
                  <p className="text-slate-500">Mã OTP đã gửi tới:</p>
                  <p className="font-bold text-sm text-cyan-800 font-mono mt-0.5">{phoneNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="rounded-lg bg-white border border-cyan-200 px-2.5 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                >
                  Đổi số
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2" htmlFor="otp-input">
                  Nhập mã xác thực 6 số
                </label>
                <input
                  id="otp-input"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[0.5em] font-mono text-xl font-bold rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 placeholder:text-slate-300 transition focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleFillDemoOtp}
                  className="font-medium text-cyan-600 hover:text-cyan-700 underline underline-offset-4"
                >
                  Dùng mã thử nghiệm: 123456
                </button>

                {countdown > 0 ? (
                  <span className="text-slate-400 font-mono">Gửi lại sau ({countdown}s)</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-cyan-600 hover:text-cyan-700"
                  >
                    Gửi lại mã
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Đang kiểm tra OTP...</span>
                  </>
                ) : (
                  <span>Xác nhận & Vào sổ khám</span>
                )}
              </button>
            </form>
          )}

          {/* Switch to Clinic Staff Login */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-500 hover:text-slate-700 transition inline-flex items-center gap-1.5 font-medium"
            >
              <span>Bạn là Bác sĩ hoặc Lễ tân?</span>
              <span className="text-cyan-600 hover:underline">Vào Cổng Nhân viên</span>
            </Link>
          </div>

          {/* Security Notice */}
          <div className="mt-4 text-center text-[11px] text-slate-400">
            <p>Xác thực không mật khẩu (Passwordless) theo chuẩn OWASP</p>
            <p className="mt-0.5">Tuyệt đối không chia sẻ mã OTP với bất kỳ ai</p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PatientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cyan-50/50 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
        </div>
      }
    >
      <PatientLoginForm />
    </Suspense>
  );
}
