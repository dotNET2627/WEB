# Hướng dẫn Sử dụng Phân hệ Quản lý Kho Dược & Kê Đơn Thuốc

> **Phân hệ:** Quản lý Vật tư Y tế, Lô hàng (FEFO) & Đơn thuốc Điện tử  
> **Người phụ trách:** Nguyễn Nguyên Bảo (MSV: `3123410027`) — Nhóm 02

---

## 1. Dành cho Thủ kho / Quản lý Phòng khám (`/inventory`)

### 1.1. Quản lý Danh mục Vật tư & Thuốc
1. Chọn phòng khám làm việc ở thanh điều hướng trên cùng.
2. Tại tab **Danh mục Vật tư**, bấm **Thêm vật tư** để khai báo Mã vật tư, Tên, Phân loại, Đơn vị tính (`Hộp`, `Viên`, `Tuýp`...) và **Ngưỡng tồn kho tối thiểu**.
3. Hệ thống tự động cộng tổng tồn kho từ các lô còn hạn và gắn nhãn đỏ **"Sắp hết hàng"** khi tồn kho $\le$ ngưỡng tối thiểu.

### 1.2. Nhập lô & Xuất kho theo nguyên tắc FEFO
* Tại tab **Lô hàng & Xuất FEFO**, chọn vật tư cần thao tác:
  * **Nhập lô mới:** Nhập Số lô, Hạn sử dụng (HSD), Số lượng và Giá nhập. Lô mới tự động được sắp xếp theo HSD tăng dần (**First Expired, First Out**).
  * **Đánh dấu màu cảnh báo:** Lô quá hạn tô **đỏ**, lô còn $\le 30$ ngày tô **vàng**.
  * **Xuất kho FEFO:** Chọn loại phiếu (*Xuất thủ thuật*, *Xuất hủy hỏng*, *Điều chỉnh*) và nhập số lượng. Hệ thống tự động trừ từ lô có HSD gần nhất (bỏ qua lô đã hết hạn) và hiển thị chi tiết từng lô đã trừ.

### 1.3. Kiểm kê kho cuối tháng (Audit Stock) & Nhà cung cấp
* **Kiểm kê lô:** Bấm nút **Kiểm kê** ở từng dòng lô hàng, nhập số lượng thực tế kiểm đếm và lý do chênh lệch. Hệ thống tự động cân bằng số lượng và ghi nhận giao dịch `Adjustment`.
* **Nhà cung cấp:** Quản lý thông tin liên hệ các nhà cung cấp vật tư nha khoa tại tab **Nhà cung cấp**.

### 1.4. Báo cáo Cảnh báo, Giá trị kho & Xuất Excel (CSV)
* Tab **Cảnh báo & Giá trị kho:** Xem tổng giá trị hàng tồn còn hạn, lọc lô cận hạn **30 / 60 / 90 ngày**, và xem cột **Gợi ý nhập bổ sung** cho các mặt hàng thiếu hụt.
* Tab **Lịch sử Giao dịch:** Tra cứu toàn bộ phiếu nhập/xuất/cấp thuốc/kiểm kê và bấm **Xuất Excel (CSV)** để tải file báo cáo chuẩn UTF-8.

---

## 2. Dành cho Bác sĩ & Dược sĩ (`/prescriptions`)

1. Bấm **Kê đơn thuốc mới**, nhập thông tin bệnh nhân, chẩn đoán và tiền sử dị ứng (hệ thống tự động cảnh báo xung đột dị ứng thuốc).
2. Chọn thuốc từ danh sách **Thuốc / Vật tư trong Kho** (hiển thị sẵn số lượng tồn kho khả dụng) hoặc danh mục mẫu chuẩn, thiết lập liều dùng Sáng/Trưa/Chiều/Tối.
3. Chọn **Ký & Phát hành đơn** (hoặc **Lưu bản nháp**).
4. Khi cấp thuốc cho bệnh nhân, bấm **Cấp thuốc** (hoặc **Cấp thuốc & Trừ kho** trong chi tiết đơn) — hệ thống thực hiện trừ kho tự động theo **FEFO** trong một MongoDB Transaction để đảm bảo không bao giờ âm kho, đồng thời hỗ trợ **In đơn thuốc** trực tiếp.
