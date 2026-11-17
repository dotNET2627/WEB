"use client";

import { useEffect, useMemo, useState } from "react";
import { invoiceService } from "@/services/invoice-service";
import type { InvoiceVietQrDto, PaymentMethod } from "@/types/invoice";
import { formatVND } from "@/lib/format";

interface RecordPaymentModalProps {
  invoiceId: string;
  invoiceNumber?: string;
  patientName?: string;
  outstandingAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecordPaymentModal({
  invoiceId,
  invoiceNumber,
  patientName,
  outstandingAmount,
  onClose,
  onSuccess,
}: RecordPaymentModalProps) {
  // Amount to pay
  const [amount, setAmount] = useState<number>(outstandingAmount);
  const [method, setMethod] = useState<PaymentMethod>("Transfer"); // default to Transfer / VietQR as requested
  const [reference, setReference] = useState("");

  // Cash method specific states
  const [tenderedAmount, setTenderedAmount] = useState<number>(outstandingAmount);

  // Card method specific states
  const [cardType, setCardType] = useState<string>("NAPAS");

  // VietQR states
  const [vietQr, setVietQr] = useState<InvoiceVietQrDto | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // General state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch VietQR when method is Transfer or amount changes
  useEffect(() => {
    if (method !== "Transfer") return;

    let cancelled = false;
    setQrLoading(true);
    setQrError(null);

    const validAmount = Math.max(1, amount || outstandingAmount);
    invoiceService
      .getVietQr(invoiceId, validAmount)
      .then((data) => {
        if (!cancelled) {
          setVietQr(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("VietQR fetch error:", err);
          setQrError("Không thể tải mã VietQR. Vui lòng thử lại.");
        }
      })
      .finally(() => {
        if (!cancelled) setQrLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, method, amount, outstandingAmount]);

  // Cash change calculation
  const changeAmount = useMemo(() => {
    return Math.max(0, tenderedAmount - amount);
  }, [tenderedAmount, amount]);

  // Copy helper
  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amount <= 0) {
      setError("Số tiền thanh toán phải lớn hơn 0.");
      return;
    }
    if (amount > outstandingAmount) {
      setError(`Số tiền thanh toán không được vượt quá số còn lại (${formatVND(outstandingAmount)}).`);
      return;
    }

    setSubmitting(true);
    setError(null);

    // Build reference string based on payment method
    let finalReference = reference.trim();
    if (method === "Card" && cardType) {
      finalReference = finalReference ? `[${cardType}] ${finalReference}` : `[${cardType}]`;
    } else if (method === "Transfer" && !finalReference && vietQr) {
      finalReference = vietQr.description;
    }

    try {
      await invoiceService.recordPayment(invoiceId, {
        amount,
        method,
        reference: finalReference || null,
      });
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      setError("Không thể ghi nhận thanh toán. Vui lòng kiểm tra lại kết nối.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl flex flex-col my-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-linear-to-r from-blue-700 to-indigo-800 px-6 py-4 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <h2 className="text-lg font-bold">
                Màn hình Thu ngân & Thanh toán
              </h2>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Hóa đơn: <span className="font-semibold">{invoiceNumber || vietQr?.invoiceNumber || invoiceId.slice(0, 8)}</span>
              {patientName ? (
                <> · Bệnh nhân: <span className="font-semibold">{patientName}</span></>
              ) : vietQr?.patientName ? (
                <> · Bệnh nhân: <span className="font-semibold">{vietQr.patientName}</span></>
              ) : null}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            title="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[75vh]">
            {/* Amount Section */}
            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Số tiền cần thanh toán
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <input
                      type="number"
                      min={1}
                      max={outstandingAmount}
                      value={amount}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setAmount(val);
                        setTenderedAmount(val);
                      }}
                      className="text-2xl font-extrabold text-blue-900 bg-white border border-blue-200 rounded-lg px-3 py-1 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <span className="text-sm font-semibold text-blue-700">₫</span>
                  </div>
                </div>

                <div className="text-sm sm:text-right">
                  <span className="text-xs text-gray-500">Còn nợ:</span>{" "}
                  <span className="font-bold text-orange-600">
                    {formatVND(outstandingAmount)}
                  </span>
                  <div className="flex gap-1 mt-1 justify-start sm:justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAmount(outstandingAmount);
                        setTenderedAmount(outstandingAmount);
                      }}
                      className="rounded bg-white border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      Toàn bộ
                    </button>
                    {outstandingAmount > 100000 && (
                      <button
                        type="button"
                        onClick={() => {
                          const half = Math.round(outstandingAmount / 2);
                          setAmount(half);
                          setTenderedAmount(half);
                        }}
                        className="rounded bg-white border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Phương thức thanh toán <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Transfer / VietQR tab */}
                <button
                  type="button"
                  onClick={() => setMethod("Transfer")}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all ${
                    method === "Transfer"
                      ? "border-blue-600 bg-blue-50/60 text-blue-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl mb-1">📲</span>
                  <span className="text-sm font-bold">Chuyển khoản</span>
                  <span className="text-[11px] font-medium text-blue-600 mt-0.5">
                    VietQR NAPAS 247
                  </span>
                </button>

                {/* Cash tab */}
                <button
                  type="button"
                  onClick={() => setMethod("Cash")}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all ${
                    method === "Cash"
                      ? "border-emerald-600 bg-emerald-50/60 text-emerald-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl mb-1">💵</span>
                  <span className="text-sm font-bold">Tiền mặt</span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">
                    Thu tại quầy
                  </span>
                </button>

                {/* Card / POS tab */}
                <button
                  type="button"
                  onClick={() => setMethod("Card")}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-all ${
                    method === "Card"
                      ? "border-purple-600 bg-purple-50/60 text-purple-700 shadow-xs"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl mb-1">💳</span>
                  <span className="text-sm font-bold">Quẹt thẻ (POS)</span>
                  <span className="text-[11px] font-medium text-gray-400 mt-0.5">
                    ATM / Visa / Master
                  </span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: Transfer / VietQR */}
            {method === "Transfer" && (
              <div className="rounded-2xl border-2 border-blue-200 bg-linear-to-b from-blue-50/40 to-white p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white tracking-wide">
                      VietQR
                    </span>
                    <span className="inline-flex items-center rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white tracking-wide">
                      NAPAS 247
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Chuyển nhanh liên ngân hàng 24/7
                    </span>
                  </div>
                  {vietQr && (
                    <a
                      href={vietQr.qrImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>🔍 Mở ảnh QR</span>
                    </a>
                  )}
                </div>

                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
                    <p className="mt-2 text-sm font-medium">Đang tạo mã VietQR chuẩn NAPAS...</p>
                  </div>
                ) : qrError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
                    {qrError}
                  </div>
                ) : vietQr ? (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* QR Code image display */}
                    <div className="md:col-span-5 flex flex-col items-center justify-center bg-white rounded-xl border border-gray-200 p-3 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vietQr.qrImageUrl}
                        alt="Mã VietQR NAPAS"
                        className="w-full max-w-[240px] aspect-square object-contain rounded-lg"
                      />
                      <p className="mt-2 text-[11px] text-gray-500 text-center font-medium">
                        Quét bằng ứng dụng ngân hàng hoặc MoMo / ZaloPay
                      </p>
                    </div>

                    {/* Transfer details with one-click copy buttons */}
                    <div className="md:col-span-7 space-y-2.5 text-sm">
                      {/* Bank Name */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">
                            Ngân hàng thụ hưởng
                          </span>
                          <span className="font-bold text-gray-900">
                            {vietQr.bankName}
                          </span>
                        </div>
                      </div>

                      {/* Account Number */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">
                            Số tài khoản
                          </span>
                          <span className="font-mono text-base font-bold text-blue-700 tracking-wider">
                            {vietQr.accountNumber}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(vietQr.accountNumber, "acc")}
                          className="rounded-lg bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors shrink-0"
                        >
                          {copiedField === "acc" ? "✓ Đã chép" : "Sao chép"}
                        </button>
                      </div>

                      {/* Account Name */}
                      <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">
                            Tên chủ tài khoản
                          </span>
                          <span className="font-bold text-gray-900 uppercase">
                            {vietQr.accountName}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 p-2.5">
                        <div>
                          <span className="text-[11px] uppercase tracking-wider text-blue-600 block font-semibold">
                            Số tiền chuyển khoản
                          </span>
                          <span className="text-base font-extrabold text-blue-900">
                            {formatVND(vietQr.amount)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(vietQr.amount.toString(), "amount")}
                          className="rounded-lg bg-white border border-blue-200 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors shrink-0"
                        >
                          {copiedField === "amount" ? "✓ Đã chép" : "Sao chép"}
                        </button>
                      </div>

                      {/* Transfer Memo */}
                      <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-200 p-2.5">
                        <div className="overflow-hidden mr-2">
                          <span className="text-[11px] uppercase tracking-wider text-amber-800 block font-semibold">
                            Nội dung chuyển khoản (bắt buộc)
                          </span>
                          <span className="font-mono font-bold text-amber-900 truncate block">
                            {vietQr.description}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(vietQr.description, "memo")}
                          className="rounded-lg bg-white border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-colors shrink-0"
                        >
                          {copiedField === "memo" ? "✓ Đã chép" : "Sao chép"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Reference / Transaction ID */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Mã tham chiếu / Mã giao dịch ngân hàng (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="VD: FT2611... hoặc để trống tự động lấy theo mã HĐ"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Cash */}
            {method === "Cash" && (
              <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tendered Amount */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Tiền khách đưa (₫)
                    </label>
                    <input
                      type="number"
                      min={amount}
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />

                    {/* Quick Denominations */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        type="button"
                        onClick={() => setTenderedAmount(amount)}
                        className="rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Đúng số tiền
                      </button>
                      {[100000, 200000, 500000, 1000000, 2000000].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setTenderedAmount(d)}
                          className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {d >= 1000000 ? `${d / 1000000}tr` : `${d / 1000}k`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Change to return */}
                  <div className="rounded-xl border border-emerald-200 bg-white p-4 flex flex-col justify-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Tiền thối lại khách
                    </span>
                    <span className={`text-2xl font-black mt-1 ${
                      tenderedAmount < amount ? "text-red-500" : "text-emerald-600"
                    }`}>
                      {tenderedAmount < amount ? "Khách đưa thiếu!" : formatVND(changeAmount)}
                    </span>
                    {tenderedAmount >= amount && changeAmount > 0 && (
                      <span className="text-xs text-emerald-700 mt-1">
                        Vui lòng trả lại khách {formatVND(changeAmount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Ghi chú thu tiền mặt (tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="VD: Khách trả tiền mặt tại quầy lễ tân"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            {/* TAB CONTENT: Card / POS */}
            {method === "Card" && (
              <div className="rounded-2xl border-2 border-purple-200 bg-purple-50/30 p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Loại thẻ thanh toán
                    </label>
                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-800 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="NAPAS">Thẻ ATM nội địa (NAPAS)</option>
                      <option value="VISA">Thẻ Quốc tế VISA</option>
                      <option value="MASTERCARD">Thẻ Quốc tế MasterCard</option>
                      <option value="JCB">Thẻ JCB</option>
                      <option value="OTHER_CARD">Thẻ khác</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Mã chuẩn chi / Trace No từ POS <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="VD: 123456 hoặc Số hóa đơn POS"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg bg-purple-100/70 border border-purple-200 p-3 text-xs text-purple-900 leading-relaxed">
                  💡 <strong>Quy trình quẹt thẻ:</strong> Tiến hành quẹt/chạm thẻ trên máy POS của phòng khám, chờ giao dịch thành công và nhập mã chuẩn chi (Appr Code/Trace No) in trên hóa đơn POS để đối soát cuối ngày.
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={submitting || (method === "Cash" && tenderedAmount < amount)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Xác nhận đã nhận {formatVND(amount)}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
