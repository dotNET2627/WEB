import { NextRequest, NextResponse } from "next/server";
import { createPatientSession } from "@/lib/otp-security";

export async function POST(request: NextRequest) {
  try {
    // Giả lập xác thực OAuth Google token / ID Token phía server
    // Trong môi trường production, tích hợp google-auth-library verifyIdToken
    const isProduction = process.env.NODE_ENV === "production";

    // Khởi tạo phiên làm việc bảo mật cho bệnh nhân đăng nhập bằng Google
    const googleEmail = "patient.clinic@gmail.com";
    const googleName = "Bệnh nhân Google";
    const { sessionId } = createPatientSession(googleEmail);

    const user = {
      id: "patient-google-" + Date.now().toString().slice(-6),
      email: googleEmail,
      fullName: googleName,
      phoneNumber: "0912345678",
      patientCode: "BN-GOOGLE",
      activeClinicId: null,
      roles: ["Patient"],
      permissions: ["patient.read_records", "patient.book_appointment"],
      assignedClinicIds: []
    };

    const response = NextResponse.json(
      {
        success: true,
        message: "Đăng nhập bằng tài khoản Google thành công.",
        user
      },
      { status: 200 }
    );

    // Cấp Cookie HttpOnly an toàn
    response.cookies.set({
      name: "patient_session",
      value: sessionId,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60
    });

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
    console.error("[GOOGLE AUTH ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đăng nhập Google thất bại. Vui lòng thử lại sau."
      },
      { status: 500 }
    );
  }
}
