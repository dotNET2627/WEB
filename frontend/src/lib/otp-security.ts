import crypto from "node:crypto";

/**
 * Cấu hình bảo mật OTP và Rate Limiting
 */
export const OTP_CONFIG = {
  OTP_LENGTH: 6,
  TTL_SECONDS: 300, // 5 phút
  MAX_FAILED_ATTEMPTS: 5, // Tối đa 5 lần thử sai
  COOLDOWN_SECONDS: 60, // Giãn cách 60 giây giữa 2 lần gửi
  MAX_REQUESTS_PER_PHONE: 3, // Tối đa 3 lần gửi / 10 phút trên mỗi SĐT
  PHONE_WINDOW_SECONDS: 600, // 10 phút
  MAX_REQUESTS_PER_IP: 5, // Tối đa 5 lần gửi / 15 phút trên mỗi IP
  IP_WINDOW_SECONDS: 900 // 15 phút
} as const;

export const GENERIC_OTP_SENT_MESSAGE =
  "Nếu số điện thoại hợp lệ và đã đăng ký trên hệ thống, mã xác thực gồm 6 chữ số đã được gửi.";

interface OtpRecord {
  phone: string;
  hashedOtp: string;
  salt: string;
  createdAt: number;
  expiresAt: number;
  failedAttempts: number;
  isInvalidated: boolean;
}

interface RateLimitRecord {
  timestamps: number[];
  lastRequestedAt: number;
}

interface PatientSession {
  sessionId: string;
  phone: string;
  patientId: string;
  role: "patient";
  createdAt: number;
  expiresAt: number;
}

// In-memory thread-safe stores (hỗ trợ scale sang Redis khi cần)
const otpStore = new Map<string, OtpRecord>();
const phoneRateLimitStore = new Map<string, RateLimitRecord>();
const ipRateLimitStore = new Map<string, RateLimitRecord>();
const sessionStore = new Map<string, PatientSession>();

// Dọn dẹp dữ liệu hết hạn định kỳ
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (record.expiresAt <= now || record.isInvalidated) {
      otpStore.delete(phone);
    }
  }
  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt <= now) {
      sessionStore.delete(sessionId);
    }
  }
}

/**
 * Băm mã OTP bằng SHA-256 kèm muối (Salt) ngẫu nhiên
 */
