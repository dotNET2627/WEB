export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("vi-VN");
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("vi-VN");
}
