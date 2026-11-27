"use client";

import React from "react";
import type { InvoiceDto } from "@/types/invoice";
import { formatDateTime, formatVND } from "@/lib/format";

interface ThermalReceipt80mmProps {
  invoice: InvoiceDto;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export const ThermalReceipt80mm = React.forwardRef<HTMLDivElement, ThermalReceipt80mmProps>(
  function ThermalReceipt80mm(
    {
      invoice,
      clinicName = "NHA KHOA DENTALCARE",
      clinicAddress = "123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
      clinicPhone = "0901.234.567 - (028) 38.888.999",
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        id="thermal-receipt-80mm"
        className="w-[80mm] max-w-[80mm] bg-white p-3 font-mono text-xs text-black leading-tight mx-auto"
        style={{ width: "80mm", color: "#000", fontFamily: "'Courier New', Courier, monospace" }}
      >
        {/* Clinic Header */}
        <div className="text-center pb-2 border-b border-dashed border-black">
          <h2 className="text-sm font-black uppercase tracking-wider">{clinicName}</h2>
          <p className="text-[10px] mt-0.5">{clinicAddress}</p>
          <p className="text-[10px]">Hotline: {clinicPhone}</p>
        </div>

        {/* Receipt Title */}
        <div className="text-center py-2 border-b border-dashed border-black">
          <h1 className="text-sm font-black uppercase">PHIẾU THU TIỀN VIỆN PHÍ</h1>
          <p className="text-[10px] mt-0.5">Số: {invoice.invoiceNumber}</p>
          <p className="text-[10px]">Ngày: {formatDateTime(invoice.issuedAt)}</p>
        </div>

        {/* Patient Info */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[11px]">
          <div className="flex justify-between">
            <span>Bệnh nhân:</span>
            <span className="font-bold">{invoice.patientName}</span>
          </div>
          {invoice.appointmentId && (
            <div className="flex justify-between text-[10px]">
              <span>Lịch hẹn:</span>
              <span>{invoice.appointmentId.slice(0, 8)}...</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left pb-1">Dịch vụ</th>
                <th className="text-center pb-1">SL</th>
                <th className="text-right pb-1">Đơn giá</th>
                <th className="text-right pb-1">T.Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dotted divide-gray-400">
              {invoice.lines.map((line, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-1 pr-1">
                    <span className="font-bold block">{line.description}</span>
                    {line.toothNumber && (
                      <span className="text-[9px] text-gray-700">Răng: {line.toothNumber}</span>
                    )}
                  </td>
                  <td className="py-1 text-center">{line.quantity}</td>
                  <td className="py-1 text-right">{formatVND(line.unitPrice)}</td>
                  <td className="py-1 text-right font-bold">{formatVND(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{formatVND(invoice.subTotal)}</span>
          </div>

          {invoice.discountValue > 0 && (
            <div className="flex justify-between text-[10px]">
              <span>Chiết khấu {invoice.discountPercent > 0 ? `(${invoice.discountPercent}%)` : ""}:</span>
              <span>-{formatVND(invoice.discountValue)}</span>
            </div>
          )}

          <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
            <span>TỔNG CỘNG:</span>
            <span>{formatVND(invoice.totalAmount)}</span>
          </div>

          <div className="flex justify-between font-bold pt-1">
            <span>Đã thanh toán:</span>
            <span>{formatVND(invoice.paidAmount)}</span>
          </div>

          {invoice.outstandingAmount > 0 && (
            <div className="flex justify-between text-xs font-black text-black pt-1 border-t border-dotted border-black">
              <span>CÒN LẠI (NỢ):</span>
              <span>{formatVND(invoice.outstandingAmount)}</span>
            </div>
          )}
        </div>

        {/* Payment History Breakdown if any */}
        {invoice.payments.length > 0 && (
          <div className="py-2 border-b border-dashed border-black text-[10px]">
            <span className="font-bold block mb-1">Phương thức thanh toán:</span>
            {invoice.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>
                  • {p.method === "Cash" ? "Tiền mặt" : p.method === "Transfer" ? "VietQR" : p.method === "Card" ? "Thẻ POS" : p.method}
                  {p.reference ? ` (${p.reference})` : ""}
                </span>
                <span className="font-bold">{formatVND(p.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-3 space-y-1 text-[10px]">
          <p className="font-bold">Cảm ơn Quý khách & Chúc Quý khách có nụ cười rạng rỡ!</p>
          <p className="italic text-[9px] text-gray-700">
            Quý khách vui lòng kiểm tra kỹ phiếu thu trước khi rời quầy.
          </p>
          <p className="text-[9px] pt-1">--- HẸN GẶP LẠI QUÝ KHÁCH ---</p>
        </div>
      </div>
    );
  }
);
