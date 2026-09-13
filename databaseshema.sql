-- ============================================================================
-- DENTAL CLINIC MANAGEMENT SYSTEM DATABASE SCHEMA (POSTGRESQL DDL)
-- Hệ thống Quản lý Phòng khám Nha khoa Tư nhân
-- Quy mô: 34 Bảng (Tables) & 11 Kiểu Liệt Kê (Enums)
-- ============================================================================

-- Kích hoạt extension sinh UUID ngẫu nhiên (v4)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- PHẦN 1: 11 ENUMS NGHIỆP VỤ HỆ THỐNG
-- ============================================================================

CREATE TYPE trangthailichhen AS ENUM (
    'choxacnhan',
    'daxacnhan',
    'dahoanthanh',
    'dahuy',
    'khongdennhasy'
);

CREATE TYPE donvitinh AS ENUM (
    'cai',
    'hop',
    'chai',
    'goi',
    'bo',
    'ong',
    'gram',
    'ml',
    'vien',
    'vi',
    'tuyp',
    'lo'
);

CREATE TYPE hanhdongkiemtoan AS ENUM (
    'tao',
    'capnhat',
    'xoa',
    'xem',
    'dangnhap',
    'dangxuat',
    'xuatfile'
);

CREATE TYPE trangthaiphacdo AS ENUM (
    'dangdieutri',
    'hoanthanh',
    'tamdung',
    'dahuy'
);

CREATE TYPE trangthaihangmuc AS ENUM (
    'chuathuchien',
    'dangthuchien',
    'hoanthanh'
);

CREATE TYPE loaihinhanh AS ENUM (
    'xquang',
    'anhtrongmieng',
    'anhngoaimieng',
    'khac'
);

CREATE TYPE trangthaidonthuoc AS ENUM (
    'moi',
    'dacap',
    'dahuy'
);

CREATE TYPE trangthaihoadon AS ENUM (
    'chuathanhtoan',
    'thanhtoanmotphan',
    'dathanhtoan',
    'dahuy'
);

CREATE TYPE hinhthucthanhtoan AS ENUM (
    'tienmat',
    'chuyenkhoan',
    'thett',
    'bhyt',
    'baohiemtunhan'
);

CREATE TYPE loaigiaodichkho AS ENUM (
    'nhap',
    'xuat',
    'kiemke',
    'dieuchinh'
);

CREATE TYPE trangthaibaohiem AS ENUM (
    'dangxuly',
    'dachapthuan',
    'tuchoi',
    'dathanhtoan'
);

-- ============================================================================
-- PHẦN 2: 34 BẢNG DỮ LIỆU CHÍNH (Xếp theo thứ tự ràng buộc khóa ngoại)
-- ============================================================================

-- 1. BẢNG: phongkham (Cơ sở phòng khám / Chi nhánh)
CREATE TABLE phongkham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenphongkham VARCHAR NOT NULL,
    diachi VARCHAR NOT NULL,
    sodienthoai VARCHAR,
    email VARCHAR,
    mota TEXT,
    giomocua JSONB,
    logo VARCHAR,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BẢNG: vaitro (Danh mục vai trò người dùng)
CREATE TABLE vaitro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenvaitro VARCHAR NOT NULL UNIQUE,
    mota TEXT,
    hethong BOOLEAN NOT NULL DEFAULT false,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. BẢNG: quyenhan (Danh mục quyền hạn chi tiết)
CREATE TABLE quyenhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquyen VARCHAR NOT NULL UNIQUE,
    tenquyen VARCHAR NOT NULL,
    nhom VARCHAR,
    mota TEXT,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_quyenhan_nhom ON quyenhan(nhom);

-- 4. BẢNG: vaitroquyenhan (Bảng trung gian Role - Permission)
CREATE TABLE vaitroquyenhan (
    vaitroid UUID NOT NULL REFERENCES vaitro(id) ON DELETE CASCADE,
    quyenhanid UUID NOT NULL REFERENCES quyenhan(id) ON DELETE CASCADE,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (vaitroid, quyenhanid)
);

-- 5. BẢNG: taikhoan (Tài khoản người dùng đăng nhập hệ thống)
CREATE TABLE taikhoan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoten VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    sodienthoai VARCHAR,
    matkhaubam VARCHAR NOT NULL,
    vaitro UUID REFERENCES vaitro(id),
    anhdaidien VARCHAR,
    dangkichhoat BOOLEAN NOT NULL DEFAULT true,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. BẢNG: nguoidungvaitro (Phân quyền người dùng theo từng phòng khám)
