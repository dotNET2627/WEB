import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeVietnamesePhone,
  validateVietnamesePhone,
  maskPhoneDisplay
} from "../../src/lib/phone-utils.ts";
import {
  OTP_CONFIG,
  generateSecureOtp,
  hashOtp,
  storeOtp,
  verifyOtp,
  checkOtpRateLimit,
  recordOtpRequest,
  createPatientSession,
  getPatientSession,
  revokePatientSession,
  _resetStoresForTesting,
  _setPhoneRateLimitRecordForTesting
} from "../../src/lib/otp-security.ts";

test.beforeEach(() => {
  _resetStoresForTesting();
});

test("1. Chuẩn hóa & Xác thực số điện thoại di động Việt Nam (+84)", async (t) => {
  await t.test("Chuẩn hóa các định dạng nhập liệu khác nhau về chuẩn 10 chữ số", () => {
    assert.equal(normalizeVietnamesePhone("+84912345678"), "0912345678");
    assert.equal(normalizeVietnamesePhone("84912345678"), "0912345678");
    assert.equal(normalizeVietnamesePhone("0912 345 678"), "0912345678");
    assert.equal(normalizeVietnamesePhone("0912-345-678"), "0912345678");
    assert.equal(normalizeVietnamesePhone("+84 987.654.321"), "0987654321");
  });

  await t.test("Chấp nhận tất cả các đầu số di động hợp lệ (03x, 05x, 07x, 08x, 09x)", () => {
    const validPhones = [
      "0321234567",
      "0561234567",
      "0701234567",
      "0811234567",
      "0901234567"
    ];
    for (const phone of validPhones) {
      const res = validateVietnamesePhone(phone);
      assert.equal(res.isValid, true, `Số ${phone} phải hợp lệ`);
      assert.equal(res.normalizedPhone, phone);
    }
  });

  await t.test("Từ chối số điện thoại không hợp lệ (sai độ dài, sai đầu số, ký tự lạ)", () => {
    const invalidPhones = [
      "",
      "0123456789", // Đầu 01x cũ (đã đổi sang 08x/03x/07x)
      "091234567", // 9 số
      "09123456789", // 11 số
      "02438257888", // Số cố định Hà Nội
      "abcdefghij"
    ];
    for (const phone of invalidPhones) {
      const res = validateVietnamesePhone(phone);
      assert.equal(res.isValid, false, `Số ${phone} phải bị từ chối`);
      assert.ok(res.errorMessage);
    }
  });

  await t.test("Ẩn bảo mật số điện thoại (masking) hiển thị cho bệnh nhân", () => {
    const masked = maskPhoneDisplay("0912345678");
    assert.equal(masked, "0912 *** 678");
    assert.equal(maskPhoneDisplay(""), "");
  });
});

test("2. Sinh mã OTP CSPRNG & Băm mật mã SHA-256", async (t) => {
  await t.test("Mã OTP ngẫu nhiên phải đúng 6 chữ số và không cố định", () => {
    const samples = new Set();
    for (let i = 0; i < 50; i++) {
      const otp = generateSecureOtp();
      assert.equal(otp.length, 6);
      assert.match(otp, /^\d{6}$/);
      samples.add(otp);
    }
    // Độ ngẫu nhiên cao: 50 mẫu ngẫu nhiên không thể trùng toàn bộ
    assert.ok(samples.size > 40, "CSPRNG phải sinh mã ngẫu nhiên, không lặp lại");
  });

  await t.test("Băm SHA-256 kèm muối (Salt) ngăn chặn Rainbow Table", () => {
    const hash1 = hashOtp("123456", "salt-alpha");
    const hash2 = hashOtp("123456", "salt-beta");
    assert.notEqual(hash1, hash2, "Cùng mã OTP nhưng khác salt phải cho ra hash khác nhau");
    assert.equal(hash1.length, 64, "SHA-256 hex digest phải dài đúng 64 ký tự");
  });
});

