"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { ToothModal } from "./ToothModal";
import { patientService } from "@/services/patient-service";
import { useToast } from "@/components/ui/toast";
import type { ToothCondition, ToothConditionType, ToothSurface } from "@/types/patient";
import { Layers, RotateCcw, Printer, Info } from "lucide-react";

interface OdontogramViewProps {
  patientId: string;
}

// FDI Teeth numbering names mapping
const TOOTH_NAMES: Record<number, string> = {
  // Adult Permanent Upper
  18: "Răng khôn trên phải", 17: "Răng cối lớn 2 trên phải", 16: "Răng cối lớn 1 trên phải",
  15: "Răng cối nhỏ 2 trên phải", 14: "Răng cối nhỏ 1 trên phải", 13: "Răng nanh trên phải",
  12: "Răng cửa bên trên phải", 11: "Răng cửa giữa trên phải",
  21: "Răng cửa giữa trên trái", 22: "Răng cửa bên trên trái", 23: "Răng nanh trên trái",
  24: "Răng cối nhỏ 1 trên trái", 25: "Răng cối nhỏ 2 trên trái", 26: "Răng cối lớn 1 trên trái",
  27: "Răng cối lớn 2 trên trái", 28: "Răng khôn trên trái",

  // Adult Permanent Lower
  48: "Răng khôn dưới phải", 47: "Răng cối lớn 2 dưới phải", 46: "Răng cối lớn 1 dưới phải",
  45: "Răng cối nhỏ 2 dưới phải", 44: "Răng cối nhỏ 1 dưới phải", 43: "Răng nanh dưới phải",
  42: "Răng cửa bên dưới phải", 41: "Răng cửa giữa dưới phải",
  31: "Răng cửa giữa dưới trái", 32: "Răng cửa bên dưới trái", 33: "Răng nanh dưới trái",
  34: "Răng cối nhỏ 1 dưới trái", 35: "Răng cối nhỏ 2 dưới trái", 36: "Răng cối lớn 1 dưới trái",
  37: "Răng cối lớn 2 dưới trái", 38: "Răng khôn dưới trái",

  // Primary Children Upper
  55: "Răng cối sữa 2 trên phải", 54: "Răng cối sữa 1 trên phải", 53: "Răng nanh sữa trên phải",
  52: "Răng cửa bên sữa trên phải", 51: "Răng cửa giữa sữa trên phải",
  61: "Răng cửa giữa sữa trên trái", 62: "Răng cửa bên sữa trên trái", 63: "Răng nanh sữa trên trái",
  64: "Răng cối sữa 1 trên trái", 65: "Răng cối sữa 2 trên trái",

  // Primary Children Lower
  85: "Răng cối sữa 2 dưới phải", 84: "Răng cối sữa 1 dưới phải", 83: "Răng nanh sữa dưới phải",
  82: "Răng cửa bên sữa dưới phải", 81: "Răng cửa giữa sữa dưới phải",
  71: "Răng cửa giữa sữa dưới trái", 72: "Răng cửa bên sữa dưới trái", 73: "Răng nanh sữa dưới trái",
  74: "Răng cối sữa 1 dưới trái", 75: "Răng cối sữa 2 dưới trái"
};

// Quadrants definition
const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const PRIMARY_UPPER_RIGHT = [55, 54, 53, 52, 51];
const PRIMARY_UPPER_LEFT = [61, 62, 63, 64, 65];
const PRIMARY_LOWER_RIGHT = [85, 84, 83, 82, 81];
const PRIMARY_LOWER_LEFT = [71, 72, 73, 74, 75];

