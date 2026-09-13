import { PageHeading } from "@/components/ui/page-heading";
import { StatCard } from "@/components/ui/stat-card";

const stats = [
  { label: "Lịch hẹn hôm nay", value: "0", description: "Kết nối API để hiển thị dữ liệu thực" },
  { label: "Bệnh nhân mới", value: "0", description: "Trong tháng hiện tại" },
  { label: "Doanh thu hôm nay", value: "0 ₫", description: "Từ hóa đơn đã thanh toán" },
  { label: "Vật tư sắp hết", value: "0", description: "Theo mức tồn tối thiểu" }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Tổng quan" description="Theo dõi hoạt động phòng khám trong ngày." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
      </section>
      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold">Bắt đầu tích hợp dữ liệu</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Kết nối các service trong thư mục <code>src/services</code> với ASP.NET Core API để hiển thị dữ liệu MongoDB thực tế.
        </p>
      </section>
    </div>
  );
}
