- Download MongoServer by link: https://www.mongodb.com/try/download/enterprise
- (If use CLI MongoDB) Dowwnload MongoDB Shell by link https://www.mongodb.com/try/download/shell 
Tui nghĩ nên download cả 2 
## Tải MongoShell 
Sau khi download MongoDB Shell tệp Zip thì giải nén tất cả ra, rồi tìm và copy
thư mục C:..\\mongosh-2.10.0-win32-x64\mongosh-2.10.0-win32-x64\bin 
để copy đường dẫn rồi thêm vào Environment Vable của máy tính
Vào phần System variable -> New -> Name = Mongosh và Value = C:..\\mongosh-2.10.0-win32-x64\mongosh-2.10.0-win32-x64\bin
## Tải MongoDB Server 
Bắt buộc tải MongoDB Server mới sử dụng được 

Lúc Setup thì nhớ tick vào Install MongoDB Compass để sử dụng GUI

Sau khi Connect xong thì tạo database mới với tên DentalManagement và một Collection bất kỳ trong database như:  taikhoan

## Setup Database 

Click vào Open MongoDB Shell và nhập lệnh sau :

```
    use DentalManagement;
    [
    "taikhoan",
    "phongkham",
    "bacsi",
    "benhnhan",
    "vattu",
    "lichkham",
    "phacdodieutri",
    "hinhanhyte",
    "donthuoc",
    "phieunhapxuatkho",
    "hoadon",
    "auditlog",
    "chuongtrinhgiamgia"
    ].forEach(col => db.createCollection(col));

```

# Sau khi chạy lệnh thì load server lại sẽ thấy được tất cả các collection

### Giải thích sơ về MongoDB so với SQL Server

| Thành phần SQL Server | Thành phần MongoDB | Giải thích                      |
| ---                   | ---                | ---                             |
| **Database**          | **Database**       | Nơi chứa dữ liệu.               |
| **Table**             | **Collection**     | Nơi chứa dữ liệu dạng document. |
| **Row**               | **Document**       | Dữ liệu dạng key-value (JSON).  |
| **Column**            | **Field**          | Mỗi document có thể có các field khác nhau. |
| **Primary Key (PK)**  | **_id**            | Mặc định là Object ID.          |
| **JOIN**              | **$lookup**        | Query kết hợp dữ liệu từ các collection. |
| **View**              | **View**           | Xem dữ liệu đã transform. |
| **Index**             | **Index**          | Tăng tốc độ truy vấn. |
| **Schema**            |**Schema Validation**| Kiểm tra cấu trúc document. |

