# Hướng Dẫn Cài Đặt & Sử Dụng MongoDB cho Dental Management System

Hệ thống sử dụng **MongoDB 6.0+** kết hợp với **.NET 10** theo mô hình **Code-First**. 
Mọi Collection, Index và Dữ liệu mẫu (Seed Data) đều được ứng dụng tự động khởi tạo khi chạy, **không cần tạo bảng hay chạy script thủ công**.

---

## 1. Cài đặt MongoDB

Có 2 cách để chạy MongoDB:

### Cách 1: Dùng Docker (Khuyên dùng - Nhanh nhất)
Từ thư mục gốc dự án:
```bash
docker compose up -d
```
Lệnh này sẽ khởi động MongoDB trên cổng mặc định `localhost:27017` với cấu hình lưu trữ sẵn.

### Cách 2: Cài đặt trực tiếp trên máy
1. **MongoDB Server**: Tải và cài đặt [MongoDB Community Server](https://www.mongodb.com/try/download/community). Khi cài đặt nhớ tích chọn **Install MongoDB Compass** để có giao diện trực quan.
2. **MongoDB Shell (mongosh)**: Tải [MongoDB Shell](https://www.mongodb.com/try/download/shell) nếu muốn dùng dòng lệnh:
   - Giải nén tệp zip vào một thư mục (ví dụ `C:\tools\mongosh-x.x.x\bin`).
   - Thêm đường dẫn thư mục `bin` vào biến môi trường `Path` (Environment Variables) của hệ điều hành.

---

## 2. Kết nối & Khởi chạy Database (Code-First)

1. Mở **MongoDB Compass** và kết nối tới:
   ```
   mongodb://localhost:27017
   ```
2. Chạy ứng dụng Backend:
   ```bash
   cd src/DentalManagement.Api
   dotnet run
   ```

### ⚡ Điều gì sẽ diễn ra tự động?
Khi Backend API khởi động:
1. **`MongoIndexInitializerHostedService`** tự động tạo toàn bộ Index cần thiết (Unique, Compound, Partial Filter, TTL Index).
2. **`DatabaseSeedHostedService`** tự động khởi tạo:
   - Các vai trò mặc định: `SuperAdmin` (toàn quyền) và `Doctor`.
   - Chi nhánh / phòng khám mặc định.
   - Tài khoản Admin mặc định: `admin@dental.vn` / `Password123!`.
   - Dữ liệu bác sĩ mẫu kèm lịch trực tuần hoàn.
3. Database `DentalManagement` và các collection sẽ tự động xuất hiện đầy đủ trong MongoDB Compass.

---

## 3. Danh sách Collections chuẩn trong hệ thống (`CollectionNames.cs`)

Toàn bộ tên collection được chuẩn hóa theo danh mục tiếng Anh:

| Tên Collection | Nghiệp vụ tương ứng |
|---|---|
| `users` | Tài khoản người dùng |
| `roles` | Vai trò và quyền hạn (RBAC) |
| `refresh_tokens` | Token phiên đăng nhập (tự hủy qua TTL) |
| `clinics` | Chi nhánh phòng khám |
| `doctors` | Hồ sơ bác sĩ & lịch trực tuần hoàn |
| `patients` | Hồ sơ bệnh nhân & tiền sử bệnh |
| `appointments` | Lịch hẹn khám chữa bệnh |
| `treatmentPlans` | Kế hoạch & phác đồ điều trị |
| `services` | Danh mục dịch vụ khám & giá |
| `medicalImages` | Hình ảnh y tế, phim X-quang |
| `prescriptions` | Đơn thuốc điện tử |
| `invoices` | Hóa đơn & lịch sử thanh toán |
| `discountPrograms` | Chương trình ưu đãi, giảm giá |
| `inventoryItems` | Danh mục vật tư y tế |
| `inventoryBatches` | Quản lý lô hàng vật tư (FEFO) |
| `inventoryTransactions`| Lịch sử xuất/nhập/kiểm kê kho |
| `insuranceClaims` | Yêu cầu bồi thường bảo hiểm |
| `auditLogs` | Nhật ký kiểm toán hệ thống |

---

## 4. Bảng so sánh SQL Server vs MongoDB

| Thành phần SQL Server | Thành phần MongoDB | Giải thích |
|---|---|---|
| **Database** | **Database** | Nơi chứa toàn bộ dữ liệu hệ thống (`DentalManagement`). |
| **Table** | **Collection** | Nơi chứa dữ liệu dạng document (tương đương bảng). |
| **Row** | **Document** | Dữ liệu dạng BSON/JSON có cấu trúc. |
| **Column** | **Field** | Các trường dữ liệu trong document. |
| **Primary Key (PK)** | **_id** | Khóa chính (hệ thống dùng GUID/UUID chuẩn). |
| **JOIN** | **$lookup / Embedding** | Nhúng trực tiếp đối tượng con hoặc kết hợp qua ID. |
| **Index** | **Index** | Tối ưu hóa truy vấn và bảo đảm tính duy nhất (Unique). |
