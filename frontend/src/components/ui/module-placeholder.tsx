import { PageHeading } from "@/components/ui/page-heading";

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <PageHeading title={title} description={description} />
      <section className="rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-sm text-[var(--muted)]">
        Module này đã có route và vị trí tổ chức mã nguồn. Bổ sung danh sách, form và gọi API trong thư mục feature tương ứng.
      </section>
    </div>
  );
}
