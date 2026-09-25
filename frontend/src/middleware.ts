import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CLINIC_PUBLIC_PATHS = ["/login", "/forgot-password"];
const PATIENT_PUBLIC_PATHS = ["/portal/login", "/portal/booking"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("auth_session");
  const authRole = request.cookies.get("auth_role")?.value?.toLowerCase();

  // =========================================================================
  // 1. VÙNG 1: ADMIN PORTAL (/admin, /admin/*)
  // =========================================================================
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdminRoute) {
    const isAdminLogin = pathname === "/admin/login";

    // Chưa có session mà cố vào các trang /admin/* (khác /admin/login)
    if (!hasSession && !isAdminLogin) {
      const adminLoginUrl = new URL("/admin/login", request.url);
      adminLoginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(adminLoginUrl);
    }

    // Đã có session nhưng không phải superadmin cố truy cập các trang /admin/* (khác /admin/login)
    if (hasSession && authRole !== "superadmin" && !isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }

    // Đã đăng nhập với quyền superadmin mà truy cập /admin/login
    if (hasSession && authRole === "superadmin" && isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // =========================================================================
  // 2. VÙNG 2: PATIENT PORTAL (/portal, /portal/*)
  // =========================================================================
  const isPatientRoute = pathname === "/portal" || pathname.startsWith("/portal/");
  if (isPatientRoute) {
    const isPatientPublic = PATIENT_PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Truy cập root /portal
    if (pathname === "/portal") {
      if (hasSession && authRole === "patient") {
        return NextResponse.redirect(new URL("/portal/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }

    // Chưa có session mà vào trang bệnh nhân bảo vệ
    if (!hasSession && !isPatientPublic) {
      const patientLoginUrl = new URL("/portal/login", request.url);
      patientLoginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(patientLoginUrl);
    }

    // Đã có session nhưng không phải patient (ví dụ nhân viên/admin) vào trang bảo vệ bệnh nhân
    if (hasSession && authRole !== "patient" && !isPatientPublic) {
      return NextResponse.redirect(new URL("/portal/login?error=unauthorized", request.url));
    }

    // Đã đăng nhập bệnh nhân mà truy cập /portal/login
    if (hasSession && authRole === "patient" && pathname === "/portal/login") {
      return NextResponse.redirect(new URL("/portal/dashboard", request.url));
    }

    return NextResponse.next();
  }

  // =========================================================================
  // 3. VÙNG 3: CLINIC STAFF PORTAL (Tất cả các route còn lại: /*)
  // =========================================================================
  const isClinicPublic = CLINIC_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // CHẶN TRUY CẬP CHÉO: Bệnh nhân (patient) cố truy cập vào các trang nghiệp vụ phòng khám
  if (hasSession && authRole === "patient" && !isClinicPublic && pathname !== "/") {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  // Chưa có cookie mà vào các trang nghiệp vụ phòng khám (/dashboard, /patients,...)
  if (!hasSession && !isClinicPublic) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Đã có cookie nhân viên/admin mà truy cập /login
  if (
    hasSession &&
    (authRole === "superadmin" ||
      authRole === "staff" ||
      authRole === "doctor" ||
      authRole === "receptionist") &&
    pathname === "/login"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Bệnh nhân truy cập /login -> đá sang /portal/dashboard
  if (hasSession && authRole === "patient" && pathname === "/login") {
    return NextResponse.redirect(new URL("/portal/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

