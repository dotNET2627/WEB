/**
 * ============================================================================
 * DENTAL CLINIC MANAGEMENT SYSTEM DATABASE SCHEMA (MONGODB / MONGOSH SCRIPT)
 * Hệ thống Quản lý Phòng khám Nha khoa Tư nhân
 * Chuyển đổi từ: PostgreSQL DDL (34 Bảng & 11 Enums) sang MongoDB NoSQL
 * 
 * Cách dùng:
 * 1. Chạy trong mongosh: 
 *    mongosh "mongodb://localhost:27017/DentalManagement" databaseschema.mongo.js
 * 2. Hoặc mở MongoDB Compass -> Chạy trong tab "Mongosh" / "Playground"
 * ============================================================================
 */

// 1. Chọn Database làm việc
const dbName = "DentalManagement";
const currentDb = db.getSiblingDB(dbName);
print(`[INFO] Đang cấu hình Database MongoDB: ${dbName}...`);

// ============================================================================
// PHẦN 1: TẬP HỢP 11 ENUMS NGHIỆP VỤ HỆ THỐNG
// ============================================================================
const ENUMS = {
    trangthailichhen: ['choxacnhan', 'daxacnhan', 'dahoanthanh', 'dahuy', 'khongdennhasy'],
    donvitinh: ['cai', 'hop', 'chai', 'goi', 'bo', 'ong', 'gram', 'ml', 'vien', 'vi', 'tuyp', 'lo'],
    hanhdongkiemtoan: ['tao', 'capnhat', 'xoa', 'xem', 'dangnhap', 'dangxuat', 'xuatfile'],
    trangthaiphacdo: ['dangdieutri', 'hoanthanh', 'tamdung', 'dahuy'],
    trangthaihangmuc: ['chuathuchien', 'dangthuchien', 'hoanthanh'],
    loaihinhanh: ['xquang', 'anhtrongmieng', 'anhngoaimieng', 'khac'],
    trangthaidonthuoc: ['moi', 'dacap', 'dahuy'],
    trangthaihoadon: ['chuathanhtoan', 'thanhtoanmotphan', 'dathanhtoan', 'dahuy'],
    hinhthucthanhtoan: ['tienmat', 'chuyenkhoan', 'thett', 'bhyt', 'baohiemtunhan'],
    loaigiaodichkho: ['nhap', 'xuat', 'kiemke', 'dieuchinh'],
    trangthaibaohiem: ['dangxuly', 'dachapthuan', 'tuchoi', 'dathanhtoan']
};

// Helper tạo hoặc cập nhật collection với JSON Schema Validator
function setupCollection(name, schemaValidator) {
    const existing = currentDb.getCollectionNames();
    if (!existing.includes(name)) {
        currentDb.createCollection(name, {
            validator: { $jsonSchema: schemaValidator },
            validationLevel: "moderate",
            validationAction: "warn"
        });
        print(`  + Tạo mới collection: ${name}`);
    } else {
        currentDb.runCommand({
            collMod: name,
            validator: { $jsonSchema: schemaValidator },
            validationLevel: "moderate",
            validationAction: "warn"
        });
        print(`  * Cập nhật Schema Validator cho: ${name}`);
    }
}

// ============================================================================
// PHẦN 2: THIẾT KẾ CÁC COLLECTION MONGODB (ÁNH XẠ TỪ 34 BẢNG SQL)
// Trong MongoDB, áp dụng Document Embedding cho các thực thể quan hệ 1-N khép kín
// giúp tối ưu tốc độ đọc, hạn chế JOIN ($lookup) và duy trì tính toàn vẹn dữ liệu.
// ============================================================================

