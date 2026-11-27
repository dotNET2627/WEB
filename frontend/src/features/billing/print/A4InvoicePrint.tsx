"use client";

import React from "react";
import type { InvoiceDto } from "@/types/invoice";
import { formatDate, formatVND } from "@/lib/format";
import { numberToVietnameseWords } from "@/lib/number-to-words";

interface A4InvoicePrintProps {
  invoice: InvoiceDto;
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
  clinicTaxCode?: string;
}

export const A4InvoicePrint = React.forwardRef<HTMLDivElement, A4InvoicePrintProps>(
  function A4InvoicePrint(
    {
      invoice,
      clinicName = "HỆ THỐNG NHA KHOA DENTALCARE",
      clinicAddress = "123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh",
      clinicPhone = "0901.234.567 - (028) 38.888.999",
      clinicTaxCode = "0312345678",
    },
    ref
  ) {
    const today = new Date(invoice.issuedAt);
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    return (
      <div
        ref={ref}
        id="a4-invoice-print"
        className="w-[210mm] min-h-[297mm] bg-white p-10 font-sans text-gray-900 leading-normal mx-auto shadow-xs print:shadow-none print:p-0"
        style={{ width: "210mm", color: "#111" }}
      >
        {/* Top Header */}
        <div className="grid grid-cols-12 gap-4 pb-4 border-b-2 border-gray-900">
          {/* Clinic Brand */}
          <div className="col-span-7">
            <h2 className="text-base font-black uppercase text-blue-900 tracking-wider">
              {clinicName}
            </h2>
            <p className="text-xs text-gray-700 mt-1">
              <span className="font-semibold">Địa chỉ:</span> {clinicAddress}
            </p>
            <p className="text-xs text-gray-700">
              <span className="font-semibold">Hotline:</span> {clinicPhone} &nbsp;·&nbsp;
              <span className="font-semibold">MST:</span> {clinicTaxCode}
            </p>
          </div>

          {/* National Slogan */}
          <div className="col-span-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider">
              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </p>
            <p className="text-xs font-semibold underline underline-offset-4 mt-0.5">
              Độc lập - Tự do - Hạnh phúc
            </p>
            <p className="text-[11px] text-gray-500 italic mt-2">
              Ngày {day < 10 ? `0${day}` : day} tháng {month < 10 ? `0${month}` : month} năm {year}
            </p>
          </div>
        </div>

        {/* Invoice Title */}
        <div className="text-center my-6 space-y-1">
          <h1 className="text-xl font-black uppercase tracking-wide text-gray-900">
            BẢNG KÊ CHI PHÍ ĐIỀU TRỊ & HÓA ĐƠN VIỆN PHÍ
          </h1>
          <p className="text-xs text-gray-500 font-mono">
            Mã hóa đơn: <span className="font-bold text-gray-800">{invoice.invoiceNumber}</span>
            &nbsp;·&nbsp; Liên 1: Lưu nội bộ / Liên 2: Giao khách hàng
          </p>
        </div>

        {/* Patient Info */}
        <div className="rounded-xl border border-gray-300 p-4 mb-6 bg-gray-50/50 text-xs grid grid-cols-12 gap-3">
          <div className="col-span-6">
            <span className="text-gray-500">Họ và tên bệnh nhân:</span>{" "}
            <span className="font-bold text-sm text-gray-900 uppercase">
              {invoice.patientName}
            </span>
          </div>

          <div className="col-span-6 text-right">
            <span className="text-gray-500">Mã bệnh nhân:</span>{" "}
            <span className="font-mono font-bold text-gray-900">
              {invoice.patientId.slice(0, 8).toUpperCase()}
            </span>
          </div>

          {invoice.appointmentId && (
            <div className="col-span-6">
              <span className="text-gray-500">Mã lịch hẹn khám:</span>{" "}
              <span className="font-mono text-gray-800">{invoice.appointmentId}</span>
            </div>
          )}

          <div className="col-span-6 text-right">
            <span className="text-gray-500">Ngày lập hóa đơn:</span>{" "}
            <span className="font-medium text-gray-800">{formatDate(invoice.issuedAt)}</span>
          </div>

          {invoice.notes && (
            <div className="col-span-12 pt-1 border-t border-gray-200">
              <span className="text-gray-500">Ghi chú điều trị:</span>{" "}
              <span className="text-gray-800 italic">{invoice.notes}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead className="bg-gray-100 text-gray-800 font-bold">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-center w-10">STT</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Tên dịch vụ / Thủ thuật thực hiện</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-16">Vị trí răng</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-12">ĐVT</th>
                <th className="border border-gray-300 px-3 py-2 text-center w-12">SL</th>
                <th className="border border-gray-300 px-3 py-2 text-right w-28">Đơn giá</th>
                <th className="border border-gray-300 px-3 py-2 text-right w-28">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-300 px-3 py-2 font-medium text-gray-900">
                    {line.description}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                    {line.toothNumber || "—"}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                    Lần
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-center font-semibold">
                    {line.quantity}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right text-gray-700">
                    {formatVND(line.unitPrice)}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right font-bold text-gray-900">
                    {formatVND(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary */}
        <div className="flex justify-end mb-4">
          <div className="w-80 space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="text-gray-600">Tổng cộng chi phí:</span>
              <span className="font-semibold text-gray-900">{formatVND(invoice.subTotal)}</span>
            </div>

            {invoice.discountValue > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200 text-green-700">
                <span>
                  Chiết khấu giảm giá {invoice.discountPercent > 0 ? `(${invoice.discountPercent}%)` : ""}:
                </span>
                <span className="font-semibold">-{formatVND(invoice.discountValue)}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b-2 border-gray-900 text-sm font-black text-gray-900">
              <span>TỔNG TIỀN THANH TOÁN:</span>
              <span className="text-blue-900">{formatVND(invoice.totalAmount)}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-gray-200 text-gray-700">
              <span>Số tiền đã thanh toán:</span>
              <span className="font-bold text-emerald-700">{formatVND(invoice.paidAmount)}</span>
            </div>

            {invoice.outstandingAmount > 0 && (
              <div className="flex justify-between py-1.5 rounded-lg bg-orange-50 px-2 font-bold text-orange-800">
                <span>Số tiền còn nợ lại:</span>
                <span>{formatVND(invoice.outstandingAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount in Vietnamese Words */}
        <div className="rounded-lg border border-gray-300 p-3 mb-6 bg-gray-50 text-xs">
          <span className="font-semibold text-gray-700">Số tiền bằng chữ:</span>{" "}
          <span className="font-bold italic text-blue-950">
            {numberToVietnameseWords(invoice.totalAmount)}
          </span>
        </div>

        {/* Payment History breakdown if multiple partial payments */}
        {invoice.payments.length > 0 && (
          <div className="mb-8">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
              Chi tiết các đợt thanh toán:
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-2 py-1 text-left">Đợt / Ngày giờ</th>
                    <th className="border px-2 py-1 text-center">Phương thức</th>
                    <th className="border px-2 py-1 text-right">Số tiền</th>
                    <th className="border px-2 py-1 text-left">Mã tham chiếu / Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.payments.map((p, i) => (
                    <tr key={i}>
                      <td className="border px-2 py-1">{new Date(p.paidAt).toLocaleString("vi-VN")}</td>
                      <td className="border px-2 py-1 text-center font-medium">
                        {p.method === "Cash" ? "Tiền mặt" : p.method === "Transfer" ? "VietQR" : p.method === "Card" ? "Thẻ POS" : p.method}
                      </td>
                      <td className="border px-2 py-1 text-right font-bold text-gray-900">{formatVND(p.amount)}</td>
                      <td className="border px-2 py-1 text-gray-600">{p.reference || p.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Signatures Block - 4 Standard Signatures */}
        <div className="pt-4 border-t border-gray-300 text-xs">
          <div className="grid grid-cols-4 gap-2 text-center">
            {/* 1. Patient */}
            <div>
              <p className="font-bold uppercase text-gray-900">Người nộp tiền</p>
              <p className="text-[10px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20" />
              <p className="font-semibold text-gray-800">{invoice.patientName}</p>
            </div>

            {/* 2. Cashier */}
            <div>
              <p className="font-bold uppercase text-gray-900">Người lập phiếu</p>
              <p className="text-[10px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20" />
              <p className="font-semibold text-gray-800">Thu ngân phụ trách</p>
            </div>

            {/* 3. Accountant */}
            <div>
              <p className="font-bold uppercase text-gray-900">Kế toán viện phí</p>
              <p className="text-[10px] text-gray-500 italic">(Ký, ghi rõ họ tên)</p>
              <div className="h-20" />
              <p className="font-semibold text-gray-800">Kế toán trưởng</p>
            </div>

            {/* 4. Director / Doctor */}
            <div>
              <p className="font-bold uppercase text-gray-900">Trưởng phòng khám</p>
              <p className="text-[10px] text-gray-500 italic">(Ký, đóng dấu)</p>
              <div className="h-20" />
              <p className="font-semibold text-gray-800">Bác sĩ phụ trách</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
