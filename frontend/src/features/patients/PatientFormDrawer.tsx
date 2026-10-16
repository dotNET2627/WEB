"use client";

import React, { useState, useEffect } from "react";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { validateVietnamesePhone } from "@/lib/phone-utils";
import type { PatientListItem, CreatePatientRequest, UpdatePatientRequest } from "@/types/patient";

interface PatientFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  patientToEdit?: PatientListItem | null;
  onSuccess: (patientId?: string) => void;
  onSubmitCreate: (data: CreatePatientRequest) => Promise<void>;
  onSubmitUpdate: (id: string, data: UpdatePatientRequest) => Promise<void>;
}

export function PatientFormDrawer({
  isOpen,
  onClose,
  patientToEdit,
  onSuccess,
  onSubmitCreate,
  onSubmitUpdate
}: PatientFormDrawerProps) {
  const isEditing = !!patientToEdit;

  const [fullName, setFullName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // yyyy-MM-dd for input[type="date"]
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patientToEdit) {
      setFullName(patientToEdit.fullName || "");
      setPatientCode(patientToEdit.patientCode || "");
      setPhoneNumber(patientToEdit.phoneNumber || "");
      if (patientToEdit.dateOfBirth) {
        // Normalize to yyyy-MM-dd if it's ISO string
        const d = patientToEdit.dateOfBirth.split("T")[0];
        setDateOfBirth(d);
      } else {
        setDateOfBirth("");
      }
    } else {
      setFullName("");
      setPatientCode("");
      setPhoneNumber("");
      setDateOfBirth("");
    }
    setErrors({});
  }, [patientToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    // Validate Full Name
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Họ và tên bệnh nhân không được để trống.";
    } else if (trimmedName.length < 2) {
      newErrors.fullName = "Họ và tên bệnh nhân phải có ít nhất 2 ký tự.";
    }

    // Validate Phone Number if provided
    const trimmedPhone = phoneNumber.trim();
    if (trimmedPhone) {
      const phoneValidation = validateVietnamesePhone(trimmedPhone);
      if (!phoneValidation.isValid) {
        newErrors.phoneNumber = phoneValidation.errorMessage || "Số điện thoại chưa hợp lệ.";
      }
    }

    // Validate Date of Birth
    if (dateOfBirth) {
      const selectedDate = new Date(dateOfBirth);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        newErrors.dateOfBirth = "Ngày sinh không được sau ngày hôm nay.";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && patientToEdit) {
        const payload: UpdatePatientRequest = {
          fullName: trimmedName,
          patientCode: patientCode.trim() || undefined,
          phoneNumber: trimmedPhone || undefined,
          dateOfBirth: dateOfBirth || undefined
        };
        await onSubmitUpdate(patientToEdit.id, payload);
        onSuccess(patientToEdit.id);
      } else {
        const payload: CreatePatientRequest = {
          fullName: trimmedName,
          patientCode: patientCode.trim() || undefined,
          phoneNumber: trimmedPhone || undefined,
          dateOfBirth: dateOfBirth || undefined
        };
        await onSubmitCreate(payload);
        onSuccess();
      }
      onClose();
    } catch {
      // Errors handled by caller or toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={onClose}
        className="px-4 py-2 border border-[var(--color-border)] rounded-[var(--radius)] text-[var(--text-sm)] font-medium text-[var(--color-text)] hover:bg-[var(--color-bg)] transition disabled:opacity-50 cursor-pointer"
      >
        Hủy bỏ
      </button>
      <button
        type="submit"
        form="patient-form"
        disabled={isSubmitting}
        className="px-5 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Thêm bệnh nhân"}
      </button>
    </>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Cập nhật hồ sơ bệnh nhân" : "Tiếp nhận hồ sơ bệnh nhân mới"}
      description={
        isEditing
          ? `Mã hồ sơ: ${patientToEdit?.patientCode || patientToEdit?.id?.slice(0, 8)}`
          : "Nhập thông tin hành chính của bệnh nhân để bắt đầu theo dõi điều trị."
      }
      footer={footer}
    >
      <form id="patient-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Họ và tên bệnh nhân"
          required
          id="patient-fullname"
          error={errors.fullName}
          hint="Nhập đầy đủ họ tên có dấu, ví dụ: Nguyễn Văn An"
        >
          <input
            id="patient-fullname"
            type="text"
            autoComplete="off"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: "" }));
            }}
            placeholder="ví dụ: Nguyễn Văn An"
            className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Mã hồ sơ bệnh nhân"
            id="patient-code"
            hint="Để trống nếu muốn hệ thống tự cấp mã"
          >
            <input
              id="patient-code"
              type="text"
              autoComplete="off"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value.toUpperCase())}
              placeholder="ví dụ: BN-00123"
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] font-mono text-[var(--text-sm)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>

          <FormField
            label="Số điện thoại di động"
            id="patient-phone"
            error={errors.phoneNumber}
            hint="10 chữ số, ví dụ: 0912345678"
          >
            <input
              id="patient-phone"
              type="tel"
              autoComplete="tel-national"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: "" }));
              }}
              placeholder="0912 345 678"
              className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
            />
          </FormField>
        </div>

        <FormField
          label="Ngày sinh"
          id="patient-dob"
          error={errors.dateOfBirth}
          hint="Định dạng ngày/tháng/năm"
        >
          <input
            id="patient-dob"
            type="date"
            max={new Date().toISOString().split("T")[0]}
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              if (errors.dateOfBirth) setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
            }}
            className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] tabular-nums focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </FormField>
      </form>
    </Drawer>
  );
}