export function OdontogramView({ patientId }: OdontogramViewProps) {
  const { showToast } = useToast();
  const [isPediatric, setIsPediatric] = useState(false);
  const [teethData, setTeethData] = useState<Record<number, ToothCondition>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Load odontogram
  const loadOdontogram = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await patientService.getOdontogram(patientId);
      const map: Record<number, ToothCondition> = {};
      (list || []).forEach((item) => {
        if (item && item.toothNumber) {
          map[item.toothNumber] = item;
        }
      });
      setTeethData(map);
    } catch {
      showToast("Không thể tải dữ liệu sơ đồ răng.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, showToast]);

  useEffect(() => {
    loadOdontogram();
  }, [loadOdontogram]);

  // Handle save single tooth
  const handleSaveTooth = async (
    toothNumber: number,
    data: { condition: ToothConditionType; surfaces: ToothSurface[]; notes: string }
  ) => {
    try {
      const updated = await patientService.updateTooth(patientId, toothNumber, data);
      setTeethData((prev) => {
        const copy = { ...prev };
        if (data.condition === "healthy") {
          delete copy[toothNumber];
        } else {
          copy[toothNumber] = updated;
        }
        return copy;
      });
      showToast(`Đã lưu tình trạng răng ${toothNumber}.`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Lỗi khi cập nhật tình trạng răng.", "error");
    }
  };

  // Status statistics
  const stats = useMemo(() => {
    let caries = 0;
    let filled = 0;
    let extracted = 0;
    let crown = 0;
    let rootCanal = 0;
    let implant = 0;

    Object.values(teethData).forEach((t) => {
      if (t.condition === "caries") caries++;
      else if (t.condition === "filled") filled++;
      else if (t.condition === "extracted") extracted++;
      else if (t.condition === "crown") crown++;
      else if (t.condition === "root_canal") rootCanal++;
      else if (t.condition === "implant") implant++;
    });

    return { caries, filled, extracted, crown, rootCanal, implant, totalAffected: Object.keys(teethData).length };
  }, [teethData]);

  // Color helper for tooth surfaces
  const getSurfaceColor = (
    toothNumber: number,
    surface: ToothSurface,
    toothCondition?: ToothCondition
  ): string => {
    if (!toothCondition || toothCondition.condition === "healthy") return "#FFFFFF";

    const hasSurface = toothCondition.surfaces?.includes(surface);

    if (toothCondition.condition === "caries") {
      return hasSurface ? "#EF4444" : "#FEE2E2";
    }
    if (toothCondition.condition === "filled") {
      return hasSurface ? "#2563EB" : "#DBEAFE";
    }
    if (toothCondition.condition === "crown") {
      return "#FDE68A"; // Amber/gold crown
    }
    if (toothCondition.condition === "root_canal") {
      return surface === "O" ? "#C084FC" : "#F3E8FF";
    }
    if (toothCondition.condition === "implant") {
      return "#99F6E4";
    }
    return "#FFFFFF";
  };

  // Tooth Single SVG Component
  const renderToothSVG = (toothNum: number, isUpper: boolean) => {
    const item = teethData[toothNum];
    const condition = item?.condition || "healthy";
    const isExtracted = condition === "extracted";
    const isCrown = condition === "crown";
    const isImplant = condition === "implant";

    return (
      <button
        key={toothNum}
        type="button"
        onClick={() => setSelectedTooth(toothNum)}
        aria-label={`Răng số ${toothNum}: ${TOOTH_NAMES[toothNum] || ""}, Tình trạng: ${condition}`}
        className="group relative flex flex-col items-center justify-center p-1 rounded-[var(--radius)] hover:bg-[var(--status-info-bg)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)] transition cursor-pointer min-w-[46px] min-h-[58px]"
      >
        {/* Tooth Number on top if Upper jaw */}
        {isUpper && (
          <span className="text-[12px] font-bold text-[var(--color-text)] tabular-nums mb-1 group-hover:text-[var(--color-primary)]">
            {toothNum}
          </span>
        )}

        {/* 5-Surface Anatomical SVG Schema (40x40 touch target) */}
        <div className="relative w-10 h-10 border border-slate-300 rounded-[var(--radius)] bg-white overflow-hidden shadow-xs">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Top Surface (Buccal/Labial for Upper, Lingual for Lower) */}
            <polygon
              points="0,0 100,0 75,25 25,25"
              fill={getSurfaceColor(toothNum, "B", item)}
              stroke="#94A3B8"
              strokeWidth="2"
            />
            {/* Bottom Surface (Lingual for Upper, Buccal for Lower) */}
            <polygon
              points="25,75 75,75 100,100 0,100"
              fill={getSurfaceColor(toothNum, "L", item)}
              stroke="#94A3B8"
              strokeWidth="2"
            />
            {/* Left Surface (Mesial / Distal) */}
            <polygon
              points="0,0 25,25 25,75 0,100"
              fill={getSurfaceColor(toothNum, "M", item)}
              stroke="#94A3B8"
              strokeWidth="2"
            />
            {/* Right Surface (Distal / Mesial) */}
            <polygon
              points="75,25 100,0 100,100 75,75"
              fill={getSurfaceColor(toothNum, "D", item)}
              stroke="#94A3B8"
              strokeWidth="2"
            />
            {/* Center Surface (Occlusal/Incisal) */}
            <polygon
              points="25,25 75,25 75,75 25,75"
              fill={getSurfaceColor(toothNum, "O", item)}
              stroke="#94A3B8"
              strokeWidth="2"
            />

            {/* Extracted Cross Line */}
            {isExtracted && (
              <>
                <line x1="5" y1="5" x2="95" y2="95" stroke="#475569" strokeWidth="10" strokeLinecap="round" />
                <line x1="95" y1="5" x2="5" y2="95" stroke="#475569" strokeWidth="10" strokeLinecap="round" />
              </>
            )}

            {/* Crown indicator (Golden double border) */}
            {isCrown && (
              <rect x="5" y="5" width="90" height="90" fill="none" stroke="#D97706" strokeWidth="8" rx="8" />
            )}

            {/* Implant icon marker */}
            {isImplant && (
              <circle cx="50" cy="50" r="16" fill="#0D9488" stroke="#0F766E" strokeWidth="3" />
            )}
          </svg>
        </div>

        {/* Tooth Number on bottom if Lower jaw */}
        {!isUpper && (
          <span className="text-[12px] font-bold text-[var(--color-text)] tabular-nums mt-1 group-hover:text-[var(--color-primary)]">
            {toothNum}
          </span>
        )}

        {/* Small condition dot marker */}
        {condition !== "healthy" && (
          <span
            className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
              condition === "caries"
                ? "bg-red-500 ring-1 ring-white"
                : condition === "filled"
                ? "bg-blue-500 ring-1 ring-white"
                : condition === "crown"
                ? "bg-amber-500 ring-1 ring-white"
                : condition === "extracted"
                ? "bg-slate-600 ring-1 ring-white"
                : "bg-purple-500 ring-1 ring-white"
            }`}
          />
        )}
      </button>
    );
  };

  const upperRight = isPediatric ? PRIMARY_UPPER_RIGHT : ADULT_UPPER_RIGHT;
  const upperLeft = isPediatric ? PRIMARY_UPPER_LEFT : ADULT_UPPER_LEFT;
  const lowerRight = isPediatric ? PRIMARY_LOWER_RIGHT : ADULT_LOWER_RIGHT;
  const lowerLeft = isPediatric ? PRIMARY_LOWER_LEFT : ADULT_LOWER_LEFT;

  return (
    <div className="space-y-6">
      {/* Odontogram Toolbar & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--color-text)]">
              Sơ đồ răng giải phẫu 5 mặt (FDI Dental Chart)
            </h3>
          </div>
          <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            Chạm hoặc bấm vào từng răng để cập nhật chẩn đoán sâu răng, miếng trám, răng sứ, nhổ răng hoặc implant.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Pediatric toggle */}
          <div className="inline-flex rounded-[var(--radius)] border border-[var(--color-border)] p-0.5 bg-[var(--color-bg)] text-[var(--text-xs)] font-medium">
            <button
              type="button"
              onClick={() => setIsPediatric(false)}
              className={`px-3 py-1.5 rounded-[calc(var(--radius)-2px)] transition cursor-pointer ${
                !isPediatric
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Răng vĩnh viễn (32 răng)
            </button>
            <button
              type="button"
              onClick={() => setIsPediatric(true)}
              className={`px-3 py-1.5 rounded-[calc(var(--radius)-2px)] transition cursor-pointer ${
                isPediatric
                  ? "bg-[var(--color-surface)] text-[var(--color-text)] font-semibold shadow-xs"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              Răng sữa trẻ em (20 răng)
            </button>
          </div>

          <button
            type="button"
            onClick={loadOdontogram}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Tải lại</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In nha bạ</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        <div className="p-2.5 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
          <span className="text-[var(--text-xs)] text-[var(--color-text-muted)]">Răng can thiệp</span>
          <span className="text-[18px] font-bold text-[var(--color-text)] tabular-nums mt-0.5">
            {stats.totalAffected}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-red-200 bg-red-50 flex flex-col">
          <span className="text-[var(--text-xs)] text-red-700 font-medium">Sâu răng (Caries)</span>
          <span className="text-[18px] font-bold text-red-800 tabular-nums mt-0.5">
            {stats.caries}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-blue-200 bg-blue-50 flex flex-col">
          <span className="text-[var(--text-xs)] text-blue-700 font-medium">Đã trám (Filled)</span>
          <span className="text-[18px] font-bold text-blue-800 tabular-nums mt-0.5">
            {stats.filled}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-amber-200 bg-amber-50 flex flex-col">
          <span className="text-[var(--text-xs)] text-amber-700 font-medium">Bọc sứ (Crown)</span>
          <span className="text-[18px] font-bold text-amber-800 tabular-nums mt-0.5">
            {stats.crown}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-purple-200 bg-purple-50 flex flex-col">
          <span className="text-[var(--text-xs)] text-purple-700 font-medium">Điều trị tủy (Endo)</span>
          <span className="text-[18px] font-bold text-purple-800 tabular-nums mt-0.5">
            {stats.rootCanal}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-neutral-300 bg-neutral-100 flex flex-col">
          <span className="text-[var(--text-xs)] text-neutral-700 font-medium">Đã nhổ (Extracted)</span>
          <span className="text-[18px] font-bold text-neutral-800 tabular-nums mt-0.5">
            {stats.extracted}
          </span>
        </div>
        <div className="p-2.5 rounded-[var(--radius)] border border-teal-200 bg-teal-50 flex flex-col">
          <span className="text-[var(--text-xs)] text-teal-700 font-medium">Implant</span>
          <span className="text-[18px] font-bold text-teal-800 tabular-nums mt-0.5">
            {stats.implant}
          </span>
        </div>
      </div>

      {/* Main Interactive Odontogram Board */}
      <div className="p-6 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-muted)]">
              Đang tải dữ liệu hồ sơ răng...
            </p>
          </div>
        ) : (
          <div className="min-w-[760px] mx-auto space-y-6">
            {/* UPPER JAW (Hàm trên) */}
            <div>
              <div className="flex items-center justify-between mb-2 px-2 text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                <span>PHẢI (Cung 1{isPediatric ? " / 5" : ""})</span>
                <span className="text-[var(--color-primary)] font-bold">HÀM TRÊN (Maxillary Arch)</span>
                <span>TRÁI (Cung 2{isPediatric ? " / 6" : ""})</span>
              </div>

              <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 bg-slate-50/80 rounded-[var(--radius)] border border-slate-200">
                {/* Upper Right Quadrant */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {upperRight.map((num) => renderToothSVG(num, true))}
                </div>

                {/* Midline Divider */}
                <div className="h-14 w-[2px] bg-red-400 mx-1 flex flex-col justify-between items-center" title="Đường giữa mặt">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                </div>

                {/* Upper Left Quadrant */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {upperLeft.map((num) => renderToothSVG(num, true))}
                </div>
              </div>
            </div>

            {/* Jaw Separator */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-dashed border-slate-300 w-full" />
              <span className="absolute px-3 py-0.5 bg-white border border-slate-200 rounded-full text-[11px] font-semibold text-slate-500 uppercase">
                Mặt phẳng cắn (Occlusal Plane)
              </span>
            </div>

            {/* LOWER JAW (Hàm dưới) */}
            <div>
              <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 bg-slate-50/80 rounded-[var(--radius)] border border-slate-200">
                {/* Lower Right Quadrant */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {lowerRight.map((num) => renderToothSVG(num, false))}
                </div>

                {/* Midline Divider */}
                <div className="h-14 w-[2px] bg-red-400 mx-1 flex flex-col justify-between items-center" title="Đường giữa mặt">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                </div>

                {/* Lower Left Quadrant */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  {lowerLeft.map((num) => renderToothSVG(num, false))}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2 px-2 text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">
                <span>PHẢI (Cung 4{isPediatric ? " / 8" : ""})</span>
                <span className="text-[var(--color-primary)] font-bold">HÀM DƯỚI (Mandibular Arch)</span>
                <span>TRÁI (Cung 3{isPediatric ? " / 7" : ""})</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Guide (Chú giải màu sắc, ký hiệu theo ADMIN_UI_RULES.md mục 9) */}
      <div className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] space-y-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[var(--color-text-muted)]" />
          <h4 className="text-[var(--text-sm)] font-semibold text-[var(--color-text)]">
            Chú giải ký hiệu & quy chuẩn 5 mặt giải phẫu
          </h4>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-[var(--text-xs)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-slate-300 bg-white" />
            <span className="text-[var(--color-text)]">Khỏe mạnh (Healthy)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-red-500 bg-red-500" />
            <span className="text-[var(--color-text)]">Sâu răng (Màu đỏ)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-blue-600 bg-blue-600" />
            <span className="text-[var(--color-text)]">Đã trám (Màu xanh)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-amber-500 bg-amber-100" />
            <span className="text-[var(--color-text)]">Bọc răng sứ (Viền vàng)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-300 flex items-center justify-center text-slate-700 font-bold text-[10px]">
              ✕
            </div>
            <span className="text-[var(--color-text)]">Đã nhổ (Gạch chéo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px]">
              ●
            </div>
            <span className="text-[var(--color-text)]">Implant (Trụ titan)</span>
          </div>
        </div>

        <div className="pt-2 border-t border-[var(--color-border)] text-[var(--text-xs)] text-[var(--color-text-muted)] flex items-center gap-4 flex-wrap">
          <span><strong>M</strong>: Mặt gần (Mesial)</span>
          <span><strong>D</strong>: Mặt xa (Distal)</span>
          <span><strong>O</strong>: Mặt nhai / Bờ cắn (Occlusal)</span>
          <span><strong>B</strong>: Mặt ngoài (Buccal)</span>
          <span><strong>L</strong>: Mặt trong (Lingual/Palatal)</span>
        </div>
      </div>

      {/* Modal chỉnh sửa răng */}
      <ToothModal
        isOpen={selectedTooth !== null}
        onClose={() => setSelectedTooth(null)}
        toothNumber={selectedTooth}
        toothName={selectedTooth ? TOOTH_NAMES[selectedTooth] || `Răng số ${selectedTooth}` : ""}
        initialCondition={selectedTooth ? teethData[selectedTooth] || null : null}
        onSave={handleSaveTooth}
      />
    </div>
  );
}
