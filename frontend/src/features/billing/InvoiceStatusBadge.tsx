import type { InvoiceStatus } from "@/types/invoice";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string }
> = {
  Unpaid: {
    label: "Chưa thanh toán",
    className:
      "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
  },
  PartiallyPaid: {
    label: "Thanh toán một phần",
    className:
      "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
  },
  Paid: {
    label: "Đã thanh toán",
    className:
      "bg-green-100 text-green-800 ring-1 ring-green-200",
  },
  Cancelled: {
    label: "Đã hủy",
    className:
      "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  },
};

export function InvoiceStatusBadge({ status }: InvoiceStatusBadgeProps) {
  const { label, className } = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}
