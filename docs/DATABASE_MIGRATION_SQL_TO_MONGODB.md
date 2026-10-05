# TÀI LIỆU CHUYỂN ĐỔI DATABASE SCHEMA: SQL (POSTGRESQL) SANG MONGODB

## 1. Giới thiệu tổng quan

Hệ thống Quản lý Phòng khám Nha khoa ban đầu được định nghĩa bằng PostgreSQL DDL (`databaseshema.sql`) gồm **34 bảng (Tables)** và **11 kiểu liệt kê (Enums)**.

Khi chuyển đổi sang **MongoDB NoSQL**, thay vì sao chép 34 bảng thành 34 collections (gây phân mảnh dữ liệu và đòi hỏi nhiều `$lookup` tốn chi phí), hệ thống áp dụng nguyên tắc **Document Embedding (Nhúng sub-documents & arrays)** kết hợp **Referencing (Tham chiếu qua ID)** theo chuẩn Domain-Driven Design (DDD) & Aggregate Pattern:

- **11 Enums** được chuyển hóa thành các ràng buộc giá trị chuỗi (String Enum Constraints) trong `$jsonSchema Validator`.
- **34 Bảng SQL** được cô đọng và gom nhóm thành **19 Collections MongoDB** tối ưu hiệu năng đọc/ghi, loại bỏ hầu hết các bảng trung gian N-N và các bảng con 1-N khép kín.

---

## 2. Bảng đối chiếu chuyển đổi (Mapping Matrix: 34 Bảng SQL ➔ 19 Collections MongoDB)

| STT | Bảng SQL ban đầu | Dạng trong MongoDB | Collection đích | Ghi chú & Lý do thiết kế |
|:---:|:---|:---|:---|:---|
| 1 | `phongkham` | Collection độc lập | `phongkham` | Quản lý thông tin chi nhánh, cơ sở phòng khám. |
| 2 | `vaitro` | Collection độc lập | `vaitro` | Danh mục vai trò trong hệ thống. |
| 3 | `quyenhan` | Embedded Sub-document | `vaitro.danhsachquyen` | Nhúng trực tiếp danh sách quyền vào từng vai trò. |
| 4 | `vaitroquyenhan` | Loại bỏ (Embed) | `vaitro.danhsachquyen` | Không cần bảng trung gian N-N trong NoSQL. |
| 5 | `taikhoan` | Collection độc lập | `taikhoan` | Tài khoản đăng nhập, chứng thực. |
| 6 | `nguoidungvaitro` | Embedded Sub-document | `taikhoan.phanquyen` | Nhúng vai trò theo phòng khám của người dùng. |
| 7 | `auditlog` | Collection độc lập | `auditlog` | Nhật ký kiểm toán an toàn y tế (append-only). |
| 8 | `bacsi` | Collection độc lập | `bacsi` | Hồ sơ năng lực, chứng chỉ bác sĩ. |
| 9 | `calamviec` | Embedded Sub-document | `bacsi.calamviec` | Nhúng lịch ca trực hàng tuần của bác sĩ. |
| 10 | `benhnhan` | Collection độc lập | `benhnhan` | Hồ sơ gốc của bệnh nhân. |
| 11 | `tiensubenhly` | Embedded Sub-document | `benhnhan.tiensubenhly` | Nhúng tiền sử bệnh, dị ứng (đọc tức thì khi mở hồ sơ). |
| 12 | `nhomdichvu` | Denormalized Object | `dichvu.nhomdichvu` | Nhúng tên nhóm vào dịch vụ để không phải join. |
| 13 | `dichvu` | Collection độc lập | `dichvu` | Bảng giá và danh mục dịch vụ điều trị. |
| 14 | `lichkham` | Collection độc lập | `lichkham` | Quản lý các cuộc hẹn khám, tiếp đón. |
| 15 | `lichkhamdichvu` | Embedded Sub-document | `lichkham.dichvudukien` | Nhúng dịch vụ dự kiến của buổi hẹn. |
| 16 | `sodorang` | Embedded Sub-document | `benhnhan.sodorang` | Nhúng sơ đồ 5 mặt răng (Odontogram) vào bệnh nhân. |
| 17 | `phacdodieutri` | Collection độc lập | `phacdodieutri` | Kế hoạch điều trị dài hạn. |
| 18 | `hangmucdieutri` | Embedded Sub-document | `phacdodieutri.hangmucdieutri` | Nhúng các bước/hạng mục trong phác đồ. |
| 19 | `hinhanhyte` | Collection độc lập | `hinhanhyte` | Lưu metadata ảnh X-quang, phim chẩn đoán (file lưu MinIO/S3). |
| 20 | `vattu` | Collection độc lập | `vattu` | Danh mục thuốc, vật tư tiêu hao. |
| 21 | `vattulohang` | Collection độc lập | `vattulohang` | Tồn kho theo lô và hạn dùng (Quản lý xuất FEFO chuẩn). |
| 22 | `lichsudungvattu` | Collection độc lập | `lichsudungvattu` | Nhật ký tiêu hao vật tư tại ghế nha khoa. |
| 23 | `nhacungcap` | Collection độc lập | `nhacungcap` | Danh bạ nhà cung cấp vật tư y tế. |
| 24 | `phieunhapxuatkho` | Collection độc lập | `phieunhapxuatkho` | Chứng từ nhập/xuất/kiểm kê kho. |
| 25 | `phieunhapxuatkhochitiet` | Embedded Sub-document | `phieunhapxuatkho.chitiet` | Nhúng danh sách mặt hàng của từng phiếu kho. |
| 26 | `donthuoc` | Collection độc lập | `donthuoc` | Đơn thuốc bác sĩ kê. |
| 27 | `donthuocchitiet` | Embedded Sub-document | `donthuoc.chitiet` | Nhúng các vị thuốc/liều dùng trong đơn. |
| 28 | `chuongtrinhgiamgia` | Collection độc lập | `chuongtrinhgiamgia` | Chương trình ưu đãi, khuyến mãi, voucher. |
| 29 | `baohiembenhnhan` | Embedded Sub-document | `benhnhan.baohiem` | Nhúng thông tin thẻ BHYT/Bảo hiểm tư nhân của bệnh nhân. |
| 30 | `hoadon` | Collection độc lập | `hoadon` | Hóa đơn viện phí & thanh toán. |
| 31 | `hoadonchitiet` | Embedded Sub-document | `hoadon.chitiet` | Nhúng các dòng dịch vụ chi tiết của hóa đơn. |
| 32 | `yeucaubaohiem` | Collection độc lập | `yeucaubaohiem` | Hồ sơ yêu cầu bồi hoàn bảo hiểm. |
| 33 | `thanhtoan` | Embedded Sub-document | `hoadon.lichsuthanhtoan` | Nhúng phiếu thu viện phí vào hóa đơn tương ứng. |
| 34 | `thanhtoanchitiet` | Embedded Sub-document | `hoadon.lichsuthanhtoan[].phuongthuc` | Nhúng các phương thức thanh toán (tiền mặt, thẻ, BHYT). |

