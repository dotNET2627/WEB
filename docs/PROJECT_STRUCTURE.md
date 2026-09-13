# Cấu trúc dự án DentalManagement

## 1. Mục tiêu kiến trúc

DentalManagement là hệ thống quản lý phòng khám nha khoa với:

- Backend ASP.NET Core trên .NET 10.
- MongoDB là database nghiệp vụ duy nhất.
- Frontend Next.js App Router độc lập.
- Clean Architecture để logic nghiệp vụ không phụ thuộc ASP.NET Core, MongoDB hoặc giao diện.

Luồng phụ thuộc và dữ liệu:

```text
Next.js (frontend)
        │ HTTPS / JSON
        ▼
ASP.NET Core API
        ▼
Application (use cases)
        ▼
Domain (quy tắc nghiệp vụ)
        ▼
Infrastructure (MongoDB, file storage, integrations)
        ▼
MongoDB
```

Mũi tên dependency trong source code đi vào trong:

```text
Api ───────────────► Application ───► Domain
 │                         ▲             ▲
 └────► Infrastructure ────┴─────────────┘
```

`Domain` không được tham chiếu `Infrastructure`, `Api`, MongoDB Driver hoặc Next.js.

## 2. Cây thư mục

```text
DentalManagement.sln
src/
  DentalManagement.Domain/
  DentalManagement.Application/
  DentalManagement.Infrastructure/
  DentalManagement.Api/
tests/
  DentalManagement.Domain.Tests/
  DentalManagement.Application.Tests/
  DentalManagement.Infrastructure.Tests/
  DentalManagement.Api.Tests/
frontend/
  src/
    app/
    components/
    features/
    lib/
    services/
    types/
docs/
  PROJECT_STRUCTURE.md
```

`databaseshema.sql` được giữ lại để tham khảo quy tắc và quan hệ nghiệp vụ của schema SQL cũ. Nó không được chạy để tạo database cho kiến trúc MongoDB.

## 3. Backend Clean Architecture

### DentalManagement.Domain

Đây là lõi của hệ thống. Project này có entity, aggregate root, enum, value object, domain event và quy tắc nghiệp vụ.

Các module đã có thư mục nền tảng:

```text
Identity       Clinics        Patients       Appointments
Treatments     Catalog        Inventory      Prescriptions
Billing        Insurance      Auditing
```

Ví dụ `Patient`, `Appointment`, `Invoice` và `InventoryBatch` minh họa cách entity bảo vệ trạng thái của chính nó. Ví dụ thanh toán hóa đơn chỉ đi qua `Invoice.RegisterPayment`, không cho controller tự đổi tổng tiền hoặc trạng thái.

Không đặt `[BsonId]`, `IMongoCollection`, `HttpContext`, DTO request/response hoặc mã query vào Domain.

### DentalManagement.Application

Project này định nghĩa **use case** của hệ thống. Mỗi use case đặt theo feature, chẳng hạn:

```text
Patients/CreatePatient/
Appointments/CreateAppointment/
Billing/RegisterPayment/
```

Các abstraction quan trọng:

| Abstraction | Mục đích |
| --- | --- |
| `IPatientRepository` | Lưu và đọc aggregate bệnh nhân |
| `IAppointmentRepository` | Kiểm tra trùng lịch và lưu lịch hẹn |
| `IInvoiceRepository` | Lưu hóa đơn và thanh toán |
| `ITransactionRunner` | Bọc use case nhiều document trong transaction |
| `ICurrentUser` | Lấy người dùng/phòng khám từ request |
| `IClock` | Cung cấp thời gian để test được |
| `IFileStorage` | Trừu tượng hóa nơi lưu ảnh y tế |

Handler không được biết `MongoDatabaseContext` hay `IMongoCollection`. Nó chỉ gọi interface do Application định nghĩa.

### DentalManagement.Infrastructure

Infrastructure chứa implementation kỹ thuật:

```text
Persistence/
  Documents/      MongoDB document và BSON attributes
  Mappings/       Chuyển Domain entity ↔ Mongo document
  Repositories/   Triển khai repository bằng MongoDB Driver
  Indexes/        Tạo index idempotent
Transactions/     MongoDB transaction runner
Storage/          File storage placeholder
```

