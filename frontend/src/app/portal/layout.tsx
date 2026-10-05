import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cổng Bệnh Nhân - Sổ Khám Bệnh Nha Khoa Điện Tử | DentalCare",
  description: "Tra cứu hồ sơ điều trị, theo dõi phác đồ nụ cười, đơn thuốc và lịch hẹn tái khám nha khoa trực tuyến nhanh chóng, bảo mật."
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