---

## 3. Chuyển đổi 11 Kiểu Liệt Kê (Enums)

Tất cả 11 Enums trong SQL được thiết lập thành các mảng giá trị hợp lệ trong `$jsonSchema Validator` của MongoDB:

1. **`trangthailichhen`**: `['choxacnhan', 'daxacnhan', 'dahoanthanh', 'dahuy', 'khongdennhasy']`
2. **`donvitinh`**: `['cai', 'hop', 'chai', 'goi', 'bo', 'ong', 'gram', 'ml', 'vien', 'vi', 'tuyp', 'lo']`
3. **`hanhdongkiemtoan`**: `['tao', 'capnhat', 'xoa', 'xem', 'dangnhap', 'dangxuat', 'xuatfile']`
4. **`trangthaiphacdo`**: `['dangdieutri', 'hoanthanh', 'tamdung', 'dahuy']`
5. **`trangthaihangmuc`**: `['chuathuchien', 'dangthuchien', 'hoanthanh']`
6. **`loaihinhanh`**: `['xquang', 'anhtrongmieng', 'anhngoaimieng', 'khac']`
7. **`trangthaidonthuoc`**: `['moi', 'dacap', 'dahuy']`
8. **`trangthaihoadon`**: `['chuathanhtoan', 'thanhtoanmotphan', 'dathanhtoan', 'dahuy']`
9. **`hinhthucthanhtoan`**: `['tienmat', 'chuyenkhoan', 'thett', 'bhyt', 'baohiemtunhan']`
10. **`loaigiaodichkho`**: `['nhap', 'xuat', 'kiemke', 'dieuchinh']`
11. **`trangthaibaohiem`**: `['dangxuly', 'dachapthuan', 'tuchoi', 'dathanhtoan']`

---

## 4. Ví dụ cấu trúc Document thực tế trong MongoDB

