import { NextRequest, NextResponse } from "next/server";
import { revokePatientSession } from "@/lib/otp-security";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("patient_session")?.value;

    // Hủy session server-side (nếu còn tồn tại)
    if (sessionId) {
      await revokePatientSession(sessionId);
    }

    const isProduction = process.env.NODE_ENV === "production";

    const response = NextResponse.json(
      {
        success: true,
        message: "Đã đăng xuất thành công."
      },
      { status: 200 }
    );

    // Xóa cookie phiên bệnh nhân (phải khớp path/domain với lúc set)
    response.cookies.set({
      name: "patient_session",
      value: "",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });

    response.cookies.set({
      name: "auth_session",
      value: "",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });

    response.cookies.set({
      name: "auth_role",
      value: "",
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });

    return response;
  } catch (error) {
    console.error("[PATIENT LOGOUT ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: "Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau."
      },
      { status: 500 }
    );
  }
}
