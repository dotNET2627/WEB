import { NextRequest, NextResponse } from "next/server";
import {
  checkOtpRateLimit,
  generateSecureOtp,
  GENERIC_OTP_SENT_MESSAGE,
  recordOtpRequest,
  storeOtp
} from "@/lib/otp-security";
import { validateVietnamesePhone } from "@/lib/phone-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phoneNumber || "";
    const captchaToken = body?.captchaToken;

    // 1. Kiểm tra định dạng số điện thoại Việt Nam (+84 / 10 số)
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

    // 2. Trích xuất địa chỉ IP của Client để Rate Limit
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    // 3. Kiểm tra Rate Limit đa tầng (SĐT 3 lần/10m, IP 5 lần/15m, Cooldown 60s)
    const rateLimitCheck = checkOtpRateLimit(normalizedPhone, clientIp);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: rateLimitCheck.reason,
          retryAfterSeconds: rateLimitCheck.retryAfterSeconds
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitCheck.retryAfterSeconds || 60)
          }
        }
      );
    }

    // 4. Kiểm tra CAPTCHA Token (ngăn chặn bot spam SMS)
    // Nếu môi trường production yêu cầu CAPTCHA
    if (process.env.NODE_ENV === "production" && !captchaToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng hoàn thành xác thực CAPTCHA trước khi gửi mã."
        },
        { status: 400 }
      );
    }

    // 5. Sinh mã OTP ngẫu nhiên mật mã học (CSPRNG) và băm SHA-256 lưu trữ
    const otp = generateSecureOtp(6);
    storeOtp(normalizedPhone, otp);
    recordOtpRequest(normalizedPhone, clientIp);

    // 6. Gửi OTP qua SMS Gateway / Zalo ZNS trong môi trường thực tế
    // TODO: Tích hợp dịch vụ SMS Brandname hoặc Zalo ZNS chính thức của phòng khám
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEV OTP DISPATCH] SĐT: ${normalizedPhone} | Mã OTP: ${otp} | Hết hạn: 5 phút`);
    }

    // 7. PHẢN HỒI ĐỒNG NHẤT (Chống tấn công Account Enumeration)
    // Tuyệt đối không tiết lộ số này đã có hồ sơ tại phòng khám hay chưa
    return NextResponse.json(
      {
        success: true,
        message: GENERIC_OTP_SENT_MESSAGE,
        cooldownSeconds: 60
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[OTP SEND ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau."
      },
      { status: 500 }
    );
  }
}