CREATE TABLE nguoidungvaitro (
    nguoidungid UUID NOT NULL REFERENCES taikhoan(id) ON DELETE CASCADE,
    vaitroid UUID NOT NULL REFERENCES vaitro(id) ON DELETE CASCADE,
    phongkhamid UUID REFERENCES phongkham(id) ON DELETE CASCADE,
    ngaygan TIMESTAMPTZ NOT NULL DEFAULT now(),
    nguoigan UUID REFERENCES taikhoan(id),
    PRIMARY KEY (nguoidungid, vaitroid, phongkhamid)
);

-- 7. BẢNG: auditlog (Nhật ký kiểm toán an toàn y tế - Read & Insert only)
CREATE TABLE auditlog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoidungid UUID REFERENCES taikhoan(id),
    hanhdong hanhdongkiemtoan NOT NULL,
    doituong VARCHAR NOT NULL,
    doituongid UUID,
    giatricu JSONB,
    giatrimoi JSONB,
    diachiip VARCHAR,
    thietbi VARCHAR,
    ghichu TEXT,
    thoigian TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditlog_lookup ON auditlog(nguoidungid, doituong, doituongid, thoigian, hanhdong);

-- 8. BẢNG: bacsi (Hồ sơ năng lực & Chuyên khoa Bác sĩ)
CREATE TABLE bacsi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoidungid UUID NOT NULL UNIQUE REFERENCES taikhoan(id) ON DELETE RESTRICT,
    phongkhamid UUID REFERENCES phongkham(id) ON DELETE SET NULL,
    sochungchihanhnghe VARCHAR NOT NULL UNIQUE,
    sonamkinhnghiem INT NOT NULL DEFAULT 0,
    gioithieu TEXT,
    chuyenkhoa VARCHAR,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bacsi_phongkhamid ON bacsi(phongkhamid);

-- 9. BẢNG: calamviec (Lịch trực tuần hoàn của Bác sĩ)
CREATE TABLE calamviec (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bacsiid UUID NOT NULL REFERENCES bacsi(id) ON DELETE CASCADE,
    phongkhamid UUID NOT NULL REFERENCES phongkham(id) ON DELETE CASCADE,
    thutrongtuan INT NOT NULL CHECK (thutrongtuan BETWEEN 1 AND 7),
    giobatdau TIME NOT NULL,
    gioketthuc TIME NOT NULL,
    dangapdung BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_calamviec_bacsi_thu ON calamviec(bacsiid, thutrongtuan);

-- 10. BẢNG: benhnhan (Hồ sơ Bệnh nhân)
CREATE TABLE benhnhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nguoidungid UUID UNIQUE REFERENCES taikhoan(id) ON DELETE SET NULL,
    mabenhnhan VARCHAR UNIQUE,
    hoten VARCHAR NOT NULL,
    ngaysinh DATE,
    gioitinh VARCHAR,
    sodienthoai VARCHAR,
    diachi VARCHAR,
    nguoithan_hoten VARCHAR,
    nguoithan_sdt VARCHAR,
    nguoithan_moiquanhe VARCHAR,
    phongkhamid UUID REFERENCES phongkham(id),
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_benhnhan_mabn_sdt ON benhnhan(mabenhnhan, sodienthoai);

-- 11. BẢNG: tiensubenhly (Tiền sử bệnh lý & Cảnh báo dị ứng)
CREATE TABLE tiensubenhly (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id) ON DELETE CASCADE,
    loai VARCHAR NOT NULL,
    tenchitiet VARCHAR NOT NULL,
    mucdo VARCHAR,
    ghichu TEXT,
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tiensubenhly_benhnhan_loai ON tiensubenhly(benhnhanid, loai);

-- 12. BẢNG: nhomdichvu (Phân nhóm danh mục dịch vụ)
CREATE TABLE nhomdichvu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tennhom VARCHAR NOT NULL,
    mota TEXT
);

-- 13. BẢNG: dichvu (Bảng giá dịch vụ điều trị & thủ thuật)
CREATE TABLE dichvu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nhomdichvuid UUID REFERENCES nhomdichvu(id) ON DELETE SET NULL,
    tendichvu VARCHAR NOT NULL,
    madichvu VARCHAR UNIQUE,
    dongia DECIMAL(15,2) NOT NULL,
    thoigianuoctinh INT,
    mota TEXT,
    dangkinhdoanh BOOLEAN NOT NULL DEFAULT true
);
CREATE INDEX idx_dichvu_nhom ON dichvu(nhomdichvuid);

