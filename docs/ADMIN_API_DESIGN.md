# TÀI LIỆU THIẾT KẾ HỆ THỐNG API CHO ADMIN TỔNG (SUPERADMIN)
## Quản Lý Toàn Bộ Chi Nhánh — Hệ Thống Quản Lý Phòng Khám Nha Khoa
**Công nghệ:** ASP.NET Core (.NET 10) | Clean Architecture | MongoDB (NoSQL)  
**Tài liệu tham chiếu:** MongoDB Persistence (`CollectionNames.cs`, `Documents/*`), `databaseshema.sql`, `ADMIN_UI_RULES.md`, `GEMINI.md`

---

## I. TỔNG QUAN KIẾN TRÚC & MÔ HÌNH MONGODB MULTI-BRANCH

### 1. Danh Mục Collections MongoDB Tương Ứng Trong Dự Án
Hệ thống sử dụng các Collection được định nghĩa tại `CollectionNames.cs`:
- `phongkham` (`ClinicDocument`): Thông tin cơ sở/chi nhánh, địa chỉ, giờ mở cửa JSONB, trạng thái hoạt động.
- `users` (`UserDocument`): Tài khoản người dùng, hash mật khẩu, trạng thái khóa, và mảng phân quyền đa chi nhánh `assignments`.
- `roles` (`RoleDocument`): Định nghĩa vai trò hệ thống và danh sách `permissions` dạng chuỗi (dựa trên `DefaultPermissions`).
- `bacsi` (`DoctorDocument`): Hồ sơ năng lực bác sĩ, chứng chỉ hành nghề, và mảng ca trực tuần hoàn `calamviec` (`WorkScheduleDocument`) gắn theo từng chi nhánh.
- `benhnhan` (`PatientDocument`): Hồ sơ bệnh nhân liên thông toàn chuỗi, tiền sử bệnh lý, cảnh báo y tế.
- `appointments` (`AppointmentDocument`): Lịch hẹn khám theo từng chi nhánh (`clinicId`), bác sĩ, bệnh nhân và dịch vụ dự kiến.
- `services`: Danh mục dịch vụ nha khoa, đơn giá niêm yết, thời gian dự kiến.
- `treatmentPlans`: Phác đồ điều trị dài hạn và các hạng mục thủ thuật.
- `inventoryItems`, `inventoryBatches`, `inventoryTransactions`: Quản lý kho, tồn kho theo lô FEFO và hạn dùng tại từng chi nhánh.
- `invoices`: Hóa đơn viện phí theo chi nhánh, dòng chi tiết và các đợt thanh toán.
- `discountPrograms`: Chương trình khuyến mãi áp dụng toàn hệ thống hoặc riêng từng cơ sở.
- `auditLogs`: Nhật ký kiểm toán y tế và an toàn hệ thống (Read & Insert only).

### 2. Cơ Chế Phân Quyền Đa Chi Nhánh (Multi-Branch Role Assignments)
Trong `UserDocument`, phân quyền được tổ chức dạng mảng:
```json
"assignments": [
  {
    "roleId": "UUID_ROLE_SUPERADMIN",
    "clinicId": null,
    "assignedAt": "2026-10-05T08:00:00Z",
    "assignedBy": null
  }
]
```
- **Admin Tổng (SuperAdmin):** Có `clinicId = null`. Tài khoản này có quyền truy cập toàn bộ dữ liệu của tất cả chi nhánh trong hệ thống.
- **Quản lý Chi Nhánh (Branch Manager):** Có `clinicId = "<UUID_CHI_NHANH>"`. Chỉ xem và thao tác trên chi nhánh được chỉ định.
- **Context Chi Nhánh cho Admin Tổng:** Khi Admin Tổng gọi API:
  - Mặc định: Trả về dữ liệu **hợp nhất toàn chuỗi**.
  - Lọc theo chi nhánh cụ thể: Truyền Query Parameter `?clinicId={guid}` hoặc HTTP Header `X-Branch-Id: {guid}`.

### 3. Quy Ước Thiết Kế API & Bảo Mật
- **Base URL:** `/api/v1/admin/...`
- **Xác thực:** JWT Bearer Token (`Authorization: Bearer <token>`).
- **Phân quyền:** Kiểm tra quyền thông qua `DynamicPermissionPolicyProvider` và `DefaultPermissions`.
- **An toàn y tế & PII:** Không đặt SĐT, CCCD, tên bệnh nhân lên URL. SĐT mặc định che dạng `091****678`.
- **Thao tác nguy hiểm:** Không xóa cứng (Hard Delete) hồ sơ, hóa đơn, người dùng. Sử dụng `isActive = false` hoặc `isDeleted = true` kèm lý do bắt buộc. Các hành động nhạy cảm yêu cầu nhập lại mật khẩu (`X-Admin-Password`).
- **Audit Log:** Tự động ghi lại `nguoidungid`, `hanhdong`, `doituong`, `doituongid`, `giatricu`, `giatrimoi`, `diachiip` vào collection `auditLogs`.

