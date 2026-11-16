"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { invoiceService } from "@/services/invoice-service";
import type { InvoiceDto } from "@/types/invoice";
import { InvoiceDetail } from "@/features/billing/InvoiceDetail";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await invoiceService.getById(id);
      setInvoice(data);
    } catch (err) {
      console.error(err);
      setError("Không tìm thấy thông tin hóa đơn hoặc có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Quay lại danh sách hóa đơn
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-gray-400">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-2 text-sm">Đang tải hóa đơn...</p>
        </div>
      ) : error || !invoice ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-semibold">{error || "Hóa đơn không tồn tại"}</p>
          <button
            onClick={() => router.push("/invoices")}
            className="mt-4 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Quay lại
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs">
          <InvoiceDetail
            invoice={invoice}
            onRefresh={fetchInvoice}
            onCancel={fetchInvoice}
          />
        </div>
      )}
    </div>
  );
}