test("3. Xác thực OTP, Chống Replay Attack & Khóa sau 5 lần sai", async (t) => {
  const phone = "0912345678";
  const correctOtp = "849201";

  await t.test("Xác thực thành công và xóa mã ngay lập tức (Chống Replay Attack)", () => {
    storeOtp(phone, correctOtp);
    
    // Lần 1: Xác thực đúng
    const result1 = verifyOtp(phone, correctOtp);
    assert.equal(result1.success, true);
    assert.equal(result1.phone, phone);

    // Lần 2: Thử dùng lại mã cũ -> Bị từ chối ngay lập tức
    const result2 = verifyOtp(phone, correctOtp);
    assert.equal(result2.success, false);
    assert.match(result2.errorMessage, /hết hạn|không tồn tại/i);
  });

  await t.test("Đếm lùi số lần sai và vô hiệu hóa sau đúng 5 lần nhập sai", () => {
    storeOtp(phone, correctOtp);

    // Lần 1 sai
    let res = verifyOtp(phone, "000001");
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 4);

    // Lần 2 sai
    res = verifyOtp(phone, "000002");
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 3);

    // Lần 3 sai
    res = verifyOtp(phone, "000003");
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 2);

    // Lần 4 sai
    res = verifyOtp(phone, "000004");
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 1);

    // Lần 5 sai: Bị khóa mã
    res = verifyOtp(phone, "000005");
    assert.equal(res.success, false);
    assert.equal(res.remainingAttempts, 0);
    assert.match(res.errorMessage, /vô hiệu hóa|5 lần/i);

    // Lần 6: Kể cả nhập đúng mã gốc sau khi bị khóa cũng không thể vào
    const lockedRes = verifyOtp(phone, correctOtp);
    assert.equal(lockedRes.success, false);
  });
});

test("4. Rate Limiting đa chiều (Theo Số điện thoại & IP)", async (t) => {
  const phone = "0988776655";
  const ip = "192.168.1.100";

  await t.test("Áp dụng Cooldown 60 giây giữa 2 lần gửi liên tiếp trên cùng SĐT", () => {
    // Lần 1: Cho phép
    let check = checkOtpRateLimit(phone, ip);
    assert.equal(check.allowed, true);
    recordOtpRequest(phone, ip);

    // Lần 2 ngay sau đó: Bị chặn bởi Cooldown
    check = checkOtpRateLimit(phone, ip);
    assert.equal(check.allowed, false);
    assert.ok(check.retryAfterSeconds > 0 && check.retryAfterSeconds <= 60);
    assert.match(check.reason, /giây/);
  });

  await t.test("Giới hạn tối đa 3 lần / 10 phút trên mỗi số điện thoại", () => {
    const anotherPhone = "0977112233";
    const now = Date.now();
    // Giả lập 3 lần gửi trước đó trong vòng 10 phút, và lần gửi gần nhất cách đây 65 giây (> 60s cooldown)
    const timestamps = [
      now - 5 * 60 * 1000,
      now - 3 * 60 * 1000,
      now - 65 * 1000
    ];
    _setPhoneRateLimitRecordForTesting(anotherPhone, timestamps, now - 65 * 1000);

    // Lần yêu cầu thứ 4: Không bị chặn bởi cooldown nhưng bị chặn bởi hạn mức 3 lần / 10 phút
    const check = checkOtpRateLimit(anotherPhone, "10.0.0.99");
    assert.equal(check.allowed, false);
    assert.match(check.reason, /10 phút/);
  });

  await t.test("Giới hạn tối đa 5 lần / 15 phút trên mỗi địa chỉ IP", () => {
    const spamIp = "203.113.130.1";
    // Giả lập 5 yêu cầu từ 5 số điện thoại khác nhau từ cùng 1 IP
    for (let i = 1; i <= OTP_CONFIG.MAX_REQUESTS_PER_IP; i++) {
      const distinctPhone = `091100000${i}`;
      recordOtpRequest(distinctPhone, spamIp);
    }

    // Yêu cầu thứ 6 từ IP đó: Bị chặn bất kể SĐT nào
    const check = checkOtpRateLimit("0999888777", spamIp);
    assert.equal(check.allowed, false);
    assert.match(check.reason, /IP/);
  });
});

test("5. Quản lý Phiên làm việc (Session) Server-side độc lập & Phân quyền", async (t) => {
  const phone = "0912345678";

  await t.test("Tạo Session an toàn, không nhận patientId từ client", () => {
    const { sessionId, session } = createPatientSession(phone);
    assert.ok(sessionId.length >= 32, "Session token phải đủ độ dài bảo mật");
    assert.equal(session.phone, phone);
    assert.equal(session.role, "patient");
    assert.ok(session.patientId.startsWith("pat_"));
    assert.ok(session.expiresAt > Date.now());

    // Kiểm tra truy vấn session
    const retrieved = getPatientSession(sessionId);
    assert.deepEqual(retrieved, session);

    // Kiểm tra hủy session
    revokePatientSession(sessionId);
    assert.equal(getPatientSession(sessionId), null);
  });
});