export function hashOtp(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

/**
 * Sinh mã OTP ngẫu nhiên 6 chữ số bằng hàm CSPRNG mật mã học
 */
export function generateSecureOtp(length: number = OTP_CONFIG.OTP_LENGTH): string {
  // Phạm vi 100000 đến 999999 cho 6 chữ số
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const num = crypto.randomInt(min, max + 1);
  return num.toString();
}

/**
 * Kiểm tra Rate Limit gửi OTP theo Số điện thoại và IP
 */
export function checkOtpRateLimit(
  phone: string,
  ip: string
): { allowed: boolean; retryAfterSeconds?: number; reason?: string } {
  const now = Date.now();

  // 1. Kiểm tra Cooldown theo SĐT (tối thiểu 60s giữa 2 lần bấm)
  const phoneRecord = phoneRateLimitStore.get(phone);
  if (phoneRecord) {
    const elapsedSinceLast = Math.floor((now - phoneRecord.lastRequestedAt) / 1000);
    if (elapsedSinceLast < OTP_CONFIG.COOLDOWN_SECONDS) {
      const waitTime = OTP_CONFIG.COOLDOWN_SECONDS - elapsedSinceLast;
      return {
        allowed: false,
        retryAfterSeconds: waitTime,
        reason: `Vui lòng đợi ${waitTime} giây trước khi yêu cầu mã OTP mới.`
      };
    }

    // Kiểm tra cửa sổ 10 phút của SĐT
    const validWindowStart = now - OTP_CONFIG.PHONE_WINDOW_SECONDS * 1000;
    phoneRecord.timestamps = phoneRecord.timestamps.filter((ts) => ts > validWindowStart);
    if (phoneRecord.timestamps.length >= OTP_CONFIG.MAX_REQUESTS_PER_PHONE) {
      const oldest = phoneRecord.timestamps[0];
      const waitTime = Math.ceil((oldest + OTP_CONFIG.PHONE_WINDOW_SECONDS * 1000 - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, waitTime),
        reason: `Số điện thoại này đã yêu cầu OTP quá ${OTP_CONFIG.MAX_REQUESTS_PER_PHONE} lần trong 10 phút. Vui lòng thử lại sau ${waitTime} giây.`
      };
    }
  }

  // 2. Kiểm tra cửa sổ 15 phút của IP
  const ipRecord = ipRateLimitStore.get(ip);
  if (ipRecord) {
    const validWindowStart = now - OTP_CONFIG.IP_WINDOW_SECONDS * 1000;
    ipRecord.timestamps = ipRecord.timestamps.filter((ts) => ts > validWindowStart);
    if (ipRecord.timestamps.length >= OTP_CONFIG.MAX_REQUESTS_PER_IP) {
      const oldest = ipRecord.timestamps[0];
      const waitTime = Math.ceil((oldest + OTP_CONFIG.IP_WINDOW_SECONDS * 1000 - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, waitTime),
        reason: `Địa chỉ IP của bạn đã gửi yêu cầu quá tần suất cho phép. Vui lòng thử lại sau ${waitTime} giây.`
      };
    }
  }

  return { allowed: true };
}

/**
 * Ghi nhận lượt yêu cầu OTP thành công vào Rate Limiter
 */
export function recordOtpRequest(phone: string, ip: string): void {
  const now = Date.now();

  const phoneRecord = phoneRateLimitStore.get(phone) || { timestamps: [], lastRequestedAt: 0 };
  phoneRecord.timestamps.push(now);
  phoneRecord.lastRequestedAt = now;
  phoneRateLimitStore.set(phone, phoneRecord);

  const ipRecord = ipRateLimitStore.get(ip) || { timestamps: [], lastRequestedAt: 0 };
  ipRecord.timestamps.push(now);
  ipRecord.lastRequestedAt = now;
  ipRateLimitStore.set(ip, ipRecord);
}

/**
 * Lưu trữ mã OTP mới (dưới dạng băm, không lưu plain-text)
 */
export function storeOtp(phone: string, rawOtp: string): void {
  cleanupExpiredRecords();
  const salt = crypto.randomBytes(16).toString("hex");
  const hashedOtp = hashOtp(rawOtp, salt);
  const now = Date.now();

  otpStore.set(phone, {
    phone,
    hashedOtp,
    salt,
    createdAt: now,
    expiresAt: now + OTP_CONFIG.TTL_SECONDS * 1000,
    failedAttempts: 0,
    isInvalidated: false
  });
}

export interface VerifyOtpResult {
  success: boolean;
  errorMessage?: string;
  remainingAttempts?: number;
  phone?: string;
}

/**
 * Xác thực mã OTP nhập vào.
 * - Kiểm tra TTL 5 phút.
 * - Kiểm tra số lần sai (tối đa 5 lần).
 * - Sử dụng timingSafeEqual để chống tấn công Timing Attack.
 */
export function verifyOtp(phone: string, inputOtp: string): VerifyOtpResult {
  const record = otpStore.get(phone);
  const now = Date.now();

  if (!record || record.isInvalidated || record.expiresAt <= now) {
    if (record) otpStore.delete(phone);
    return {
      success: false,
      errorMessage: "Mã OTP không tồn tại hoặc đã hết hạn (hiệu lực trong 5 phút). Vui lòng yêu cầu mã mới."
    };
  }

  // Băm mã OTP nhập vào với salt đã lưu
  const inputHash = hashOtp(inputOtp.trim(), record.salt);
  const isMatch = crypto.timingSafeEqual(Buffer.from(inputHash, "hex"), Buffer.from(record.hashedOtp, "hex"));

  if (!isMatch) {
    record.failedAttempts++;
    const remaining = OTP_CONFIG.MAX_FAILED_ATTEMPTS - record.failedAttempts;

    if (record.failedAttempts >= OTP_CONFIG.MAX_FAILED_ATTEMPTS) {
      record.isInvalidated = true;
      otpStore.delete(phone);
      return {
        success: false,
        remainingAttempts: 0,
        errorMessage: "Bạn đã nhập sai mã OTP 5 lần liên tiếp. Mã này đã bị vô hiệu hóa vì lý do bảo mật. Vui lòng yêu cầu mã mới."
      };
    }

    return {
      success: false,
      remainingAttempts: remaining,
      errorMessage: `Mã OTP không chính xác. Bạn còn ${remaining} lần thử.`
    };
  }

  // Khớp mã thành công -> Hủy mã OTP để không bị tái sử dụng (Replay Attack)
  otpStore.delete(phone);

  return {
    success: true,
    phone
  };
}

/**
 * Tạo Session Server-side cho bệnh nhân sau khi xác thực OTP thành công.
 * Tuyệt đối không nhận patientId từ client! Server tự sinh ID phiên và liên kết hồ sơ.
 */
export function createPatientSession(phone: string): { sessionId: string; session: PatientSession } {
  cleanupExpiredRecords();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  // Session có thời hạn 7 ngày
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000;

  // Giả lập ID bệnh nhân tạo từ hash số điện thoại (hoặc ID từ MongoDB)
  const patientId = "pat_" + crypto.createHash("sha256").update(phone).digest("hex").slice(0, 16);

  const session: PatientSession = {
    sessionId,
    phone,
    patientId,
    role: "patient",
    createdAt: now,
    expiresAt
  };

  sessionStore.set(sessionId, session);
  return { sessionId, session };
}

/**
 * Lấy thông tin Session hợp lệ từ sessionId trong HttpOnly cookie
 */
export function getPatientSession(sessionId: string): PatientSession | null {
  const session = sessionStore.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessionStore.delete(sessionId);
    return null;
  }
  return session;
}

/**
 * Hủy Session khi bệnh nhân đăng xuất
 */
export function revokePatientSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Xác thực CAPTCHA token đơn giản chống bot
 * (Hỗ trợ Turnstile / reCAPTCHA / Math PoW challenge)
 */
export function verifyCaptchaChallenge(solution: string, expectedAnswer: string): boolean {
  if (!solution || !expectedAnswer) return false;
  return solution.trim() === expectedAnswer.trim();
}

/**
 * Reset toàn bộ stores (Dành riêng cho Unit Testing)
 */
export function _resetStoresForTesting(): void {
  otpStore.clear();
  phoneRateLimitStore.clear();
  ipRateLimitStore.clear();
  sessionStore.clear();
}

/**
 * Giả lập bản ghi Rate Limit theo SĐT (Dành riêng cho Unit Testing)
 */
export function _setPhoneRateLimitRecordForTesting(phone: string, timestamps: number[], lastRequestedAt: number): void {
  phoneRateLimitStore.set(phone, { timestamps, lastRequestedAt });
}