`MongoDatabaseContext` là điểm duy nhất truy cập collection. `MongoSerializationConfiguration` bắt buộc GUID dùng BSON UUID subtype 4 (`GuidRepresentation.Standard`). API vẫn trả GUID dạng chuỗi JSON.

MongoDB không có foreign key, vì vậy các rule như bác sĩ thuộc phòng khám, bệnh nhân tồn tại, không trùng lịch hoặc đủ tồn kho phải được kiểm tra trong Application/Domain.

### DentalManagement.Api

API là composition root và presentation layer:

- `Program.cs`: khởi động ứng dụng.
- `Extensions`: đăng ký service, pipeline, route group.
- `Contracts`: request/response API, không trả Domain entity trực tiếp.
- `Endpoints`: endpoint theo module, ví dụ `/api/v1/patients`.
- `Middleware`: chuẩn hóa lỗi về `ProblemDetails`.

Hiện endpoint hoạt động độc lập là `GET /health`. Các endpoint nghiệp vụ sẽ được thêm khi bạn hoàn tất package/reference rồi triển khai handler tương ứng.

`Frontend:Origin` mặc định là `http://localhost:3000`, phù hợp với Next.js development server. API đã bật CORS credentials để chuẩn bị cho cookie HTTP-only; chưa có xác thực thực tế.

## 4. MongoDB document design

Không ánh xạ 34 bảng SQL thành 34 collection. Collection được tổ chức theo aggregate và tốc độ tăng dữ liệu:

| Collection | Nội dung |
| --- | --- |
| `users`, `roles` | Tài khoản, role assignment theo phòng khám, quyền của role |
| `clinics`, `doctors` | Phòng khám và hồ sơ bác sĩ |
| `patients` | Bệnh nhân, tiền sử bệnh, bảo hiểm, sơ đồ răng được nhúng |
| `appointments` | Lịch hẹn và snapshot dịch vụ dự kiến |
| `treatmentPlans` | Phác đồ và hạng mục điều trị được nhúng |
| `services`, `discountPrograms` | Danh mục dịch vụ và khuyến mãi |
| `medicalImages` | Metadata ảnh; file nằm ở `IFileStorage` |
| `inventoryItems`, `inventoryBatches`, `inventoryTransactions` | Vật tư, lô FEFO và lịch sử nhập/xuất |
| `prescriptions` | Đơn thuốc và chi tiết đơn nhúng |
| `invoices` | Dòng hóa đơn và payment entries nhúng |
| `insuranceClaims` | Hồ sơ yêu cầu bảo hiểm |
| `auditLogs` | Nhật ký append-only |

Index ban đầu:

- `patients`: unique `clinicId + patientCode` khi có patient code.
- `appointments`: `clinicId + doctorId + startsAt` để tìm lịch.
- `inventoryBatches`: `clinicId + inventoryItemId + expirationDate` để xuất FEFO.
- Khi triển khai collection còn lại: email user, invoice number, SKU, discount code và audit lookup cũng cần index.

Với kho, thanh toán hoặc nghiệp vụ thay đổi nhiều collection, dùng `ITransactionRunner`. MongoDB phải chạy replica set hoặc MongoDB Atlas để transaction nhiều document hoạt động.

## 5. Frontend Next.js

Frontend nằm hoàn toàn trong `frontend/` và không tham chiếu trực tiếp MongoDB.

```text
frontend/src/
  app/             Route, layout, page của App Router
  components/      Component dùng lại: sidebar, header, UI primitives
  features/        UI/state/form chuyên biệt theo nghiệp vụ
  lib/             API client, environment, utility
  services/        Lời gọi REST theo resource
  types/           TypeScript DTO và kiểu dùng chung
```

Route groups:

| URL | Chức năng |
| --- | --- |
| `/login` | Màn hình đăng nhập placeholder |
| `/dashboard` | Tổng quan phòng khám |
| `/patients` | Bệnh nhân |
| `/appointments` | Lịch hẹn |
| `/treatment-plans` | Phác đồ điều trị |
| `/prescriptions` | Đơn thuốc |
| `/inventory` | Kho vật tư |
| `/invoices` | Hóa đơn và thanh toán |
| `/insurance` | Bảo hiểm |
| `/settings` | Thiết lập, người dùng, phân quyền |

`app/(dashboard)/layout.tsx` đặt sidebar/header dùng chung. Route group nằm trong ngoặc nên không xuất hiện trong URL.