-- 14. BẢNG: lichkham (Quản lý cuộc hẹn & Tiếp đón bệnh nhân)
CREATE TABLE lichkham (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id),
    bacsiid UUID NOT NULL REFERENCES bacsi(id),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id),
    thoigianhen TIMESTAMPTZ NOT NULL,
    thoigianketthuc TIMESTAMPTZ,
    lydokham VARCHAR,
    trangthai trangthailichhen NOT NULL DEFAULT 'choxacnhan',
    ghichu TEXT,
    nguoitaolich UUID REFERENCES taikhoan(id),
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_lichkham_filter ON lichkham(benhnhanid, bacsiid, phongkhamid, thoigianhen, trangthai);

-- 15. BẢNG: lichkhamdichvu (Dịch vụ dự kiến thực hiện trong buổi khám)
CREATE TABLE lichkhamdichvu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lichkhamid UUID NOT NULL REFERENCES lichkham(id) ON DELETE CASCADE,
    dichvuid UUID NOT NULL REFERENCES dichvu(id),
    sorang VARCHAR,
    dongia DECIMAL(15,2),
    ghichu TEXT
);
CREATE INDEX idx_lichkhamdichvu_ids ON lichkhamdichvu(lichkhamid, dichvuid);

-- 16. BẢNG: sodorang (Sơ đồ răng 5 mặt giải phẫu - Odontogram)
CREATE TABLE sodorang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id) ON DELETE CASCADE,
    sorang VARCHAR NOT NULL,
    matrang VARCHAR,
    tinhtrang VARCHAR NOT NULL,
    ghichu TEXT,
    capnhatboi UUID REFERENCES bacsi(id),
    ngaycapnhat TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sodorang_benhnhan_sorang ON sodorang(benhnhanid, sorang);

-- 17. BẢNG: phacdodieutri (Kế hoạch điều trị dài hạn)
CREATE TABLE phacdodieutri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id),
    bacsiid UUID NOT NULL REFERENCES bacsi(id),
    tenphacdo VARCHAR NOT NULL,
    mota TEXT,
    trangthai trangthaiphacdo NOT NULL DEFAULT 'dangdieutri',
    tongchiphidukien DECIMAL(15,2),
    ngaybatdau DATE,
    ngaydukienhoanthanh DATE,
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_phacdodieutri_ids ON phacdodieutri(benhnhanid, bacsiid);

-- 18. BẢNG: hangmucdieutri (Từng hạng mục/thủ thuật trong phác đồ)
CREATE TABLE hangmucdieutri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phacdodieutriid UUID NOT NULL REFERENCES phacdodieutri(id) ON DELETE CASCADE,
    dichvuid UUID REFERENCES dichvu(id),
    sorang VARCHAR,
    noidung VARCHAR NOT NULL,
    trangthai trangthaihangmuc NOT NULL DEFAULT 'chuathuchien',
    thutu INT,
    chiphi DECIMAL(15,2),
    lichkhamid UUID REFERENCES lichkham(id) ON DELETE SET NULL,
    ngayhoanthanh DATE
);
CREATE INDEX idx_hangmucdieutri_ids ON hangmucdieutri(phacdodieutriid, lichkhamid);

-- 19. BẢNG: hinhanhyte (Lưu trữ ảnh X-Quang, phim chẩn đoán)
CREATE TABLE hinhanhyte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id) ON DELETE CASCADE,
    lichkhamid UUID REFERENCES lichkham(id) ON DELETE SET NULL,
    loaihinh loaihinhanh NOT NULL,
    duongdanfile VARCHAR NOT NULL,
    sorang VARCHAR,
    ghichu TEXT,
    nguoitaifile UUID REFERENCES taikhoan(id),
    ngaytao TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_hinhanhyte_ids ON hinhanhyte(benhnhanid, lichkhamid);

-- 20. BẢNG: vattu (Danh mục Vật tư tiêu hao & Dược phẩm)
CREATE TABLE vattu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id) ON DELETE CASCADE,
    tenvattu VARCHAR NOT NULL,
    mavattu VARCHAR UNIQUE,
    donvitinh_goc donvitinh NOT NULL DEFAULT 'cai',
    soluongtoithieu INT DEFAULT 10,
    is_thuoc BOOLEAN DEFAULT false,
    dangkinhdoanh BOOLEAN DEFAULT true
);
CREATE INDEX idx_vattu_phongkham_ma ON vattu(phongkhamid, mavattu);

