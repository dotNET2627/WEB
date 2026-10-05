import { NextRequest, NextResponse } from "next/server";
import { createPatientSession, verifyOtp } from "@/lib/otp-security";
import { maskPhoneDisplay, validateVietnamesePhone } from "@/lib/phone-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phoneNumber || "";
    const otp = body?.otp || "";

    // 1. Kiểm tra tính hợp lệ của số điện thoại
    const phoneValidation = validateVietnamesePhone(rawPhone);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: phoneValidation.errorMessage || "Số điện thoại không hợp lệ."
        },
        { status: 400 }
      );
    }

    const normalizedPhone = phoneValidation.normalizedPhone;

    // 2. Kiểm tra định dạng OTP 6 chữ số
    const cleanOtp = String(otp).trim();
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        {
          success: false,
          error: "Mã OTP phải gồm đúng 6 chữ số."
        },
        { status: 400 }
      );
    }

    // 3. Xác thực mã OTP (Kiểm tra TTL 5 phút, đếm 5 lần sai, timing-safe so khớp hash)
    const verification = verifyOtp(normalizedPhone, cleanOtp);
    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          error: verification.errorMessage,
          remainingAttempts: verification.remainingAttempts
        },
        { status: 400 }
      );
    }

    // 4. Khởi tạo Session Server-side độc lập cho Bệnh nhân
    // Tuyệt đối không nhận patientId từ client! Server tự sinh ID phiên và phân quyền
    const { sessionId } = createPatientSession(normalizedPhone);

    const isProduction = process.env.NODE_ENV === "production";

    // 5. Cấp Cookie HttpOnly an toàn cho trình duyệt
    const response = NextResponse.json(
      {
        success: true,
        message: "Xác thực thành công. Đang chuyển hướng vào sổ khám.",
        phoneMasked: maskPhoneDisplay(normalizedPhone),
        user: {
          id: `patient-${normalizedPhone}`,
          email: `${normalizedPhone}@patient.dentalcare.vn`,
          fullName: "Bệnh nhân " + (normalizedPhone.length >= 4 ? normalizedPhone.slice(-4) : normalizedPhone),
          phoneNumber: normalizedPhone,
          patientCode: `BN-2026-${normalizedPhone.slice(-4)}`,
          activeClinicId: null,
          roles: ["Patient"],
          permissions: ["patient.read_records", "patient.book_appointment"],
          assignedClinicIds: []
        }
      },
      { status: 200 }
    );

    // Cookie phiên bí mật của Bệnh nhân (HttpOnly, Secure, SameSite)
    response.cookies.set({
      name: "patient_session",
      value: sessionId,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 ngày
    });

    // Cờ đánh dấu phiên Next.js Edge Middleware
    response.cookies.set({
      name: "auth_session",
      value: "1",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    response.cookies.set({
      name: "auth_role",
      value: "patient",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

    return response;
  } catch (error) {
    console.error("[OTP VERIFY ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại sau."
      },
      { status: 500 }
    );
  }
}
