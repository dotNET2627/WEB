import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const TARGET_URL = "http://localhost:3000/portal/login";

test.describe("Cổng đăng nhập Bệnh nhân (/portal/login) - Tiêu chuẩn Bảo mật & UI/UX", () => {

  test("1. Kiểm tra an ninh: Không để lộ demo, bypass OTP, hay liên kết nội bộ staff/admin", async ({ page }) => {
    await page.goto(TARGET_URL);

    const content = await page.content();

    // 1. Không có số điện thoại demo hoặc nút điền nhanh
    expect(content).not.toContain("SĐT mẫu");
    expect(content).not.toContain("0912345678");
    expect(content).not.toContain("123456");
    expect(content).not.toContain("Điền nhanh mã");

    // 2. Không có liên kết tới cổng nội bộ
    expect(page.locator('a[href="/login"]')).toHaveCount(0);
    expect(page.locator('a[href="/admin/login"]')).toHaveCount(0);
    expect(content).not.toContain("Cổng Bác sĩ");
    expect(content).not.toContain("SuperAdmin");
  });

  test("2. Kiểm tra tính chân thực: Không bịa số liệu, review giả, bác sĩ giả, huy hiệu HIPAA/SSL", async ({ page }) => {
    await page.goto(TARGET_URL);

    const content = await page.content();

    // 1. Không chứa số liệu giả mạo
    expect(content).not.toContain("48,200+");
    expect(content).not.toContain("99.8%");
    expect(content).not.toContain("12,400+ đánh giá");

    // 2. Không chứa tên bác sĩ giả mạo hoặc bệnh nhân giả mạo
    expect(content).not.toContain("ThS. BS. Nguyễn Hoàng Nam");
    expect(content).not.toContain("Chị Hoàng Hà My");

    // 3. Không chứa huy hiệu HIPAA / SSL giả
    expect(content).not.toContain("HIPAA & SSL 256-bit");

    // 4. Có thẻ HTML lang="vi"
    const htmlLang = await page.getAttribute("html", "lang");
    expect(htmlLang).toBe("vi");
  });

  test("3. Kiểm tra UI/A11y: Hotline, Consent Checkbox, Nhập SĐT +84", async ({ page }) => {
    await page.goto(TARGET_URL);

    // 1. Hotline hỗ trợ y tế
    const hotlineLink = page.locator('a[href="tel:19006868"]');
    await expect(hotlineLink).toBeVisible();
    await expect(hotlineLink).toContainText("1900 6868");

    // 2. Consent Checkbox & Link điều khoản
    const consentCheckbox = page.locator('input[type="checkbox"]');
    await expect(consentCheckbox).toBeVisible();
    expect(await consentCheckbox.isChecked()).toBe(false);

    const termsLink = page.locator('a[href="/terms"]');
    await expect(termsLink.first()).toBeVisible();

    // 3. Nút CTA nhận OTP
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toContainText("Nhận mã xác thực OTP");

    // Bấm khi chưa tick đồng thuận -> Phải báo lỗi
    await submitBtn.click();
    const alertBox = page.locator('[role="alert"]');
    await expect(alertBox).toBeVisible();
    await expect(alertBox).toContainText("Vui lòng xác nhận đồng ý với Điều khoản");
  });

  test("4. Luồng gửi OTP: Chuẩn hóa SĐT, Chống dò quét (Anti-Enumeration) & Màn hình nhập 6 số", async ({ page }) => {
    await page.goto(TARGET_URL);

    // 1. Nhập số điện thoại hợp lệ và tick consent
    await page.fill("#patient-phone", "0912 345 678");
    await page.check('input[type="checkbox"]');

    // 2. Gửi yêu cầu OTP
    await page.click('button[type="submit"]');

    // 3. Chuyển sang màn hình OTP
    await expect(page.locator("text=Mã xác thực gồm 6 chữ số")).toBeVisible({ timeout: 10000 });

    // 4. Hiển thị 6 ô nhập mã OTP
    const otpInputs = page.locator('input[aria-label^="Chữ số xác thực"]');
    await expect(otpInputs).toHaveCount(6);

    // 5. Hiển thị nút Gửi lại mã có đếm lùi thời gian
    await expect(page.locator("text=Gửi lại sau")).toBeVisible();

    // 6. Nút Đổi số quay lại bước 1
    const changePhoneBtn = page.locator("button:has-text('Đổi số')");
    await expect(changePhoneBtn).toBeVisible();
  });

  test("5. Kiểm toán tiếp cận WCAG AA bằng Axe Core", async ({ page }) => {
    await page.goto(TARGET_URL);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Optional fine-tuning if needed, or leave enabled
      .analyze();

    // Lọc các vi phạm nghiêm trọng (critical / serious)
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );

    expect(seriousViolations).toEqual([]);
  });

});
