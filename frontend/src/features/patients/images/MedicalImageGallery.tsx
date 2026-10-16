"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { patientService } from "@/services/patient-service";
import { useToast } from "@/components/ui/toast";
import type { MedicalImage, MedicalImageType } from "@/types/patient";
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  X,
  Columns,
  Trash2,
  Calendar,
  Layers,
  SunMedium
} from "lucide-react";

interface MedicalImageGalleryProps {
  patientId: string;
}

const IMAGE_TYPES: { type: MedicalImageType; label: string }[] = [
  { type: "panorex", label: "Toàn cảnh (Panorex)" },
  { type: "periapical", label: "Chóp răng (Periapical)" },
  { type: "bitewing", label: "Cánh cắn (Bitewing)" },
  { type: "intraoral", label: "Ảnh trong miệng" },
  { type: "extraoral", label: "Ảnh ngoài mặt" },
  { type: "other", label: "Khác" }
];

export function MedicalImageGallery({ patientId }: MedicalImageGalleryProps) {
  const { showToast } = useToast();
  const [images, setImages] = useState<MedicalImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadType, setUploadType] = useState<MedicalImageType>("panorex");
  const [uploadTooth, setUploadTooth] = useState<string>("");
  const [uploadRole, setUploadRole] = useState<"before" | "after" | "regular">("regular");
  const [uploadDate, setUploadDate] = useState<string>(
    new Date().toLocaleDateString("vi-VN")
  );
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Lightbox Zoom/Pan modal state
  const [lightboxImage, setLightboxImage] = useState<MedicalImage | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isInverted, setIsInverted] = useState(false);

  // Comparison mode state (2 images side-by-side)
  const [isComparing, setIsComparing] = useState(false);
  const [beforeImage, setBeforeImage] = useState<MedicalImage | null>(null);
  const [afterImage, setAfterImage] = useState<MedicalImage | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await patientService.getMedicalImages(patientId);
      const list = Array.isArray(data) ? data : [];
      setImages(list);
      // Preselect default comparison pair if available
      const before = list.find((img) => img.comparisonRole === "before");
      const after = list.find((img) => img.comparisonRole === "after");
      if (before) setBeforeImage(before);
      if (after) setAfterImage(after);
    } catch {
      showToast("Không thể tải danh sách phim X-quang.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [patientId, showToast]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  // Handle local file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, SVG).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setUploadPreview(result);
      if (!uploadTitle) {
        setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit upload image
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadPreview) {
      showToast("Vui lòng chọn tệp hình ảnh để tải lên.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const newImg = await patientService.uploadMedicalImage(patientId, {
        patientId,
        title: uploadTitle.trim() || "Phim chụp X-quang",
        type: uploadType,
        imageUrl: uploadPreview,
        toothNumber: uploadTooth ? Number(uploadTooth) : undefined,
        capturedDate: uploadDate || new Date().toLocaleDateString("vi-VN"),
        notes: uploadNotes.trim() || undefined,
        comparisonRole: uploadRole
      });

      setImages((prev) => [newImg, ...prev]);
      showToast("Đã tải lên phim X-quang thành công.", "success");
      setIsUploadOpen(false);
      // Reset form
      setUploadTitle("");
      setUploadPreview("");
      setUploadTooth("");
      setUploadNotes("");
      setUploadRole("regular");
    } catch {
      showToast("Lỗi khi tải lên hình ảnh y tế.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Delete image
  const handleDeleteImage = async (imgId: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa ảnh "${title}"?`)) return;
    try {
      await patientService.deleteMedicalImage(patientId, imgId);
      setImages((prev) => prev.filter((img) => img.id !== imgId));
      if (beforeImage?.id === imgId) setBeforeImage(null);
      if (afterImage?.id === imgId) setAfterImage(null);
      showToast("Đã xóa hình ảnh y tế.", "success");
    } catch {
      showToast("Không thể xóa hình ảnh.", "error");
    }
  };

  // Filtered images
  const filteredImages = images.filter((img) => {
    if (filterType === "all") return true;
    if (filterType === "comparison") return img.comparisonRole === "before" || img.comparisonRole === "after";
    return img.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-[18px] font-semibold text-[var(--color-text)]">
              Thư viện Phim X-quang & Ảnh điều trị
            </h3>
            <span className="px-2 py-0.5 rounded-[var(--radius)] bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] text-[var(--text-xs)] font-medium tabular-nums">
              {images.length} ảnh
            </span>
          </div>
          <p className="mt-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            Lưu trữ phim chụp Panorama, cận chóp và hình ảnh nha khoa đối chiếu quá trình điều trị.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsComparing(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-xs)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
          >
            <Columns className="w-4 h-4 text-[var(--color-primary)]" />
            <span>So sánh Trước - Sau</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-xs)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Tải ảnh X-quang</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[var(--text-xs)]">
        <button
          type="button"
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-[var(--radius)] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === "all"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Tất cả ảnh ({images.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType("panorex")}
          className={`px-3 py-1.5 rounded-[var(--radius)] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === "panorex"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Toàn cảnh Panorex
        </button>
        <button
          type="button"
          onClick={() => setFilterType("periapical")}
          className={`px-3 py-1.5 rounded-[var(--radius)] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === "periapical"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Chóp răng (Periapical)
        </button>
        <button
          type="button"
          onClick={() => setFilterType("intraoral")}
          className={`px-3 py-1.5 rounded-[var(--radius)] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === "intraoral"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Trong miệng
        </button>
        <button
          type="button"
          onClick={() => setFilterType("comparison")}
          className={`px-3 py-1.5 rounded-[var(--radius)] font-medium transition cursor-pointer whitespace-nowrap ${
            filterType === "comparison"
              ? "bg-[var(--color-primary)] text-[var(--color-primary-contrast)]"
              : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          }`}
        >
          Bộ so sánh Trước / Sau
        </button>
      </div>

      {/* Grid of Medical Images */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <p className="mt-2 text-[var(--text-sm)] text-[var(--color-text-muted)]">
            Đang tải thư viện phim...
          </p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-12 p-6 rounded-[var(--radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <Layers className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2 opacity-50" />
          <p className="text-[var(--text-sm)] font-medium text-[var(--color-text)]">
            Chưa có hình ảnh nào trong danh mục này
          </p>
          <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-1">
            Bấm nút &ldquo;Tải ảnh X-quang&rdquo; để thêm phim chụp vào hồ sơ điều trị.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredImages.map((img) => (
            <div
              key={img.id}
              className="group flex flex-col rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs hover:border-[var(--color-primary)] transition"
            >
              {/* Thumbnail Area */}
              <div
                className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                onClick={() => {
                  setLightboxImage(img);
                  setZoomLevel(1);
                  setRotation(0);
                  setIsInverted(false);
                }}
              >
                <Image
                  src={img.imageUrl}
                  alt={img.title}
                  fill
                  unoptimized
                  className="w-full h-full object-contain group-hover:scale-102 transition duration-200"
                />
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-[var(--radius)] bg-slate-900/80 text-white text-[12px] font-medium flex items-center gap-1.5 backdrop-blur-xs">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Xem phóng to</span>
                  </span>
                </div>

                {/* Role badge (Before / After) */}
                {img.comparisonRole === "before" && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[var(--radius)] bg-red-600 text-white text-[11px] font-bold shadow-xs">
                    Trước điều trị
                  </span>
                )}
                {img.comparisonRole === "after" && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-[var(--radius)] bg-emerald-600 text-white text-[11px] font-bold shadow-xs">
                    Sau điều trị
                  </span>
                )}

                {/* Tooth number if applicable */}
                {img.toothNumber && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-[var(--radius)] bg-slate-900/80 text-white text-[11px] font-mono tabular-nums">
                    R{img.toothNumber}
                  </span>
                )}
              </div>

              {/* Card Meta Content */}
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-semibold text-[var(--color-text)] line-clamp-1">
                      {img.title}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 rounded-[var(--radius)] bg-[var(--status-info-bg)] text-[var(--status-info-fg)] text-[11px] font-medium">
                      {IMAGE_TYPES.find((t) => t.type === img.type)?.label || img.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[var(--text-xs)] text-[var(--color-text-muted)] mt-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="tabular-nums">Chụp ngày: {img.capturedDate}</span>
                  </div>

                  {img.notes && (
                    <p className="text-[var(--text-xs)] text-[var(--color-text)] mt-2 line-clamp-2 bg-[var(--color-bg)] p-2 rounded-[var(--radius)]">
                      {img.notes}
                    </p>
                  )}
                </div>

                {/* Card Action footer */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!beforeImage) {
                        setBeforeImage(img);
                        showToast(`Đã gán "${img.title}" làm ảnh Trước điều trị.`, "info");
                      } else {
                        setAfterImage(img);
                        showToast(`Đã gán "${img.title}" làm ảnh Sau điều trị. Mở so sánh.`, "info");
                        setIsComparing(true);
                      }
                    }}
                    className="text-[12px] font-medium text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    Gán so sánh
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id, img.title)}
                    aria-label={`Xóa ảnh ${img.title}`}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] rounded transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Image Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => !isUploading && setIsUploadOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            className="relative z-10 w-full max-w-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius)] shadow-[var(--shadow-overlay)] p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[var(--color-primary)]" />
                <h3 id="upload-title" className="text-[18px] font-semibold text-[var(--color-text)]">
                  Tải lên hình ảnh X-quang y tế
                </h3>
              </div>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => setIsUploadOpen(false)}
                aria-label="Đóng"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* File picker */}
              <div>
                <label className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                  Tệp phim chụp (bắt buộc)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="relative aspect-video bg-slate-900 rounded-[var(--radius)] overflow-hidden border border-slate-300">
                    <Image
                      src={uploadPreview}
                      alt="Xem trước phim chụp"
                      fill
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-[var(--radius)] bg-slate-900/80 text-white text-[12px] font-medium"
                    >
                      Đổi tệp khác
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--color-border-input)] rounded-[var(--radius)] hover:bg-[var(--color-bg)] cursor-pointer transition text-center"
                  >
                    <Upload className="w-8 h-8 text-[var(--color-text-muted)] mb-2" />
                    <p className="text-[var(--text-sm)] font-medium text-[var(--color-text)]">
                      Bấm vào đây để chọn tệp ảnh từ máy
                    </p>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-1">
                      Hỗ trợ định dạng PNG, JPG, JPEG, SVG hoặc chuẩn DICOM đã xuất ảnh
                    </p>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="upload-img-title" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                  Tiêu đề hình ảnh (bắt buộc)
                </label>
                <input
                  id="upload-img-title"
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Ví dụ: Phim toàn cảnh kiểm tra khớp cắn..."
                  className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                />
              </div>

              {/* Type & Tooth */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="upload-img-type" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                    Loại hình ảnh
                  </label>
                  <select
                    id="upload-img-type"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value as MedicalImageType)}
                    className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer"
                  >
                    {IMAGE_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="upload-img-tooth" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                    Răng liên quan (tùy chọn)
                  </label>
                  <input
                    id="upload-img-tooth"
                    type="number"
                    min="11"
                    max="85"
                    value={uploadTooth}
                    onChange={(e) => setUploadTooth(e.target.value)}
                    placeholder="ví dụ: 16"
                    className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums"
                  />
                </div>
              </div>

              {/* Comparison Role & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="upload-img-role" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                    Mục đích so sánh
                  </label>
                  <select
                    id="upload-img-role"
                    value={uploadRole}
                    onChange={(e) => setUploadRole(e.target.value as "before" | "after" | "regular")}
                    className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] cursor-pointer"
                  >
                    <option value="regular">Thường quy / Định kỳ</option>
                    <option value="before">Trước can thiệp (Before)</option>
                    <option value="after">Sau can thiệp (After)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="upload-img-date" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                    Ngày chụp
                  </label>
                  <input
                    id="upload-img-date"
                    type="text"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    placeholder="dd/MM/yyyy"
                    className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums"
                  />
                </div>
              </div>

              {/* Clinical Notes */}
              <div>
                <label htmlFor="upload-img-notes" className="block text-[var(--text-sm)] font-semibold text-[var(--color-text)] mb-1">
                  Ghi chú chẩn đoán hình ảnh
                </label>
                <textarea
                  id="upload-img-notes"
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Ghi nhận tiêu xương, u nang quanh chóp hoặc hướng răng mọc..."
                  className="w-full px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
                >
                  {isUploading ? "Đang tải lên..." : "Lưu phim chụp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Zoom / Pan Viewer */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white">
          {/* Lightbox Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/80">
            <div>
              <h3 className="text-[16px] font-semibold text-white">
                {lightboxImage.title}
              </h3>
              <p className="text-[12px] text-slate-400">
                Chụp ngày: {lightboxImage.capturedDate} • {lightboxImage.toothNumber ? `Răng: ${lightboxImage.toothNumber}` : "Toàn hàm"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(prev + 0.25, 3))}
                title="Phóng to"
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))}
                title="Thu nhỏ"
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                title="Xoay 90 độ"
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsInverted((prev) => !prev)}
                title="Đảo âm bản X-quang"
                className={`p-2 rounded transition cursor-pointer ${
                  isInverted ? "bg-amber-600 text-white" : "bg-slate-800 hover:bg-slate-700"
                }`}
              >
                <SunMedium className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setRotation(0);
                  setIsInverted(false);
                }}
                className="px-2.5 py-1 text-[12px] rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                Reset
              </button>

              <div className="h-6 w-px bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Đóng"
                className="p-2 rounded bg-slate-800 hover:bg-red-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Image viewport */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <div
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                filter: isInverted ? "invert(1) hue-rotate(180deg)" : "none",
                transition: "transform 0.15s ease-out, filter 0.2s"
              }}
              className="relative max-w-4xl max-h-[75vh] w-full h-[75vh]"
            >
              <Image
                src={lightboxImage.imageUrl}
                alt={lightboxImage.title}
                fill
                unoptimized
                className="w-full h-full object-contain select-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Modal (Before vs After) */}
      {isComparing && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
          {/* Comparison Topbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900">
            <div className="flex items-center gap-2">
              <Columns className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-[16px] font-semibold text-white">
                So sánh hình ảnh lâm sàng: Trước vs Sau điều trị
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-400">
                Đối chiếu kết quả nắn chỉnh, trám răng hoặc cấy ghép Implant
              </span>
              <button
                type="button"
                onClick={() => setIsComparing(false)}
                className="px-3 py-1 text-[12px] rounded bg-slate-800 hover:bg-slate-700 text-white cursor-pointer"
              >
                Đóng so sánh
              </button>
            </div>
          </div>

          {/* Split Screen 50/50 */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 overflow-hidden">
            {/* Panel 1: Trước điều trị (Before) */}
            <div className="flex flex-col p-4 bg-slate-950/60">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-red-600 text-white text-[12px] font-bold">
                    TRƯỚC CAN THIỆP (BEFORE)
                  </span>
                  <span className="text-[13px] font-medium text-slate-300">
                    {beforeImage?.title || "Chưa chọn ảnh"}
                  </span>
                </div>

                {/* Dropdown to pick before image */}
                <select
                  aria-label="Chọn ảnh Trước can thiệp"
                  value={beforeImage?.id || ""}
                  onChange={(e) => {
                    const found = images.find((img) => img.id === e.target.value);
                    if (found) setBeforeImage(found);
                  }}
                  className="px-2 py-1 text-[12px] bg-slate-800 text-white border border-slate-700 rounded cursor-pointer"
                >
                  <option value="">-- Đổi ảnh Trước --</option>
                  {images.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.title} ({img.capturedDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 relative flex items-center justify-center bg-black/40 rounded border border-slate-800 overflow-hidden">
                {beforeImage ? (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={beforeImage.imageUrl}
                      alt="Ảnh trước can thiệp"
                      fill
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-500">Chưa chọn ảnh đối chiếu trước điều trị</p>
                )}
              </div>

              {beforeImage && (
                <div className="mt-2 text-[12px] text-slate-400 flex items-center justify-between">
                  <span>Chụp ngày: {beforeImage.capturedDate}</span>
                  <span>{beforeImage.notes || "Không có ghi chú"}</span>
                </div>
              )}
            </div>

            {/* Panel 2: Sau điều trị (After) */}
            <div className="flex flex-col p-4 bg-slate-950/60">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white text-[12px] font-bold">
                    SAU CAN THIỆP (AFTER)
                  </span>
                  <span className="text-[13px] font-medium text-slate-300">
                    {afterImage?.title || "Chưa chọn ảnh"}
                  </span>
                </div>

                {/* Dropdown to pick after image */}
                <select
                  aria-label="Chọn ảnh Sau can thiệp"
                  value={afterImage?.id || ""}
                  onChange={(e) => {
                    const found = images.find((img) => img.id === e.target.value);
                    if (found) setAfterImage(found);
                  }}
                  className="px-2 py-1 text-[12px] bg-slate-800 text-white border border-slate-700 rounded cursor-pointer"
                >
                  <option value="">-- Đổi ảnh Sau --</option>
                  {images.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.title} ({img.capturedDate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 relative flex items-center justify-center bg-black/40 rounded border border-slate-800 overflow-hidden">
                {afterImage ? (
                  <div className="relative w-full h-full min-h-[300px]">
                    <Image
                      src={afterImage.imageUrl}
                      alt="Ảnh sau can thiệp"
                      fill
                      unoptimized
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <p className="text-[13px] text-slate-500">Chưa chọn ảnh đối chiếu sau điều trị</p>
                )}
              </div>

              {afterImage && (
                <div className="mt-2 text-[12px] text-slate-400 flex items-center justify-between">
                  <span>Chụp ngày: {afterImage.capturedDate}</span>
                  <span>{afterImage.notes || "Không có ghi chú"}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