// ----------------------------------------------------------------------------
// 1. COLLECTION: phongkham (SQL Table 1: phongkham)
// ----------------------------------------------------------------------------
setupCollection("phongkham", {
    bsonType: "object",
    required: ["tenphongkham", "diachi"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"], description: "ID phòng khám (UUID hoặc ObjectId)" },
        tenphongkham: { bsonType: "string", description: "Tên phòng khám / chi nhánh" },
        diachi: { bsonType: "string", description: "Địa chỉ chi nhánh" },
        sodienthoai: { bsonType: ["string", "null"] },
        email: { bsonType: ["string", "null"] },
        mota: { bsonType: ["string", "null"] },
        giomocua: { 
            bsonType: ["object", "null"],
            description: "Lịch mở cửa (JSONB từ SQL)"
        },
        logo: { bsonType: ["string", "null"] },
        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 2. COLLECTION: vaitro (SQL Table 2: vaitro, Table 3: quyenhan, Table 4: vaitroquyenhan)
// Embedding: Danh sách quyền hạn (quyenhan) được nhúng trực tiếp vào vai trò
// ----------------------------------------------------------------------------
setupCollection("vaitro", {
    bsonType: "object",
    required: ["tenvaitro"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        tenvaitro: { bsonType: "string", description: "Tên vai trò (ADMIN, BACSI, LETAN,...)" },
        mota: { bsonType: ["string", "null"] },
        hethong: { bsonType: "bool", description: "Vai trò mặc định của hệ thống" },
        danhsachquyen: {
            bsonType: "array",
            description: "Nhúng quyền hạn (thay thế bảng vaitroquyenhan & quyenhan)",
            items: {
                bsonType: "object",
                required: ["maquyen", "tenquyen"],
                properties: {
                    quyenid: { bsonType: ["string", "binData", "objectId"] },
                    maquyen: { bsonType: "string" },
                    tenquyen: { bsonType: "string" },
                    nhom: { bsonType: ["string", "null"] },
                    mota: { bsonType: ["string", "null"] }
                }
            }
        },
        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 3. COLLECTION: taikhoan (SQL Table 5: taikhoan, Table 6: nguoidungvaitro)
// Embedding: Phân quyền vai trò theo từng phòng khám (nguoidungvaitro) được nhúng
// ----------------------------------------------------------------------------
setupCollection("taikhoan", {
    bsonType: "object",
    required: ["hoten", "email", "matkhaubam"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        hoten: { bsonType: "string" },
        email: { bsonType: "string" },
        sodienthoai: { bsonType: ["string", "null"] },
        matkhaubam: { bsonType: "string" },
        anhdaidien: { bsonType: ["string", "null"] },
        dangkichhoat: { bsonType: "bool" },
        // Nhúng quan hệ phân quyền người dùng tại từng phòng khám (SQL Table 6: nguoidungvaitro)
        phanquyen: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["vaitroid"],
                properties: {
                    vaitroid: { bsonType: ["string", "binData", "objectId"] },
                    tenvaitro: { bsonType: "string" },
                    phongkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
                    ngaygan: { bsonType: "date" },
                    nguoigan: { bsonType: ["string", "binData", "objectId", "null"] }
                }
            }
        },
        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 4. COLLECTION: auditlog (SQL Table 7: auditlog)
// ----------------------------------------------------------------------------
setupCollection("auditlog", {
    bsonType: "object",
    required: ["hanhdong", "doituong", "thoigian"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        nguoidungid: { bsonType: ["string", "binData", "objectId", "null"] },
        hanhdong: { enum: ENUMS.hanhdongkiemtoan, description: "Enum: tao, capnhat, xoa, xem, dangnhap, dangxuat, xuatfile" },
        doituong: { bsonType: "string", description: "Tên bảng/thực thể bị tác động" },
        doituongid: { bsonType: ["string", "binData", "objectId", "null"] },
        giatricu: { bsonType: ["object", "null"] },
        giatrimoi: { bsonType: ["object", "null"] },
        diachiip: { bsonType: ["string", "null"] },
        thietbi: { bsonType: ["string", "null"] },
        ghichu: { bsonType: ["string", "null"] },
        thoigian: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 5. COLLECTION: bacsi (SQL Table 8: bacsi, Table 9: calamviec)
// Embedding: Lịch trực tuần hoàn (calamviec) được nhúng trực tiếp vào hồ sơ Bác sĩ
// ----------------------------------------------------------------------------
setupCollection("bacsi", {
    bsonType: "object",
    required: ["nguoidungid", "sochungchihanhnghe"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        nguoidungid: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
        sochungchihanhnghe: { bsonType: "string" },
        sonamkinhnghiem: { bsonType: "int" },
        gioithieu: { bsonType: ["string", "null"] },
        chuyenkhoa: { bsonType: ["string", "null"] },
        // Nhúng lịch ca làm việc định kỳ (SQL Table 9: calamviec)
        calamviec: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["thutrongtuan", "giobatdau", "gioketthuc"],
                properties: {
                    phongkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
                    thutrongtuan: { bsonType: "int", minimum: 1, maximum: 7, description: "1: CN, 2: T2, ..., 7: T7" },
                    giobatdau: { bsonType: "string", description: "HH:mm" },
                    gioketthuc: { bsonType: "string", description: "HH:mm" },
                    dangapdung: { bsonType: "bool" }
                }
            }
        },
        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 6. COLLECTION: benhnhan (SQL Table 10: benhnhan, Table 11: tiensubenhly, Table 16: sodorang, Table 29: baohiembenhnhan)
// Embedding:
// - Tiền sử bệnh lý (tiensubenhly)
// - Sơ đồ răng 5 mặt giải phẫu (sodorang - Odontogram)
// - Thẻ bảo hiểm y tế / tư nhân (baohiembenhnhan)
// Giúp nạp toàn bộ hồ sơ nha bạ bệnh nhân chỉ với 1 query duy nhất!
// ----------------------------------------------------------------------------
setupCollection("benhnhan", {
    bsonType: "object",
    required: ["hoten"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        nguoidungid: { bsonType: ["string", "binData", "objectId", "null"] },
        mabenhnhan: { bsonType: ["string", "null"] },
        hoten: { bsonType: "string" },
        ngaysinh: { bsonType: ["date", "string", "null"] },
        gioitinh: { bsonType: ["string", "null"] },
        sodienthoai: { bsonType: ["string", "null"] },
        diachi: { bsonType: ["string", "null"] },
        nguoithan: {
            bsonType: ["object", "null"],
            properties: {
                hoten: { bsonType: ["string", "null"] },
                sodienthoai: { bsonType: ["string", "null"] },
                moiquanhe: { bsonType: ["string", "null"] }
            }
        },
        phongkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
        
        // Nhúng: Tiền sử bệnh lý & cảnh báo dị ứng (SQL Table 11: tiensubenhly)
        tiensubenhly: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["loai", "tenchitiet"],
                properties: {
                    loai: { bsonType: "string", description: "DiUng, BenhTimMach, TieuDuong, DongMau,..." },
                    tenchitiet: { bsonType: "string" },
                    mucdo: { bsonType: ["string", "null"] },
                    ghichu: { bsonType: ["string", "null"] },
                    ngaycapnhat: { bsonType: "date" }
                }
            }
        },

        // Nhúng: Sơ đồ răng 5 mặt giải phẫu (SQL Table 16: sodorang)
        sodorang: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["sorang", "tinhtrang"],
                properties: {
                    sorang: { bsonType: "string", description: "Ký hiệu răng (11-48, 51-85)" },
                    matrang: { bsonType: ["string", "null"], description: "Mặt nhai (O), Gần (M), Xa (D), Ngoài (B), Trong (L)" },
                    tinhtrang: { bsonType: "string", description: "SauRang, MatRang, RangSu, ViemTuy,..." },
                    ghichu: { bsonType: ["string", "null"] },
                    capnhatboi: { bsonType: ["string", "binData", "objectId", "null"] },
                    ngaycapnhat: { bsonType: "date" }
                }
            }
        },

        // Nhúng: Thẻ bảo hiểm y tế / tư nhân (SQL Table 29: baohiembenhnhan)
        baohiem: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["loaibaohiem"],
                properties: {
                    baohiemid: { bsonType: ["string", "binData", "objectId", "null"] },
                    loaibaohiem: { bsonType: "string", description: "BHYT hoặc BaoHiemTuNhan" },
                    donvibaohiem: { bsonType: ["string", "null"] },
                    sothebaohiem: { bsonType: ["string", "null"] },
                    ngayhieuluc: { bsonType: ["date", "string", "null"] },
                    ngayhethan: { bsonType: ["date", "string", "null"] },
                    ghichu: { bsonType: ["string", "null"] }
                }
            }
        },

        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 7. COLLECTION: dichvu (SQL Table 12: nhomdichvu, Table 13: dichvu)
// Embedding: Thông tin nhóm dịch vụ được denormalize vào dịch vụ để tăng tốc tra cứu
// ----------------------------------------------------------------------------
setupCollection("dichvu", {
    bsonType: "object",
    required: ["tendichvu", "dongia"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        madichvu: { bsonType: ["string", "null"] },
        tendichvu: { bsonType: "string" },
        nhomdichvu: {
            bsonType: ["object", "null"],
            description: "Denormalize từ SQL Table 12: nhomdichvu",
            properties: {
                nhomdichvuid: { bsonType: ["string", "binData", "objectId", "null"] },
                tennhom: { bsonType: "string" },
                mota: { bsonType: ["string", "null"] }
            }
        },
        dongia: { bsonType: ["decimal", "double", "int", "long"], description: "Giá dịch vụ" },
        thoigianuoctinh: { bsonType: ["int", "null"], description: "Thời gian ước tính (phút)" },
        mota: { bsonType: ["string", "null"] },
        dangkinhdoanh: { bsonType: "bool" }
    }
});

// ----------------------------------------------------------------------------
// 8. COLLECTION: lichkham (SQL Table 14: lichkham, Table 15: lichkhamdichvu)
// Embedding: Danh sách dịch vụ dự kiến (lichkhamdichvu) nhúng trực tiếp trong cuộc hẹn
// ----------------------------------------------------------------------------
setupCollection("lichkham", {
    bsonType: "object",
    required: ["benhnhanid", "bacsiid", "phongkhamid", "thoigianhen", "trangthai"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        benhnhanid: { bsonType: ["string", "binData", "objectId"] },
        bacsiid: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        thoigianhen: { bsonType: "date" },
        thoigianketthuc: { bsonType: ["date", "null"] },
        lydokham: { bsonType: ["string", "null"] },
        trangthai: { enum: ENUMS.trangthailichhen },
        ghichu: { bsonType: ["string", "null"] },
        nguoitaolich: { bsonType: ["string", "binData", "objectId", "null"] },
        
        // Nhúng: Dịch vụ dự kiến khám (SQL Table 15: lichkhamdichvu)
        dichvudukien: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["dichvuid"],
                properties: {
                    dichvuid: { bsonType: ["string", "binData", "objectId"] },
                    tendichvu: { bsonType: ["string", "null"] },
                    sorang: { bsonType: ["string", "null"] },
                    dongia: { bsonType: ["decimal", "double", "int", "long", "null"] },
                    ghichu: { bsonType: ["string", "null"] }
                }
            }
        },
        ngaytao: { bsonType: "date" },
        ngaycapnhat: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 9. COLLECTION: phacdodieutri (SQL Table 17: phacdodieutri, Table 18: hangmucdieutri)
// Embedding: Các hạng mục thủ thuật (hangmucdieutri) nhúng theo thứ tự lộ trình
// ----------------------------------------------------------------------------
setupCollection("phacdodieutri", {
    bsonType: "object",
    required: ["benhnhanid", "bacsiid", "tenphacdo", "trangthai"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        benhnhanid: { bsonType: ["string", "binData", "objectId"] },
        bacsiid: { bsonType: ["string", "binData", "objectId"] },
        tenphacdo: { bsonType: "string" },
        mota: { bsonType: ["string", "null"] },
        trangthai: { enum: ENUMS.trangthaiphacdo },
        tongchiphidukien: { bsonType: ["decimal", "double", "int", "long", "null"] },
        ngaybatdau: { bsonType: ["date", "string", "null"] },
        ngaydukienhoanthanh: { bsonType: ["date", "string", "null"] },
        
        // Nhúng: Các bước điều trị chi tiết (SQL Table 18: hangmucdieutri)
        hangmucdieutri: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["noidung", "trangthai"],
                properties: {
                    hangmucid: { bsonType: ["string", "binData", "objectId", "null"] },
                    dichvuid: { bsonType: ["string", "binData", "objectId", "null"] },
                    sorang: { bsonType: ["string", "null"] },
                    noidung: { bsonType: "string" },
                    trangthai: { enum: ENUMS.trangthaihangmuc },
                    thutu: { bsonType: ["int", "null"] },
                    chiphi: { bsonType: ["decimal", "double", "int", "long", "null"] },
                    lichkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
                    ngayhoanthanh: { bsonType: ["date", "string", "null"] }
                }
            }
        },
        ngaytao: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 10. COLLECTION: hinhanhyte (SQL Table 19: hinhanhyte)
// ----------------------------------------------------------------------------
setupCollection("hinhanhyte", {
    bsonType: "object",
    required: ["benhnhanid", "loaihinh", "duongdanfile"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        benhnhanid: { bsonType: ["string", "binData", "objectId"] },
        lichkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
        loaihinh: { enum: ENUMS.loaihinhanh },
        duongdanfile: { bsonType: "string" },
        sorang: { bsonType: ["string", "null"] },
        ghichu: { bsonType: ["string", "null"] },
        nguoitaifile: { bsonType: ["string", "binData", "objectId", "null"] },
        ngaytao: { bsonType: "date" }
    }
});

// ----------------------------------------------------------------------------
// 11. COLLECTION: vattu (SQL Table 20: vattu)
// Danh mục vật tư tiêu hao và thuốc tân dược
// ----------------------------------------------------------------------------
setupCollection("vattu", {
    bsonType: "object",
    required: ["phongkhamid", "tenvattu", "donvitinh_goc"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        tenvattu: { bsonType: "string" },
        mavattu: { bsonType: ["string", "null"] },
        donvitinh_goc: { enum: ENUMS.donvitinh },
        soluongtoithieu: { bsonType: "int" },
        is_thuoc: { bsonType: "bool" },
        dangkinhdoanh: { bsonType: "bool" }
    }
});

// ----------------------------------------------------------------------------
// 12. COLLECTION: vattulohang (SQL Table 21: vattulohang)
// Tồn kho theo lô và hạn dùng (Quản lý xuất kho chuẩn FEFO)
// Giữ collection riêng biệt để tránh unbounded array và xung đột transaction
// ----------------------------------------------------------------------------
setupCollection("vattulohang", {
    bsonType: "object",
    required: ["phongkhamid", "vattuid", "sohanlo", "hansudung", "dongianhap"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        vattuid: { bsonType: ["string", "binData", "objectId"] },
        sohanlo: { bsonType: "string" },
        hansudung: { bsonType: "date" },
        soluongton: { bsonType: "int" },
        dongianhap: { bsonType: ["decimal", "double", "int", "long"] }
    }
});

// ----------------------------------------------------------------------------
// 13. COLLECTION: lichsudungvattu (SQL Table 22: lichsudungvattu)
// Nhật ký tiêu hao vật tư tại ghế nha khoa
// ----------------------------------------------------------------------------
setupCollection("lichsudungvattu", {
    bsonType: "object",
    required: ["vattulohangid", "soluongsudung", "thoigiansudung"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        vattulohangid: { bsonType: ["string", "binData", "objectId"] },
        lichkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
        bacsiid: { bsonType: ["string", "binData", "objectId", "null"] },
        soluongsudung: { bsonType: "int" },
        thoigiansudung: { bsonType: "date" },
        lydo: { bsonType: ["string", "null"] },
        ghichu: { bsonType: ["string", "null"] }
    }
});

// ----------------------------------------------------------------------------
// 14. COLLECTION: nhacungcap (SQL Table 23: nhacungcap)
// ----------------------------------------------------------------------------
setupCollection("nhacungcap", {
    bsonType: "object",
    required: ["tennhacungcap"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        tennhacungcap: { bsonType: "string" },
        sodienthoai: { bsonType: ["string", "null"] },
        email: { bsonType: ["string", "null"] },
        diachi: { bsonType: ["string", "null"] },
        ghichu: { bsonType: ["string", "null"] }
    }
});

// ----------------------------------------------------------------------------
// 15. COLLECTION: phieunhapxuatkho (SQL Table 24: phieunhapxuatkho, Table 25: phieunhapxuatkhochitiet)
// Embedding: Danh sách chi tiết vật tư (phieunhapxuatkhochitiet) nhúng trong phiếu kho
// ----------------------------------------------------------------------------
setupCollection("phieunhapxuatkho", {
    bsonType: "object",
    required: ["phongkhamid", "loaigiaodich", "nguoitaophieuid", "ngaygiaodich"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        loaigiaodich: { enum: ENUMS.loaigiaodichkho },
        nhacungcapid: { bsonType: ["string", "binData", "objectId", "null"] },
        nguoitaophieuid: { bsonType: ["string", "binData", "objectId"] },
        ngaygiaodich: { bsonType: "date" },
        ghichu: { bsonType: ["string", "null"] },
        
        // Nhúng: Danh mục hàng hóa (SQL Table 25: phieunhapxuatkhochitiet)
        chitiet: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["vattuid", "soluong"],
                properties: {
                    vattuid: { bsonType: ["string", "binData", "objectId"] },
                    vattulohangid: { bsonType: ["string", "binData", "objectId", "null"] },
                    tenvattu: { bsonType: ["string", "null"] },
                    soluong: { bsonType: "int" },
                    dongia: { bsonType: ["decimal", "double", "int", "long", "null"] },
                    sohanlo: { bsonType: ["string", "null"] },
                    hansudung: { bsonType: ["date", "string", "null"] }
                }
            }
        }
    }
});

// ----------------------------------------------------------------------------
// 16. COLLECTION: donthuoc (SQL Table 26: donthuoc, Table 27: donthuocchitiet)
// Embedding: Danh mục chi tiết thuốc kê đơn (donthuocchitiet) nhúng trong đơn thuốc
// ----------------------------------------------------------------------------
setupCollection("donthuoc", {
    bsonType: "object",
    required: ["benhnhanid", "bacsiid", "trangthai", "ngaykedon"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        benhnhanid: { bsonType: ["string", "binData", "objectId"] },
        bacsiid: { bsonType: ["string", "binData", "objectId"] },
        lichkhamid: { bsonType: ["string", "binData", "objectId", "null"] },
        trangthai: { enum: ENUMS.trangthaidonthuoc },
        ghichu: { bsonType: ["string", "null"] },
        ngaykedon: { bsonType: "date" },

        // Nhúng: Danh mục thuốc (SQL Table 27: donthuocchitiet)
        chitiet: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["vattuid", "soluong"],
                properties: {
                    vattuid: { bsonType: ["string", "binData", "objectId"] },
                    tenthuoc: { bsonType: ["string", "null"] },
                    hamluong: { bsonType: ["string", "null"] },
                    soluong: { bsonType: "int" },
                    donvitinh: { enum: ENUMS.donvitinh },
                    cachdung: { bsonType: ["string", "null"] },
                    songay: { bsonType: ["int", "null"] }
                }
            }
        }
    }
});

// ----------------------------------------------------------------------------
// 17. COLLECTION: chuongtrinhgiamgia (SQL Table 28: chuongtrinhgiamgia)
// ----------------------------------------------------------------------------
setupCollection("chuongtrinhgiamgia", {
    bsonType: "object",
    required: ["phongkhamid", "tenchuongtrinh", "loaigiamgia", "giatri", "apdung_tutu", "apdung_denngay"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        magiamgia: { bsonType: ["string", "null"] },
        tenchuongtrinh: { bsonType: "string" },
        loaigiamgia: { bsonType: "string", description: "PhanTram hoặc SoTienCoDinh" },
        giatri: { bsonType: ["decimal", "double", "int", "long"] },
        giamtoida: { bsonType: ["decimal", "double", "int", "long", "null"] },
        apdung_tutu: { bsonType: "date" },
        apdung_denngay: { bsonType: "date" },
        danghoatdong: { bsonType: "bool" }
    }
});

// ----------------------------------------------------------------------------
// 18. COLLECTION: hoadon (SQL Table 30: hoadon, Table 31: hoadonchitiet, Table 33: thanhtoan, Table 34: thanhtoanchitiet)
// Embedding:
// - Chi tiết từng món viện phí (hoadonchitiet)
// - Toàn bộ lịch sử các đợt thanh toán viện phí (thanhtoan + thanhtoanchitiet)
// ----------------------------------------------------------------------------
setupCollection("hoadon", {
    bsonType: "object",
    required: ["benhnhanid", "phongkhamid", "tongtiengoc", "tongphaitra", "trangthai", "ngaylap"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        sohoadon: { bsonType: ["string", "null"] },
        benhnhanid: { bsonType: ["string", "binData", "objectId"] },
        bacsiid: { bsonType: ["string", "binData", "objectId", "null"] },
        phongkhamid: { bsonType: ["string", "binData", "objectId"] },
        phacdodieutriid: { bsonType: ["string", "binData", "objectId", "null"] },
        tongtiengoc: { bsonType: ["decimal", "double", "int", "long"] },
        
        giamgia: {
            bsonType: ["object", "null"],
            properties: {
                giamgiaid: { bsonType: ["string", "binData", "objectId", "null"] },
                magiamgia: { bsonType: ["string", "null"] },
                sotiengiam: { bsonType: ["decimal", "double", "int", "long"] }
            }
        },
        
        tongphaitra: { bsonType: ["decimal", "double", "int", "long"] },
        daxthanhtoan: { bsonType: ["decimal", "double", "int", "long"] },
        trangthai: { enum: ENUMS.trangthaihoadon },
        ngaylap: { bsonType: "date" },
        ngayhethan: { bsonType: ["date", "string", "null"] },
        ghichu: { bsonType: ["string", "null"] },

        // Nhúng: Chi tiết từng dịch vụ trên hóa đơn (SQL Table 31: hoadonchitiet)
        chitiet: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["noidung", "soluong", "dongia", "thanhtien"],
                properties: {
                    dichvuid: { bsonType: ["string", "binData", "objectId", "null"] },
                    hangmucdieutriid: { bsonType: ["string", "binData", "objectId", "null"] },
                    noidung: { bsonType: "string" },
                    soluong: { bsonType: "int" },
                    dongia: { bsonType: ["decimal", "double", "int", "long"] },
                    thanhtien: { bsonType: ["decimal", "double", "int", "long"] }
                }
            }
        },

        // Nhúng: Lịch sử phiếu thu tiền viện phí (SQL Table 33: thanhtoan & Table 34: thanhtoanchitiet)
        lichsuthanhtoan: {
            bsonType: "array",
            items: {
                bsonType: "object",
                required: ["sophieuthu", "tongthu", "ngaythanhtoan", "phuongthuc"],
                properties: {
                    thanhtoanid: { bsonType: ["string", "binData", "objectId", "null"] },
                    sophieuthu: { bsonType: "string" },
                    tongthu: { bsonType: ["decimal", "double", "int", "long"] },
                    nguoithuid: { bsonType: ["string", "binData", "objectId", "null"] },
                    ngaythanhtoan: { bsonType: "date" },
                    ghichu: { bsonType: ["string", "null"] },
                    // Nhúng chi tiết các hình thức thanh toán (tiền mặt, chuyển khoản, BHYT,...)
                    phuongthuc: {
                        bsonType: "array",
                        items: {
                            bsonType: "object",
                            required: ["hinhthuc", "sotien"],
                            properties: {
                                hinhthuc: { enum: ENUMS.hinhthucthanhtoan },
                                sotien: { bsonType: ["decimal", "double", "int", "long"] },
                                mathamchieu: { bsonType: ["string", "null"] },
                                yeucaubaohiemid: { bsonType: ["string", "binData", "objectId", "null"] }
                            }
                        }
                    }
                }
            }
        }
    }
});

// ----------------------------------------------------------------------------
// 19. COLLECTION: yeucaubaohiem (SQL Table 32: yeucaubaohiem)
// ----------------------------------------------------------------------------
setupCollection("yeucaubaohiem", {
    bsonType: "object",
    required: ["baohiembenhnhanid", "hoadonid", "trangthai"],
    properties: {
        _id: { bsonType: ["string", "binData", "objectId"] },
        baohiembenhnhanid: { bsonType: ["string", "binData", "objectId"] },
        hoadonid: { bsonType: ["string", "binData", "objectId"] },
        sotienyeucau: { bsonType: ["decimal", "double", "int", "long", "null"] },
        sotienduocduyet: { bsonType: ["decimal", "double", "int", "long", "null"] },
        trangthai: { enum: ENUMS.trangthaibaohiem },
        ngaygui: { bsonType: ["date", "string", "null"] },
        ngayphanhoi: { bsonType: ["date", "string", "null"] },
        ghichu: { bsonType: ["string", "null"] }
    }
});

print("[INFO] Hoàn tất định nghĩa cấu trúc Schemas & Validators!");

// ============================================================================
// PHẦN 3: THIẾT LẬP CÁC CHỈ MỤC (INDEXES) TỐI ƯU HIỆU NĂNG & DUY NHẤT (UNIQUE)
// ============================================================================
print("[INFO] Đang tạo các Indexes...");

// 1. phongkham
currentDb.phongkham.createIndex({ tenphongkham: 1 });

// 2. vaitro
currentDb.vaitro.createIndex({ tenvaitro: 1 }, { unique: true });

// 3. taikhoan
currentDb.taikhoan.createIndex({ email: 1 }, { unique: true });
currentDb.taikhoan.createIndex({ sodienthoai: 1 });
currentDb.taikhoan.createIndex({ "phanquyen.phongkhamid": 1, "phanquyen.vaitroid": 1 });

// 4. auditlog
currentDb.auditlog.createIndex({ nguoidungid: 1, doituong: 1, doituongid: 1, thoigian: -1 });
currentDb.auditlog.createIndex({ thoigian: -1 });

// 5. bacsi
currentDb.bacsi.createIndex({ nguoidungid: 1 }, { unique: true });
currentDb.bacsi.createIndex({ sochungchihanhnghe: 1 }, { unique: true });
currentDb.bacsi.createIndex({ phongkhamid: 1 });
currentDb.bacsi.createIndex({ "calamviec.thutrongtuan": 1 });

// 6. benhnhan
currentDb.benhnhan.createIndex({ phongkhamid: 1, mabenhnhan: 1 }, { unique: true, sparse: true });
currentDb.benhnhan.createIndex({ sodienthoai: 1 });
currentDb.benhnhan.createIndex({ hoten: "text" });
currentDb.benhnhan.createIndex({ "sodorang.sorang": 1 });

// 7. dichvu
currentDb.dichvu.createIndex({ madichvu: 1 }, { unique: true, sparse: true });
currentDb.dichvu.createIndex({ "nhomdichvu.nhomdichvuid": 1 });

// 8. lichkham
currentDb.lichkham.createIndex({ phongkhamid: 1, bacsiid: 1, thoigianhen: 1 });
currentDb.lichkham.createIndex({ benhnhanid: 1, thoigianhen: -1 });
currentDb.lichkham.createIndex({ trangthai: 1, thoigianhen: 1 });

// 9. phacdodieutri
currentDb.phacdodieutri.createIndex({ benhnhanid: 1, bacsiid: 1 });
currentDb.phacdodieutri.createIndex({ trangthai: 1 });

// 10. hinhanhyte
currentDb.hinhanhyte.createIndex({ benhnhanid: 1, lichkhamid: 1 });

// 11. vattu
currentDb.vattu.createIndex({ phongkhamid: 1, mavattu: 1 }, { unique: true, sparse: true });
currentDb.vattu.createIndex({ is_thuoc: 1 });

// 12. vattulohang (FEFO Index: sắp xếp theo hạn sử dụng tăng dần để xuất trước)
currentDb.vattulohang.createIndex({ phongkhamid: 1, vattuid: 1, hansudung: 1 }, { name: "idx_vattulohang_fefo" });

// 13. lichsudungvattu
currentDb.lichsudungvattu.createIndex({ vattulohangid: 1, lichkhamid: 1 });
currentDb.lichsudungvattu.createIndex({ thoigiansudung: -1 });

// 14. nhacungcap
currentDb.nhacungcap.createIndex({ tennhacungcap: 1 });

// 15. phieunhapxuatkho
currentDb.phieunhapxuatkho.createIndex({ phongkhamid: 1, loaigiaodich: 1, ngaygiaodich: -1 });

// 16. donthuoc
currentDb.donthuoc.createIndex({ benhnhanid: 1, lichkhamid: 1 });
currentDb.donthuoc.createIndex({ ngaykedon: -1 });

// 17. chuongtrinhgiamgia
currentDb.chuongtrinhgiamgia.createIndex({ magiamgia: 1 }, { unique: true, sparse: true });
currentDb.chuongtrinhgiamgia.createIndex({ phongkhamid: 1, danghoatdong: 1 });

// 18. hoadon
currentDb.hoadon.createIndex({ sohoadon: 1 }, { unique: true, sparse: true });
currentDb.hoadon.createIndex({ benhnhanid: 1, trangthai: 1 });
currentDb.hoadon.createIndex({ phongkhamid: 1, ngaylap: -1 });

// 19. yeucaubaohiem
currentDb.yeucaubaohiem.createIndex({ baohiembenhnhanid: 1, hoadonid: 1 });
currentDb.yeucaubaohiem.createIndex({ trangthai: 1 });

print("[INFO] Đã tạo thành công tất cả Indexes!");

// ============================================================================
// PHẦN 4: DỮ LIỆU MẪU (SEED / MOCK DATA ĐIỂN HÌNH MINH HỌA)
// ============================================================================
print("[INFO] Đang thêm dữ liệu mẫu (Seed Data)...");

// Mẫu 1 phòng khám
const clinicId = "pk-001";
currentDb.phongkham.updateOne(
    { _id: clinicId },
    {
        $setOnInsert: {
            _id: clinicId,
            tenphongkham: "Nha Khoa Nụ Cười Sài Gòn (Chi Nhánh 1)",
            diachi: "123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh",
            sodienthoai: "02839998888",
            email: "contact@nucuoidaigon.vn",
            mota: "Chuyên khoa cấy ghép Implant và Chỉnh nha thẩm mỹ",
            giomocua: {
                thu2_thu6: "08:00 - 20:00",
                thu7_chunhat: "08:00 - 17:00"
            },
            logo: "/assets/images/logo.png",
            ngaytao: new Date(),
            ngaycapnhat: new Date()
        }
    },
    { upsert: true }
);

// Mẫu 1 Bác sĩ
const doctorUserId = "user-bs-001";
const doctorId = "bs-001";

currentDb.taikhoan.updateOne(
    { _id: doctorUserId },
    {
        $setOnInsert: {
            _id: doctorUserId,
            hoten: "ThS. BS. Nguyễn Văn An",
            email: "bacsi.an@nucuoidaigon.vn",
            sodienthoai: "0901234567",
            matkhaubam: "$2a$11$hash_placeholder_string",
            anhdaidien: "/avatars/bs-an.jpg",
            dangkichhoat: true,
            phanquyen: [
                {
                    vaitroid: "role-bacsi",
                    tenvaitro: "Bác Sĩ Điều Trị",
                    phongkhamid: clinicId,
                    ngaygan: new Date(),
                    nguoigan: null
                }
            ],
            ngaytao: new Date(),
            ngaycapnhat: new Date()
        }
    },
    { upsert: true }
);

currentDb.bacsi.updateOne(
    { _id: doctorId },
    {
        $setOnInsert: {
            _id: doctorId,
            nguoidungid: doctorUserId,
            phongkhamid: clinicId,
            sochungchihanhnghe: "CCHN-00982-BYT",
            sonamkinhnghiem: 12,
            gioithieu: "Chuyên gia phục hình thẩm mỹ và cấy ghép Implant với 12 năm kinh nghiệm.",
            chuyenkhoa: "Nha Chu & Cấy Ghép Implant",
            calamviec: [
                { thutrongtuan: 2, giobatdau: "08:00", gioketthuc: "17:00", dangapdung: true },
                { thutrongtuan: 4, giobatdau: "08:00", gioketthuc: "17:00", dangapdung: true },
                { thutrongtuan: 6, giobatdau: "08:00", gioketthuc: "17:00", dangapdung: true }
            ],
            ngaytao: new Date(),
            ngaycapnhat: new Date()
        }
    },
    { upsert: true }
);

// Mẫu 1 Bệnh nhân có Tiền sử bệnh, Sơ đồ răng và Bảo hiểm nhúng
const patientId = "bn-001";
currentDb.benhnhan.updateOne(
    { _id: patientId },
    {
        $setOnInsert: {
            _id: patientId,
            nguoidungid: null,
            mabenhnhan: "BN-2026-0001",
            hoten: "Trần Thị Bích Ngọc",
            ngaysinh: new Date("1995-08-15"),
            gioitinh: "Nu",
            sodienthoai: "0987654321",
            diachi: "456 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh",
            nguoithan: {
                hoten: "Trần Văn Bình",
                sodienthoai: "0987654322",
                moiquanhe: "Anh trai"
            },
            phongkhamid: clinicId,
            tiensubenhly: [
                {
                    loai: "DiUng",
                    tenchitiet: "Dị ứng kháng sinh nhóm Penicillin",
                    mucdo: "NghiemTrong",
                    ghichu: "Cần đổi sang nhóm Macrolide khi kê đơn",
                    ngaycapnhat: new Date()
                },
                {
                    loai: "BenhManTinh",
                    tenchitiet: "Huyết áp thấp nhẹ",
                    mucdo: "Nhe",
                    ghichu: "Kiểm tra huyết áp trước khi gây tê",
                    ngaycapnhat: new Date()
                }
            ],
            sodorang: [
                {
                    sorang: "18",
                    matrang: "O",
                    tinhtrang: "Răng khôn mọc lệch kẹt hàm",
                    ghichu: "Chỉ định nhổ tiểu phẫu",
                    capnhatboi: doctorId,
                    ngaycapnhat: new Date()
                },
                {
                    sorang: "26",
                    matrang: "MOD",
                    tinhtrang: "Sâu răng lan đến ngà sâu",
                    ghichu: "Đã trám thẩm mỹ Composite",
                    capnhatboi: doctorId,
                    ngaycapnhat: new Date()
                }
            ],
            baohiem: [
                {
                    baohiemid: "bh-001",
                    loaibaohiem: "BaoHiemTuNhan",
                    donvibaohiem: "Bảo Việt Healthcare",
                    sothebaohiem: "BV-DENT-998877",
                    ngayhieuluc: new Date("2026-01-01"),
                    ngayhethan: new Date("2026-12-31"),
                    ghichu: "Hạn mức nha khoa 15.000.000 VNĐ/năm, đồng chi trả 20%"
                }
            ],
            ngaytao: new Date(),
            ngaycapnhat: new Date()
        }
    },
    { upsert: true }
);

// Mẫu 1 Hóa đơn với Chi tiết dịch vụ và Phiếu thu nhúng
const invoiceId = "hd-001";
currentDb.hoadon.updateOne(
    { _id: invoiceId },
    {
        $setOnInsert: {
            _id: invoiceId,
            sohoadon: "HD-202609-0001",
            benhnhanid: patientId,
            bacsiid: doctorId,
            phongkhamid: clinicId,
            phacdodieutriid: null,
            tongtiengoc: 3500000,
            giamgia: {
                giamgiaid: null,
                magiamgia: "NUCLOI2026",
                sotiengiam: 500000
            },
            tongphaitra: 3000000,
            daxthanhtoan: 3000000,
            trangthai: "dathanhtoan",
            ngaylap: new Date(),
            ngayhethan: null,
            ghichu: "Thanh toán hoàn tất sau khi nhổ răng và trám răng",
            chitiet: [
                {
                    dichvuid: "dv-nhorang-01",
                    hangmucdieutriid: null,
                    noidung: "Tiểu phẫu nhổ răng khôn mọc lệch (R18)",
                    soluong: 1,
                    dongia: 2500000,
                    thanhtien: 2500000
                },
                {
                    dichvuid: "dv-tramrang-02",
                    hangmucdieutriid: null,
                    noidung: "Trám răng thẩm mỹ Composite quang trùng hợp (R26)",
                    soluong: 1,
                    dongia: 1000000,
                    thanhtien: 1000000
                }
            ],
            lichsuthanhtoan: [
                {
                    thanhtoanid: "tt-001",
                    sophieuthu: "PT-202609-001",
                    tongthu: 3000000,
                    nguoithuid: doctorUserId,
                    ngaythanhtoan: new Date(),
                    ghichu: "Thu ngân đã nhận đủ tiền",
                    phuongthuc: [
                        {
                            hinhthuc: "chuyenkhoan",
                            sotien: 2000000,
                            mathamchieu: "FT2627099887766",
                            yeucaubaohiemid: null
                        },
                        {
                            hinhthuc: "tienmat",
                            sotien: 1000000,
                            mathamchieu: null,
                            yeucaubaohiemid: null
                        }
                    ]
                }
            ]
        }
    },
    { upsert: true }
);

print("[INFO] ============================================================");
print("[SUCCESS] ĐÃ CHUYỂN ĐỔI VÀ KHỞI TẠO XONG TOÀN BỘ SCHEMA MONGODB!");
print(`[INFO] Tổng cộng: 19 Collections tối ưu từ 34 Bảng SQL.`);
print(`[INFO] Toàn bộ 11 Enums, Indexes và Embedded Documents đã sẵn sàng.`);
print("[INFO] ============================================================");
