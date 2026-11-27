import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// =========================================================================
// DANH SÁCH CÁC ĐƯỜNG LINK ĐÃ CÓ TRONG HỆ THỐNG (KNOWN ROUTES)
// =========================================================================

// Các đường dẫn khớp chính xác
const EXACT_KNOWN_ROUTES = new Set([
  "/",
  "/login",
  "/forgot-password",
  "/portal",
  "/portal/login",
  "/portal/booking",
  "/portal/dashboard",
  "/admin",
  "/admin/login",
  "/admin/dashboard",
  "/dashboard",
]);

// Các tiền tố đường dẫn hợp lệ của từng phân hệ
const KNOWN_ROUTE_PREFIXES = [
  // 1. Phân hệ Quản trị hệ thống (Admin Portal)
  "/admin/dashboard",
  "/admin/users",
  "/admin/roles",
  "/admin/clinics",
  "/admin/audit-logs",
  "/admin/settings",

  // 2. Phân hệ Bệnh nhân (Patient Portal)
  "/portal/dashboard",

  // 3. Phân hệ Nghiệp vụ Phòng khám (Clinic Staff Portal)
  "/appointments",
  "/clinics",
  "/doctor",
  "/doctors",
  "/insurance",
  "/inventory",
  "/invoices",
  "/patients",
  "/prescriptions",
  "/settings",
  "/treatment-plans",
];

const CLINIC_PUBLIC_PATHS = ["/login", "/forgot-password"];
const PATIENT_PUBLIC_PATHS = ["/portal", "/portal/login", "/portal/booking"];

function isKnownRoute(pathname: string): boolean {
  if (EXACT_KNOWN_ROUTES.has(pathname)) return true;
  return KNOWN_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("auth_session");
  const authRole = request.cookies.get("auth_role")?.value?.toLowerCase();

  // =========================================================================
  // 0. CHUYỂN HƯỚNG TRANG CHỦ (localhost:3000 / "/") VÀO CỔNG THÔNG TIN (/portal)
  // =========================================================================
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  // =========================================================================
  // 1. KIỂM TRA ĐƯỜNG LINK CÓ THUỘC CÁC ĐƯỜNG LINK ĐÃ CÓ KHÔNG
  // Nếu không thuộc các đường link đã có -> Cho qua để Next.js render trang lỗi 404
  // =========================================================================
  if (!isKnownRoute(pathname)) {
    return NextResponse.next();
  }

  // =========================================================================
  // 2. VÙNG ADMIN PORTAL (/admin, /admin/*)
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
  // 3. VÙNG PATIENT PORTAL (/portal, /portal/*)
  // =========================================================================
  const isPatientRoute = pathname === "/portal" || pathname.startsWith("/portal/");
  if (isPatientRoute) {
    const isPatientPublic = PATIENT_PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Truy cập root /portal (Landing Page công khai giới thiệu Cổng Bệnh nhân)
    if (pathname === "/portal") {
      return NextResponse.next();
    }

    // Chế độ phát triển (Development): Bỏ qua kiểm tra đăng nhập để test trực tiếp giao diện Patient Portal
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.next();
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
  // 4. VÙNG CLINIC STAFF PORTAL (Tất cả các route hợp lệ còn lại của phòng khám)
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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