-- 21. BẢNG: vattulohang (Quản lý Lô sản xuất, Hạn dùng & Tồn kho FEFO)
CREATE TABLE vattulohang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id) ON DELETE CASCADE,
    vattuid UUID NOT NULL REFERENCES vattu(id) ON DELETE CASCADE,
    sohanlo VARCHAR NOT NULL,
    hansudung DATE NOT NULL,
    soluongton INT NOT NULL DEFAULT 0,
    dongianhap DECIMAL(15,2) NOT NULL
);
CREATE INDEX idx_vattulohang_fefo ON vattulohang(phongkhamid, vattuid, hansudung);

-- 22. BẢNG: lichsudungvattu (Log tiêu hao vật tư tại ghế điều trị)
CREATE TABLE lichsudungvattu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vattulohangid UUID NOT NULL REFERENCES vattulohang(id) ON DELETE RESTRICT,
    lichkhamid UUID REFERENCES lichkham(id) ON DELETE SET NULL,
    bacsiid UUID REFERENCES bacsi(id),
    soluongsudung INT NOT NULL,
    thoigiansudung TIMESTAMPTZ NOT NULL DEFAULT now(),
    lydo VARCHAR,
    ghichu TEXT
);
CREATE INDEX idx_lichsudungvattu_ids ON lichsudungvattu(vattulohangid, lichkhamid);

-- 23. BẢNG: nhacungcap (Danh bạ nhà cung cấp vật tư y tế)
CREATE TABLE nhacungcap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tennhacungcap VARCHAR NOT NULL,
    sodienthoai VARCHAR,
    email VARCHAR,
    diachi VARCHAR,
    ghichu TEXT
);

-- 24. BẢNG: phieunhapxuatkho (Chứng từ giao dịch kho)
CREATE TABLE phieunhapxuatkho (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id),
    loaigiaodich loaigiaodichkho NOT NULL,
    nhacungcapid UUID REFERENCES nhacungcap(id),
    nguoitaophieuid UUID NOT NULL REFERENCES taikhoan(id),
    ngaygiaodich TIMESTAMPTZ NOT NULL DEFAULT now(),
    ghichu TEXT
);
CREATE INDEX idx_phieukho_pk_loai ON phieunhapxuatkho(phongkhamid, loaigiaodich);

-- 25. BẢNG: phieunhapxuatkhochitiet (Chi tiết hàng hóa trong phiếu kho)
CREATE TABLE phieunhapxuatkhochitiet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phieuid UUID NOT NULL REFERENCES phieunhapxuatkho(id) ON DELETE CASCADE,
    vattuid UUID NOT NULL REFERENCES vattu(id),
    vattulohangid UUID REFERENCES vattulohang(id),
    soluong INT NOT NULL,
    dongia DECIMAL(15,2),
    sohanlo VARCHAR,
    hansudung DATE
);
CREATE INDEX idx_phieukhochitiet_ids ON phieunhapxuatkhochitiet(phieuid, vattuid);

-- 26. BẢNG: donthuoc (Đơn thuốc bác sĩ kê)
CREATE TABLE donthuoc (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id),
    bacsiid UUID NOT NULL REFERENCES bacsi(id),
    lichkhamid UUID REFERENCES lichkham(id) ON DELETE SET NULL,
    trangthai trangthaidonthuoc NOT NULL DEFAULT 'moi',
    ghichu TEXT,
    ngaykedon TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_donthuoc_ids ON donthuoc(benhnhanid, lichkhamid);

-- 27. BẢNG: donthuocchitiet (Chi tiết danh mục thuốc kê đơn)
CREATE TABLE donthuocchitiet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donthuocid UUID NOT NULL REFERENCES donthuoc(id) ON DELETE CASCADE,
    vattuid UUID NOT NULL REFERENCES vattu(id),
    hamluong VARCHAR,
    soluong INT NOT NULL,
    donvitinh donvitinh,
    cachdung TEXT,
    songay INT
);
CREATE INDEX idx_donthuocchitiet_donthuocid ON donthuocchitiet(donthuocid);

-- 28. BẢNG: chuongtrinhgiamgia (Chương trình khuyến mãi & Voucher)
CREATE TABLE chuongtrinhgiamgia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id),
    magiamgia VARCHAR UNIQUE,
    tenchuongtrinh VARCHAR NOT NULL,
    loaigiamgia VARCHAR NOT NULL,
    giatri DECIMAL(15,2) NOT NULL,
    giamtoida DECIMAL(15,2),
    apdung_tutu DATE NOT NULL,
    apdung_denngay DATE NOT NULL,
    danghoatdong BOOLEAN DEFAULT true
);