### A. Collection `benhnhan` (Tích hợp Hồ sơ bệnh án, Tiền sử bệnh, Sơ đồ răng, Bảo hiểm)
```json
{
  "_id": "bn-001",
  "mabenhnhan": "BN-2026-0001",
  "hoten": "Trần Thị Bích Ngọc",
  "ngaysinh": "1995-08-15T00:00:00Z",
  "gioitinh": "Nu",
  "sodienthoai": "0987654321",
  "diachi": "456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh",
  "nguoithan": {
    "hoten": "Trần Văn Bình",
    "sodienthoai": "0987654322",
    "moiquanhe": "Anh trai"
  },
  "phongkhamid": "pk-001",
  "tiensubenhly": [
    {
      "loai": "DiUng",
      "tenchitiet": "Dị ứng kháng sinh nhóm Penicillin",
      "mucdo": "NghiemTrong",
      "ghichu": "Đổi sang Macrolide",
      "ngaycapnhat": "2026-09-28T09:00:00Z"
    }
  ],
  "sodorang": [
    {
      "sorang": "18",
      "matrang": "O",
      "tinhtrang": "Răng khôn mọc lệch kẹt hàm",
      "ghichu": "Chỉ định nhổ tiểu phẫu",
      "capnhatboi": "bs-001",
      "ngaycapnhat": "2026-09-28T09:30:00Z"
    },
    {
      "sorang": "26",
      "matrang": "MOD",
      "tinhtrang": "Sâu ngà răng",
      "ghichu": "Trám Composite thẩm mỹ",
      "capnhatboi": "bs-001",
      "ngaycapnhat": "2026-09-28T09:30:00Z"
    }
  ],
  "baohiem": [
    {
      "baohiemid": "bh-001",
      "loaibaohiem": "BaoHiemTuNhan",
      "donvibaohiem": "Bảo Việt Healthcare",
      "sothebaohiem": "BV-DENT-998877",
      "ngayhieuluc": "2026-01-01T00:00:00Z",
      "ngayhethan": "2026-12-31T00:00:00Z"
    }
  ],
  "ngaytao": "2026-09-28T08:00:00Z",
  "ngaycapnhat": "2026-09-28T09:30:00Z"
}
```

### B. Collection `hoadon` (Tích hợp Chi tiết dịch vụ và Các lần thanh toán viện phí)
```json
{
  "_id": "hd-001",
  "sohoadon": "HD-202609-0001",
  "benhnhanid": "bn-001",
  "bacsiid": "bs-001",
  "phongkhamid": "pk-001",
  "tongtiengoc": 3500000,
  "giamgia": {
    "magiamgia": "NUCLOI2026",
    "sotiengiam": 500000
  },
  "tongphaitra": 3000000,
  "daxthanhtoan": 3000000,
  "trangthai": "dathanhtoan",
  "ngaylap": "2026-09-28T10:00:00Z",
  "chitiet": [
    {
      "dichvuid": "dv-nhorang-01",
      "noidung": "Tiểu phẫu nhổ răng khôn mọc lệch (R18)",
      "soluong": 1,
      "dongia": 2500000,
      "thanhtien": 2500000
    },
    {
      "dichvuid": "dv-tramrang-02",
      "noidung": "Trám răng Composite (R26)",
      "soluong": 1,
      "dongia": 1000000,
      "thanhtien": 1000000
    }
  ],
  "lichsuthanhtoan": [
    {
      "thanhtoanid": "tt-001",
      "sophieuthu": "PT-202609-001",
      "tongthu": 3000000,
      "nguoithuid": "user-bs-001",
      "ngaythanhtoan": "2026-09-28T10:15:00Z",
      "phuongthuc": [
        {
          "hinhthuc": "chuyenkhoan",
          "sotien": 2000000,
          "mathamchieu": "FT2627099887766"
        },
        {
          "hinhthuc": "tienmat",
          "sotien": 1000000
        }
      ]
    }
  ]
}
```

---

## 5. Hướng dẫn chạy Script trên MongoDB

File kịch bản khởi tạo Schema chính: `databaseschema.mongo.js` (nằm ở thư mục gốc dự án).

### Cách 1: Sử dụng MongoDB Shell (`mongosh`)
```bash
mongosh "mongodb://localhost:27017/DentalManagement" databaseschema.mongo.js
```

### Cách 2: Sử dụng MongoDB Compass
1. Mở MongoDB Compass và kết nối tới server MongoDB cục bộ (`mongodb://localhost:27017`).
2. Mở thanh công cụ bên dưới có tab **`>_ MONGOSH`** (hoặc mở script playground).
3. Copy toàn bộ nội dung file [databaseschema.mongo.js](file:///d:/Khanh/.Net/databaseschema.mongo.js) và dán vào, sau đó nhấn **Enter**.
4. Toàn bộ Collections, Schemas, Validators, Indexes và Seed Data sẽ được tạo tự động và hiển thị trong database `DentalManagement`.
