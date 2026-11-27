import { NextRequest, NextResponse } from "next/server";
import { createPatientSession } from "@/lib/otp-security";
import { verifyGoogleIdToken } from "@/lib/google-auth";

export async function POST(request: NextRequest) {
  // NextRequest import
  try {
    const body = await request.json().catch(() => ({}));
    const idToken = typeof body?.idToken === "string" ? body.idToken : null;

    const isProduction = process.env.NODE_ENV === "production";

    let googleEmail = "patient.clinic@gmail.com";
    let googleName = "Bệnh nhân Google";

    if (idToken) {
      const verified = await verifyGoogleIdToken(idToken);
      if (!verified) {
        return NextResponse.json(
          { success: false, error: "Mã xác thực Google không hợp lệ hoặc đã hết hạn." },
          { status: 401 }
        );
      }
      googleEmail = verified.email;
      googleName = verified.name;
    } else if (isProduction) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã xác thực Google. Vui lòng đăng nhập lại." },
        { status: 400 }
      );
    }
    // Dev fallback: mock user when no client ID / no token provided

    const { sessionId } = await createPatientSession({ email: googleEmail });

    const user = {
      id: "patient-google-" + Date.now().toString().slice(-6),
      email: googleEmail,
      fullName: googleName,
      phoneNumber: null,
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
