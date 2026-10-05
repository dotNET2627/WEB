/**
 * Tiện ích chuẩn hóa và xác thực số điện thoại di động Việt Nam.
 * Tuân thủ quy hoạch kho số viễn thông Việt Nam (10 chữ số).
 */

// Các đầu số di động hợp lệ tại Việt Nam: 03x, 05x, 07x, 08x, 09x
const VIETNAM_PHONE_REGEX = /^(03[2-9]|05[689]|07[06-9]|08[1-9]|09[0-9])\d{7}$/;

export interface PhoneValidationResult {
  isValid: boolean;
  normalizedPhone: string;
  errorMessage?: string;
}

/**
 * Chuẩn hóa số điện thoại nhập từ nhiều định dạng (+84, 84, khoảng trắng, gạch nối)
 * về dạng chuẩn 10 số bắt đầu bằng 0 (ví dụ: 0912345678).
 */
export function normalizeVietnamesePhone(input: string): string {
  if (!input) return "";

  // Loại bỏ tất cả ký tự không phải chữ số, ngoại trừ dấu + ở đầu
  let cleaned = input.trim().replace(/[\s\-_().]/g, "");

  // Xử lý tiền tố quốc tế +84 hoặc 84
  if (cleaned.startsWith("+84")) {
    cleaned = "0" + cleaned.slice(3);
  } else if (cleaned.startsWith("84") && cleaned.length > 9) {
    cleaned = "0" + cleaned.slice(2);
  }

  // Chỉ giữ lại các chữ số
  return cleaned.replace(/\D/g, "");
}

/**
 * Kiểm tra tính hợp lệ của số điện thoại di động Việt Nam.
 */
export function validateVietnamesePhone(input: string): PhoneValidationResult {
  const normalized = normalizeVietnamesePhone(input);

  if (!normalized) {
    return {
      isValid: false,
      normalizedPhone: "",
      errorMessage: "Vui lòng nhập số điện thoại."
    };
  }

  if (normalized.length !== 10) {
    return {
      isValid: false,
      normalizedPhone: normalized,
      errorMessage: "Số điện thoại di động Việt Nam phải gồm đúng 10 chữ số."
    };
  }

  if (!VIETNAM_PHONE_REGEX.test(normalized)) {
    return {
      isValid: false,
      normalizedPhone: normalized,
      errorMessage: "Đầu số điện thoại không hợp lệ hoặc không thuộc nhà mạng viễn thông Việt Nam."
    };
  }

  return {
    isValid: true,
    normalizedPhone: normalized
  };
}

/**
 * Định dạng số điện thoại để hiển thị dễ đọc (ví dụ: 0912 345 678).
 */
export function formatPhoneDisplay(normalizedPhone: string): string {
  if (normalizedPhone.length === 10) {
    return `${normalizedPhone.slice(0, 4)} ${normalizedPhone.slice(4, 7)} ${normalizedPhone.slice(7)}`;
  }
  return normalizedPhone;
}

/**
 * Làm mờ số điện thoại để bảo vệ quyền riêng tư (ví dụ: 0912 *** 678).
 */
export function maskPhoneDisplay(normalizedPhone: string): string {
  if (normalizedPhone.length === 10) {
    return `${normalizedPhone.slice(0, 4)} *** ${normalizedPhone.slice(7)}`;
  }
  return normalizedPhone;
}