---

## II. ĐỊNH DẠNG REQUEST & RESPONSE CHUẨN

### 1. Phản hồi thành công (Standard Success Response)
```json
{
  "success": true,
  "data": { ... },
  "message": "Thao tác thành công",
  "timestamp": "2026-10-05T16:00:00Z"
}
```

### 2. Phân trang chuẩn (`PagedResult<T>`)
```json
{
  "items": [ ... ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 142,
  "totalPages": 8,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### 3. Phản hồi lỗi chuẩn (RFC 7807 Problem Details)
```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "Thao tác không hợp lệ",
  "status": 400,
  "detail": "Không thể tạm dừng hoạt động chi nhánh khi còn 12 lịch hẹn đang chờ khám hôm nay.",
  "code": "branch.active_appointments_exist",
  "instance": "/api/v1/admin/clinics/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d/status"
}
```

---

## III. MA TRẬN API CHO ADMIN TỔNG (CHI TIẾT 9 PHÂN HỆ)

### PHÂN HỆ 1: QUẢN TRỊ CƠ SỞ & CHI NHÁNH (`/api/v1/admin/clinics`)
*Ánh xạ Collection: `phongkham` (`ClinicDocument`)*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/clinics` | `clinics.read` | Lấy danh sách toàn bộ chi nhánh (kèm thống kê: số bác sĩ, số ghế, trạng thái). |
| `GET` | `/api/v1/admin/clinics/{id}` | `clinics.read` | Lấy thông tin chi tiết chi nhánh, cấu hình giờ mở cửa `giomocua`. |
| `POST` | `/api/v1/admin/clinics` | `clinics.create` | Tạo mới cơ sở phòng khám trong chuỗi. |
| `PUT` | `/api/v1/admin/clinics/{id}` | `clinics.update` | Cập nhật thông tin chi nhánh (Tên, địa chỉ, hotline, giờ mở cửa, logo). |
| `PATCH` | `/api/v1/admin/clinics/{id}/status` | `clinics.delete` | Tạm ngưng hoạt động / Mở lại chi nhánh (yêu cầu lý do, ghi `auditLogs`). |

#### Body mẫu `POST /api/v1/admin/clinics`:
```json
{
  "name": "Nha Khoa Nụ Cười - Chi Nhánh Cầu Giấy",
  "address": "Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội",
  "phoneNumber": "02439123456",
  "email": "caugiay@nucuoi.vn",
  "description": "Chi nhánh chuyên chỉnh nha và răng sứ thẩm mỹ",
  "openingHours": {
    "t2_t7": "08:00 - 20:00",
    "cn": "08:00 - 17:00"
  },
  "logo": "https://cdn.nucuoi.vn/logos/caugiay.png"
}
```

---

