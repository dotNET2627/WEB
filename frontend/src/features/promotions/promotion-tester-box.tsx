"use client";

import { useEffect, useState } from "react";
import { promotionService } from "@/services/promotion-service";
import { dentalServiceApi } from "@/services/dental-service";
import type { DiscountValidationResult } from "@/types/promotion";
import type { DentalService } from "@/types/service";

export function PromotionTesterBox() {
  const [services, setServices] = useState<DentalService[]>([]);
  const [selectedServices, setSelectedServices] = useState<DentalService[]>([]);
  const [code, setCode] = useState("");
  const [customAmount, setCustomAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiscountValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dentalServiceApi.getActiveServices().then(setServices).catch(() => []);
  }, []);

  // Tính tổng tiền từ các dịch vụ đã chọn
  const calculatedTotal = selectedServices.reduce((sum, s) => sum + s.unitPrice, 0);
  const currentTotal = customAmount !== "" ? Number(customAmount) : calculatedTotal;

  const handleToggleService = (service: DentalService) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Vui lòng nhập mã ưu đãi.");
      return;
    }

    if (currentTotal <= 0) {
      setError("Vui lòng chọn dịch vụ hoặc nhập tổng giá trị đơn hàng lớn hơn 0.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const validationRes = await promotionService.validatePromotion({
        code: code.trim().toUpperCase(),
        orderAmount: currentTotal,
        serviceIds: selectedServices.map((s) => s.id),
        categoryIds: selectedServices
          .map((s) => s.categoryId)
          .filter((id): id is string => Boolean(id))
      });

      setResult(validationRes);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi kiểm tra mã ưu đãi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🔍</span>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Công Cụ Thử Nghiệm & Kiểm Tra Điều Kiện Mã Ưu Đãi
          </h3>
          <p className="text-xs text-slate-500">
            Mô phỏng áp dụng mã ưu đãi cho từng loại dịch vụ cụ thể trước khi thanh toán cho bệnh nhân.
          </p>
        </div>
      </div>

      <form onSubmit={handleValidate} className="space-y-4">
        {/* Chọn dịch vụ mẫu */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            1. Chọn dịch vụ điều trị của bệnh nhân ({selectedServices.length} dịch vụ đã chọn):
          </label>
          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 flex flex-wrap gap-1.5">
            {services.length === 0 ? (
              <span className="text-xs text-slate-400 p-1">Đang tải danh sách dịch vụ...</span>
            ) : (
              services.map((svc) => {
                const isSelected = selectedServices.some((s) => s.id === svc.id);
                return (
                  <button
                    type="button"
                    key={svc.id}
                    onClick={() => handleToggleService(svc)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span>{svc.name}</span>
                    <span className="opacity-80">({svc.unitPrice.toLocaleString("vi-VN")} đ)</span>
                    {isSelected && <span>✓</span>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Tổng tiền & Nhập mã */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              2. Tổng giá trị đơn hàng (VNĐ)
            </label>
            <input
              type="number"
              min={0}
              step={1000}
              value={customAmount !== "" ? customAmount : calculatedTotal}
              onChange={(e) => setCustomAmount(e.target.value ? Number(e.target.value) : "")}
              placeholder="Tổng tiền..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:outline-none"
            />
            <span className="text-xs text-slate-500 font-medium">
              {currentTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Mã ưu đãi cần kiểm tra
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: HE2026, VIP10..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-mono uppercase font-bold text-blue-700 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? "Đang kiểm tra..." : "Kiểm Tra & Tính Giảm Giá"}
            </button>
          </div>
        </div>
      </form>

      {/* Hiển thị lỗi nếu có */}
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Hiển thị kết quả kiểm tra điều kiện */}
      {result && (
        <div
          className={`mt-4 rounded-xl border p-4 text-sm transition ${
            result.isValid
              ? "bg-emerald-50/80 border-emerald-300 text-emerald-900"
              : "bg-amber-50/80 border-amber-300 text-amber-900"
          }`}
        >
          <div className="flex items-center gap-2 font-bold text-base">
            <span>{result.isValid ? "✅" : "⚠️"}</span>
            <span>{result.isValid ? "MÃ ƯU ĐÃI HỢP LỆ VÀ ĐƯỢC CHẤP NHẬN!" : "KHÔNG ĐỦ ĐIỀU KIỆN ÁP DỤNG MÃ"}</span>
          </div>

          <p className="mt-1 text-xs opacity-90">{result.message}</p>

          {result.isValid ? (
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-emerald-200 pt-3 text-center">
              <div>
                <div className="text-xs text-emerald-700">Giá ban đầu</div>
                <div className="text-base font-bold text-slate-800">
                  {result.originalAmount.toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-700">Số tiền được giảm</div>
                <div className="text-base font-bold text-emerald-700">
                  - {result.discountAmount.toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div>
                <div className="text-xs text-emerald-700">Tổng thanh toán</div>
                <div className="text-base font-bold text-blue-700">
                  {result.finalAmount.toLocaleString("vi-VN")} đ
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs font-semibold text-amber-800">
              Lý do từ chối: {result.message} (Mã lỗi: {result.errorCode ?? "UNKNOWN"})
            </div>
          )}
        </div>
      )}
    </div>
  );
}