-- 29. BẢNG: baohiembenhnhan (Thẻ bảo hiểm y tế / Bảo hiểm tư nhân)
CREATE TABLE baohiembenhnhan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id) ON DELETE CASCADE,
    loaibaohiem VARCHAR NOT NULL,
    donvibaohiem VARCHAR,
    sothebaohiem VARCHAR,
    ngayhieuluc DATE,
    ngayhethan DATE,
    ghichu TEXT
);
CREATE INDEX idx_baohiembenhnhan_benhnhanid ON baohiembenhnhan(benhnhanid);

-- 30. BẢNG: hoadon (Hóa đơn viện phí & tính hoa hồng Bác sĩ)
CREATE TABLE hoadon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benhnhanid UUID NOT NULL REFERENCES benhnhan(id),
    bacsiid UUID REFERENCES bacsi(id),
    phongkhamid UUID NOT NULL REFERENCES phongkham(id),
    phacdodieutriid UUID REFERENCES phacdodieutri(id),
    sohoadon VARCHAR UNIQUE,
    tongtiengoc DECIMAL(15,2) NOT NULL,
    giamgiaid UUID REFERENCES chuongtrinhgiamgia(id),
    sotiengiam DECIMAL(15,2) NOT NULL DEFAULT 0,
    tongphaitra DECIMAL(15,2) NOT NULL,
    daxthanhtoan DECIMAL(15,2) NOT NULL DEFAULT 0,
    trangthai trangthaihoadon NOT NULL DEFAULT 'chuathanhtoan',
    ngaylap TIMESTAMPTZ NOT NULL DEFAULT now(),
    ngayhethan DATE,
    ghichu TEXT
);
CREATE INDEX idx_hoadon_filter ON hoadon(benhnhanid, phacdodieutriid, trangthai);

-- 31. BẢNG: hoadonchitiet (Chi tiết từng món dịch vụ trong hóa đơn)
CREATE TABLE hoadonchitiet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoadonid UUID NOT NULL REFERENCES hoadon(id) ON DELETE CASCADE,
    dichvuid UUID REFERENCES dichvu(id),
    hangmucdieutriid UUID REFERENCES hangmucdieutri(id),
    noidung VARCHAR NOT NULL,
    soluong INT NOT NULL DEFAULT 1,
    dongia DECIMAL(15,2) NOT NULL,
    thanhtien DECIMAL(15,2) NOT NULL
);
CREATE INDEX idx_hoadonchitiet_hoadonid ON hoadonchitiet(hoadonid);

-- 32. BẢNG: yeucaubaohiem (Hồ sơ yêu cầu bồi hoàn bảo lãnh viện phí)
CREATE TABLE yeucaubaohiem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baohiembenhnhanid UUID NOT NULL REFERENCES baohiembenhnhan(id),
    hoadonid UUID NOT NULL REFERENCES hoadon(id),
    sotienyeucau DECIMAL(15,2),
    sotienduocduyet DECIMAL(15,2),
    trangthai trangthaibaohiem NOT NULL DEFAULT 'dangxuly',
    ngaygui DATE,
    ngayphanhoi DATE,
    ghichu TEXT
);
CREATE INDEX idx_yeucaubaohiem_ids ON yeucaubaohiem(baohiembenhnhanid, hoadonid);

-- 33. BẢNG: thanhtoan (Phiếu thu tiền viện phí - Header)
CREATE TABLE thanhtoan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hoadonid UUID NOT NULL REFERENCES hoadon(id) ON DELETE CASCADE,
    sophieuthu VARCHAR UNIQUE,
    tongthu DECIMAL(15,2) NOT NULL,
    nguoithuid UUID NOT NULL REFERENCES taikhoan(id),
    ngaythanhtoan TIMESTAMPTZ NOT NULL DEFAULT now(),
    ghichu TEXT
);
CREATE INDEX idx_thanhtoan_hoadon ON thanhtoan(hoadonid, ngaythanhtoan);

-- 34. BẢNG: thanhtoanchitiet (Từng hình thức thanh toán trong 1 phiếu thu)
CREATE TABLE thanhtoanchitiet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thanhtoanid UUID NOT NULL REFERENCES thanhtoan(id) ON DELETE CASCADE,
    hinhthuc hinhthucthanhtoan NOT NULL,
    sotien DECIMAL(15,2) NOT NULL,
    mathamchieu VARCHAR,
    yeucaubaohiemid UUID REFERENCES yeucaubaohiem(id)
);
CREATE INDEX idx_thanhtoanchitiet_ids ON thanhtoanchitiet(thanhtoanid, hinhthuc);