### PHÂN HỆ 2: QUẢN TRỊ NHÂN SỰ & PHÂN QUYỀN ĐA CHI NHÁNH (`/api/v1/admin/users`, `/roles`)
*Ánh xạ Collection: `users` (`UserDocument`), `roles` (`RoleDocument`)*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/users` | `settings.manage` | Danh sách tài khoản toàn hệ thống (lọc theo chi nhánh, vai trò, trạng thái khóa). |
| `GET` | `/api/v1/admin/users/{id}` | `settings.manage` | Chi tiết hồ sơ nhân sự, lịch sử ca trực và các chi nhánh được phân công. |
| `POST` | `/api/v1/admin/users` | `settings.manage` | Tạo tài khoản nhân sự mới (gán vai trò và chi nhánh mặc định `defaultClinicId`). |
| `PUT` | `/api/v1/admin/users/{id}/assignments` | `settings.manage` | **Điều phối nhân sự**: Gán/thay đổi quyền và chi nhánh làm việc (`RoleAssignmentDocument`). |
| `PATCH` | `/api/v1/admin/users/{id}/toggle-status` | `settings.manage` | Khóa / Kích hoạt tài khoản nhân viên (yêu cầu mật khẩu Admin xác thực). |
| `POST` | `/api/v1/admin/users/{id}/unlock` | `settings.manage` | Mở khóa cưỡng chế tài khoản bị khóa do nhập sai mật khẩu quá số lần (`accessFailedCount`). |
| `GET` | `/api/v1/admin/roles` | `settings.manage` | Lấy danh mục vai trò hệ thống (`roles`) và ma trận permissions. |
| `PUT` | `/api/v1/admin/roles/{id}/permissions` | `settings.manage` | Cập nhật bộ quyền hạn cho vai trò tùy biến (không được sửa vai trò `isSystem = true`). |

#### Body mẫu gán chi nhánh `PUT /api/v1/admin/users/{id}/assignments`:
```json
{
  "assignments": [
    {
      "roleId": "e1f2a3b4-5c6d-7e8f-9a0b-1c2d3e4f5a6b",
      "clinicId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "reason": "Điều chuyển làm Trưởng cơ sở Quận 1"
    },
    {
      "roleId": "d2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
      "clinicId": "8c2efb5e-4c8e-5cbe-8cee-3c1e8c4edc7e",
      "reason": "Hỗ trợ khám chuyên môn tại Chi nhánh 2"
    }
  ]
}
```

---

### PHÂN HỆ 3: ĐIỀU PHỐI BÁC SĨ & LỊCH LÀM VIỆC CHUỖI (`/api/v1/admin/doctors`)
*Ánh xạ Collection: `bacsi` (`DoctorDocument`)*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/doctors` | `doctors.read` | Danh sách bác sĩ toàn chuỗi (kèm số năm kinh nghiệm, chi nhánh làm việc chính). |
| `GET` | `/api/v1/admin/doctors/{id}` | `doctors.read` | Chi tiết hồ sơ năng lực, chứng chỉ hành nghề và ca trực tuần hoàn `calamviec`. |
| `POST` | `/api/v1/admin/doctors` | `doctors.create` | Tạo hồ sơ bác sĩ mới liên kết với tài khoản `userId`. |
| `PUT` | `/api/v1/admin/doctors/{id}` | `doctors.update` | Cập nhật chuyên khoa, số năm kinh nghiệm, tiểu sử bác sĩ. |
| `PUT` | `/api/v1/admin/doctors/{id}/work-schedules` | `doctors.update` | **Lập lịch trực luân phiên**: Cấu hình ca trực tuần hoàn tại các chi nhánh khác nhau. |

#### Body mẫu `PUT /api/v1/admin/doctors/{id}/work-schedules`:
```json
{
  "workSchedules": [
    {
      "clinicId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "dayOfWeek": 2,
      "startTime": "08:30",
      "endTime": "17:00",
      "isActive": true
    },
    {
      "clinicId": "8c2efb5e-4c8e-5cbe-8cee-3c1e8c4edc7e",
      "dayOfWeek": 4,
      "startTime": "13:30",
      "endTime": "20:00",
      "isActive": true
    }
  ]
}
```

---

### PHÂN HỆ 4: QUẢN LÝ DANH MỤC DỊCH VỤ & BẢNG GIÁ CHUẨN (`/api/v1/admin/services`)
*Ánh xạ Collection: `services`*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/services` | `clinics.read` | Bảng giá dịch vụ niêm yết toàn chuỗi (lọc theo nhóm, trạng thái kinh doanh). |
| `POST` | `/api/v1/admin/services` | `settings.manage` | Khởi tạo dịch vụ điều trị mới vào danh mục hệ thống. |
| `PUT` | `/api/v1/admin/services/{id}` | `settings.manage` | Cập nhật tên dịch vụ, đơn giá niêm yết, thời gian ước tính thực hiện. |
| `PATCH` | `/api/v1/admin/services/{id}/toggle-active` | `settings.manage` | Kích hoạt / Tạm dừng kinh doanh dịch vụ trên toàn chuỗi. |
| `POST` | `/api/v1/admin/services/bulk-price-adjustment` | `settings.manage` | Điều chỉnh giá đồng loạt (theo % hoặc số tiền cụ thể, bắt buộc ghi log kế toán). |

---

### PHÂN HỆ 5: QUẢN LÝ KHO & ĐIỀU CHUYỂN LIÊN CHI NHÁNH (`/api/v1/admin/inventory`)
*Ánh xạ Collection: `inventoryItems`, `inventoryBatches` (`InventoryBatchDocument`), `inventoryTransactions`*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/inventory/summary` | `inventory.read` | Tổng hợp tồn kho toàn hệ thống (so sánh số lượng tồn giữa các cơ sở). |
| `GET` | `/api/v1/admin/inventory/expiring-batches` | `inventory.read` | Cảnh báo các lô hàng cận hạn sử dụng (`expirationDate`) theo chuẩn FEFO toàn chuỗi. |
| `POST` | `/api/v1/admin/inventory/inter-branch-transfers` | `inventory.export` | **Lệnh điều chuyển kho**: Xuất kho từ Chi nhánh A chuyển đến Chi nhánh B. |
| `PUT` | `/api/v1/admin/inventory/inter-branch-transfers/{id}/approve` | `inventory.import` | Phê duyệt lệnh điều chuyển và xác nhận hàng đã nhập vào kho chi nhánh nhận. |
| `GET` | `/api/v1/admin/inventory/low-stock-alerts` | `inventory.read` | Cảnh báo các mặt hàng dưới định mức tồn kho tối thiểu tại bất kỳ chi nhánh nào. |

