"use client";

import { useState } from "react";
import type { InvoiceDto } from "@/types/invoice";
import { ThermalReceipt80mm } from "./ThermalReceipt80mm";
import { A4InvoicePrint } from "./A4InvoicePrint";

interface InvoicePrintModalProps {
  invoice: InvoiceDto;
  onClose: () => void;
  defaultFormat?: "thermal" | "a4";
}

export function InvoicePrintModal({
  invoice,
  onClose,
  defaultFormat = "thermal",
}: InvoicePrintModalProps) {
  const [format, setFormat] = useState<"thermal" | "a4">(defaultFormat);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-area,
          #printable-area * {
            visibility: visible !important;
          }
          #printable-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col my-auto max-h-[95vh] overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-gray-900">
              In hóa đơn & Phiếu thu: {invoice.invoiceNumber}
            </h2>

            {/* Format toggle tabs */}
            <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFormat("thermal")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  format === "thermal"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🧾 Khổ 80mm (In nhiệt K80)
              </button>
              <button
                type="button"
                onClick={() => setFormat("a4")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  format === "a4"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                📄 Khổ A4 (Có chữ ký)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <span>🖨️</span> In ngay
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Preview Container */}
        <div className="overflow-y-auto flex-1 p-6 bg-gray-100/70 flex justify-center print:bg-white print:p-0">
          <div id="printable-area" className="bg-white shadow-lg rounded-xl print:shadow-none print:rounded-none overflow-hidden">
            {format === "thermal" ? (
              <ThermalReceipt80mm invoice={invoice} />
            ) : (
              <A4InvoicePrint invoice={invoice} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