`ApiClient` gọi trực tiếp REST API bằng `fetch`, luôn dùng `credentials: "include"` và không lưu token trong `localStorage`. `NEXT_PUBLIC_API_BASE_URL` chỉ chứa URL công khai của API; không đặt connection string, JWT secret hay API key trong biến có tiền tố `NEXT_PUBLIC_`.

## 6. Package và reference bạn cần tự thêm

Theo yêu cầu hiện tại, các `.csproj` và `frontend/package.json` không khai báo hoặc cài dependency.

### .NET project references

```text
Application    → Domain
Infrastructure → Application, Domain
Api            → Application, Infrastructure
Domain.Tests   → Domain
Application.Tests → Application, Domain
Infrastructure.Tests → Infrastructure
Api.Tests      → Api
```

### .NET packages tối thiểu

- `Infrastructure`: `MongoDB.Driver`, `Microsoft.Extensions.Options.ConfigurationExtensions`, `Microsoft.Extensions.DependencyInjection.Abstractions`, `Microsoft.Extensions.Configuration.Abstractions`, `Microsoft.Extensions.Hosting.Abstractions`.
- `Application`: `Microsoft.Extensions.DependencyInjection.Abstractions`; tùy chọn thêm MediatR và FluentValidation.
- `Api`: tùy chọn `Microsoft.AspNetCore.OpenApi`, Swagger UI và JWT bearer authentication.
- Test projects: framework test bạn chọn, assertion library và Testcontainers MongoDB nếu dùng integration test.

### Frontend packages tối thiểu

Thêm Next.js, React, React DOM, TypeScript, React/Node type definitions, ESLint, `eslint-config-next`, Tailwind CSS, `@tailwindcss/postcss` và PostCSS. File `package.json` hiện chỉ có scripts để bạn tự quyết định version và cài đặt.

Trên Windows PowerShell hiện tại, dùng `npm.cmd` thay vì `npm`, vì execution policy đang chặn `npm.ps1`.

## 7. Cấu hình và chạy local

1. Tạo MongoDB database `DentalManagement`; dùng replica set nếu cần transaction đa document.
2. Đặt `MongoDb:ConnectionString` trong User Secrets hoặc `appsettings.Development.json` không commit vào Git.
3. Hoàn tất package và project references nêu trên; thêm namespace `DentalManagement.Application.DependencyInjection` và `DentalManagement.Infrastructure.DependencyInjection` vào `Program.cs`, rồi bỏ comment hai lệnh `AddApplication()` và `AddInfrastructure(builder.Configuration)`.
4. Chạy API tại `http://localhost:5260`.
5. Copy `frontend/.env.example` thành `frontend/.env.local`.
6. Cài package frontend rồi chạy `npm.cmd run dev` trong thư mục `frontend`.
7. Mở `http://localhost:3000`; dashboard frontend sẽ gọi API qua `NEXT_PUBLIC_API_BASE_URL` khi các endpoint nghiệp vụ được triển khai.

## 8. Kiểm thử nên có

- Domain: chuyển trạng thái lịch hẹn, thanh toán hóa đơn, đủ tồn kho.
- Application: handler với fake/mock repository, kiểm tra permission và validation.
- Infrastructure: BSON GUID mapping, index và MongoDB transaction.
- API: health check, ProblemDetails, authorization và endpoint contract.
- Frontend: typecheck/lint, component dashboard và API client error handling.

## 9. Các phần chưa triển khai chủ đích

- JWT/cookie authentication và phân quyền runtime.
- CRUD nghiệp vụ hoàn chỉnh cho các module.
- File storage thật cho ảnh X-quang và ảnh y tế.
- Migration dữ liệu từ PostgreSQL/SQL schema cũ sang MongoDB.
- Hóa đơn, kho và lịch hẹn đầy đủ transaction/locking policy.

Các phần này nên được triển khai theo từng use case, bắt đầu từ Identity, Patients và Appointments trước.

## 10. Tài liệu tham khảo

- [Microsoft: Common web application architectures và Clean Architecture](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures)
- [MongoDB .NET/C# Driver: GUID serialization](https://www.mongodb.com/docs/drivers/csharp/current/serialization/guids/)
- [Next.js: App Router](https://nextjs.org/docs/app)
- [Next.js: Environment Variables](https://nextjs.org/docs/pages/guides/environment-variables)