#### Body mẫu điều chuyển kho `POST /api/v1/admin/inventory/inter-branch-transfers`:
```json
{
  "fromClinicId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "toClinicId": "8c2efb5e-4c8e-5cbe-8cee-3c1e8c4edc7e",
  "items": [
    {
      "inventoryItemId": "f1a2b3c4-d5e6-7890-aaaa-bbbbccccdddd",
      "batchNumber": "LOT-COMP-2026A",
      "quantity": 20
    }
  ],
  "reason": "Điều phối thuốc gây tê hỗ trợ cơ sở Cầu Giấy thiếu hụt"
}
```

---

### PHÂN HỆ 6: GIÁM SÁT VIỆN PHÍ & DOANH THU HỢP NHẤT (`/api/v1/admin/financials`)
*Ánh xạ Collection: `invoices` (`InvoiceDocument`)*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/financials/consolidated-revenue` | `reports.view` | Doanh thu hợp nhất chuỗi theo ngày/tháng/quý, phân rã theo từng chi nhánh. |
| `GET` | `/api/v1/admin/financials/invoices` | `invoices.read` | Tra cứu hóa đơn viện phí toàn chuỗi (lọc theo trạng thái thanh toán, cơ sở). |
| `GET` | `/api/v1/admin/financials/invoices/{id}` | `invoices.read` | Xem chi tiết dịch vụ (`lines`) và dòng tiền thanh toán (`payments`). |
| `POST` | `/api/v1/admin/financials/invoices/{id}/void` | `invoices.create` | **Hủy hóa đơn sai sót**: Yêu cầu nhập lý do bắt buộc, mật khẩu Admin, ghi log tài chính. |
| `GET` | `/api/v1/admin/financials/outstanding-debts` | `reports.view` | Báo cáo công nợ viện phí chưa thu hồi theo từng chi nhánh. |

---

### PHÂN HỆ 7: CHƯƠNG TRÌNH KHUYẾN MÃI TOÀN CHUỖI (`/api/v1/admin/promotions`)
*Ánh xạ Collection: `discountPrograms`*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/promotions` | `settings.manage` | Danh sách voucher và chương trình giảm giá đang chạy trong hệ thống. |
| `POST` | `/api/v1/admin/promotions` | `settings.manage` | Khởi tạo voucher mới (chọn áp dụng: Toàn chuỗi HOẶC Danh sách chi nhánh chỉ định). |
| `PUT` | `/api/v1/admin/promotions/{id}` | `settings.manage` | Điều chỉnh ngày hiệu lực, giá trị giảm, mức giảm tối đa. |
| `PATCH` | `/api/v1/admin/promotions/{id}/toggle-active` | `settings.manage` | Dừng áp dụng voucher khẩn cấp trên hệ thống. |

#### Body mẫu `POST /api/v1/admin/promotions`:
```json
{
  "code": "TRIANKHACHHANG2026",
  "title": "Chương trình Tri Ân - Giảm 15% Dịch Vụ Cạo Vôi & Tẩy Trắng",
  "discountType": "Percentage",
  "value": 15.0,
  "maxDiscountAmount": 500000,
  "validFrom": "2026-10-01T00:00:00Z",
  "validTo": "2026-10-31T23:59:59Z",
  "applicableClinicIds": null
}
```
*(Ghi chú: `applicableClinicIds: null` nghĩa là áp dụng trên toàn bộ các chi nhánh).*

---

### PHÂN HỆ 8: TRUNG TÂM KIỂM TOÁN & AN TOÀN HỆ THỐNG (`/api/v1/admin/audit-logs`)
*Ánh xạ Collection: `auditLogs`*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/audit-logs` | `reports.view` | Tra cứu nhật ký kiểm toán (lọc theo người thực hiện, hành động `tao/capnhat/xoa/xuatfile`, thời gian). |
| `GET` | `/api/v1/admin/audit-logs/security-alerts` | `reports.view` | Danh sách cảnh báo an ninh: Đăng nhập sai nhiều lần, xem PII bệnh nhân bất thường. |
| `POST` | `/api/v1/admin/audit-logs/export` | `reports.view` | Xuất file CSV/Excel nhật ký kiểm toán (Bắt buộc xác thực lại mật khẩu, ghi audit log hành vi xuất). |

---

### PHÂN HỆ 9: DASHBOARD ĐIỀU HÀNH THỜI GIAN THỰC (`/api/v1/admin/dashboard`)
*Mục đích: Cung cấp 4 chỉ số cốt lõi và các cảnh báo vận hành cho Ban Giám Đốc (tuân thủ `ADMIN_UI_RULES.md`).*

| Method | Endpoint | Quyền hạn (`Permission`) | Mô tả nghiệp vụ |
|---|---|---|---|
| `GET` | `/api/v1/admin/dashboard/summary` | `reports.view` | 4 chỉ số cốt lõi hôm nay toàn chuỗi: Lịch hẹn hôm nay, Doanh thu thực thu, Đang điều trị, Cảnh báo cần xử lý. |
| `GET` | `/api/v1/admin/dashboard/branch-metrics` | `reports.view` | Bảng so sánh hiệu suất giữa các cơ sở (Doanh thu, số lượt khám, tỷ lệ hủy hẹn). |
| `GET` | `/api/v1/admin/dashboard/chair-occupancy` | `reports.view` | Tỷ lệ sử dụng ghế nha khoa theo khung giờ tại từng cơ sở. |

#### Response mẫu `GET /api/v1/admin/dashboard/summary`:
```json
{
  "date": "2026-10-05",
  "totalAppointmentsToday": 142,
  "appointmentsByStatus": {
    "choXacNhan": 15,
    "daXacNhan": 85,
    "dangKham": 22,
    "hoanThanh": 18,
    "daHuy": 2
  },
  "consolidatedRevenueVND": 185500000,
  "systemAlerts": {
    "expiringBatchesCount": 4,
    "lowStockItemsCount": 7,
    "overdueInvoicesCount": 12
  }
}
```

---

## IV. BẢN ĐỒ MÃ LỖI NGHIỆP VỤ (DOMAIN ERROR CODES)

| Error Code | HTTP Status | Giải thích |
|---|---|---|
| `clinic.not_found` | 404 | Không tìm thấy cơ sở chi nhánh với Id được cung cấp. |
| `clinic.duplicate_name` | 409 | Tên phòng khám đã tồn tại trong hệ thống. |
| `clinic.has_active_appointments` | 400 | Không thể đóng cửa chi nhánh khi vẫn còn lịch khám chưa xử lý. |
| `auth.reauth_required` | 401 | Thao tác nhạy cảm yêu cầu nhập lại mật khẩu Admin. |
| `inventory.insufficient_quantity` | 400 | Số lượng tồn kho tại chi nhánh xuất không đủ để điều chuyển. |
| `inventory.batch_expired` | 400 | Lô hàng đã hết hạn sử dụng, không được phép điều chuyển hoặc sử dụng. |
| `invoice.already_paid` | 400 | Hóa đơn đã thanh toán hoàn tất, không thể hủy mà phải tạo phiếu hoàn tiền. |
| `user.cannot_deactivate_self` | 400 | Admin Tổng không thể tự khóa tài khoản của chính mình. |

---

## V. HƯỚNG DẪN TRIỂN KHAI TRONG CLEAN ARCHITECTURE

1. **Domain Layer (`DentalManagement.Domain`)**:
   - Khai báo các Domain Events (ví dụ: `ClinicDeactivatedEvent`, `InterBranchInventoryTransferredEvent`).
2. **Application Layer (`DentalManagement.Application`)**:
   - Tạo các thư mục CQRS tương ứng: `Clinics/Commands`, `Clinics/Queries`, `Inventory/Commands`, `Financials/Queries`.
   - Viết các Validator tương ứng bằng FluentValidation.
3. **Infrastructure Layer (`DentalManagement.Infrastructure`)**:
   - Sử dụng `MongoTransactionRunner` khi thực hiện các giao dịch đa tài liệu (như điều chuyển kho giữa 2 chi nhánh).
   - Truy vấn qua các `MongoRepository` tương ứng với Collection.
4. **API Layer (`DentalManagement.Api`)**:
   - Tổ chức các Endpoint Extension: `AdminClinicEndpoints.cs`, `AdminUserEndpoints.cs`, `AdminInventoryEndpoints.cs`, `AdminFinancialEndpoints.cs`.
   - Áp dụng Filter kiểm tra phân quyền `PermissionAuthorizationHandler`.
