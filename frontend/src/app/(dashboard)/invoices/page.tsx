"use client";

import React, { useState } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Printer,
  QrCode,
  CreditCard,
  DollarSign,
  Trash2
} from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { FormField } from "@/components/ui/form-field";
import { useToast } from "@/components/ui/toast";
import clsx from "clsx";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Invoice {
  id: string;
  code: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  createdDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: "cash" | "qr_transfer" | "pos_card";
  status: "paid" | "partially_paid" | "unpaid" | "cancelled";
}

const COMMON_SERVICES = [
  { name: "Khám tổng quát & Chụp X-quang Panorex", defaultPrice: 200000 },
  { name: "Lấy cao răng & Đánh bóng 2 hàm", defaultPrice: 350000 },
  { name: "Hàn trám răng thẩm mỹ Composite 3M (1 răng)", defaultPrice: 450000 },
  { name: "Điều trị tủy buồng răng cối lớn (Răng số 6, 7)", defaultPrice: 2000000 },
  { name: "Mão răng toàn sứ Zirconia Dentsply", defaultPrice: 4500000 },
  { name: "Nhổ răng khôn mọc lệch hàm dưới (Tiểu phẫu)", defaultPrice: 2500000 },
  { name: "Thuốc theo đơn DON-2026-0042", defaultPrice: 280000 }
];

interface PendingBillingPatient {
  id: string;
  name: string;
  code: string;
  pendingServices: { name: string; price: number; quantity: number }[];
  pendingPrescriptions: { name: string; price: number; quantity: number }[];
}

const PENDING_BILLING_PATIENTS: PendingBillingPatient[] = [
  {
    id: "pat-p1",
    name: "Phạm Quốc Tuấn",
    code: "BN-2026-0914",
    pendingServices: [
      { name: "Khám tổng quát & Chụp X-quang kỹ thuật số", price: 200000, quantity: 1 },
      { name: "Hàn trám răng thẩm mỹ Composite R36", price: 450000, quantity: 1 }
    ],
    pendingPrescriptions: [
      { name: "Thuốc theo đơn DON-2026-0043 (Augmentin 625mg, Panadol)", price: 220000, quantity: 1 }
    ]
  },
  {
    id: "pat-p2",
    name: "Lê Thị Lan",
    code: "BN-2026-0925",
    pendingServices: [
      { name: "Nhổ răng khôn mọc ngầm lệch 90 độ R48 (Tiểu phẫu)", price: 2500000, quantity: 1 },
      { name: "Chụp phim CT ConeBeam 3D khảo sát dây thần kinh", price: 500000, quantity: 1 }
    ],
    pendingPrescriptions: [
      { name: "Thuốc theo đơn DON-2026-0044 (Rodogyl, Efferalgan Codein, Chlorhexidine)", price: 340000, quantity: 1 }
    ]
  },
  {
    id: "pat-p3",
    name: "Trần Minh Quang",
    code: "BN-2026-0891",
    pendingServices: [
      { name: "Điều trị tủy buồng răng cối lớn R46 (Đợt 2)", price: 1500000, quantity: 1 }
    ],
    pendingPrescriptions: [
      { name: "Thuốc theo đơn DON-2026-0045 (Ibuprofen 400mg, Medoral)", price: 145000, quantity: 1 }
    ]
  }
];

const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    code: "HD-2026-0158",
    patientId: "pat-001",
    patientName: "Trần Minh Quang",
    patientCode: "BN-2026-0891",
    createdDate: "16/10/2026 10:30",
    items: [
      {
        id: "it-1",
        name: "Điều trị tủy buồng răng cối lớn R46 (Đợt 1)",
        quantity: 1,
        unitPrice: 1500000,
        discount: 0,
        total: 1500000
      },
      {
        id: "it-2",
        name: "Thuốc theo đơn DON-2026-0042 (Rodogyl, Panadol)",
        quantity: 1,
        unitPrice: 250000,
        discount: 0,
        total: 250000
      }
    ],
    subtotal: 1750000,
    discountAmount: 0,
    totalAmount: 1750000,
    paidAmount: 1750000,
    remainingAmount: 0,
    paymentMethod: "qr_transfer",
    status: "paid"
  },
  {
    id: "inv-2",
    code: "HD-2026-0157",
    patientId: "pat-002",
    patientName: "Lê Hoàng Yến",
    patientCode: "BN-2026-0902",
    createdDate: "16/10/2026 09:45",
    items: [
      {
        id: "it-3",
        name: "Gói Chỉnh nha Mắc cài sứ tự buộc (Đợt 2)",
        quantity: 1,
        unitPrice: 10000000,
        discount: 1000000,
        total: 9000000
      }
    ],
    subtotal: 10000000,
    discountAmount: 1000000,
    totalAmount: 9000000,
    paidAmount: 5000000,
    remainingAmount: 4000000,
    paymentMethod: "pos_card",
    status: "partially_paid"
  },
  {
    id: "inv-3",
    code: "HD-2026-0155",
    patientId: "pat-004",
    patientName: "Nguyễn Thị Thảo",
    patientCode: "BN-2026-0740",
    createdDate: "15/10/2026 15:20",
    items: [
      {
        id: "it-4",
        name: "Lấy cao răng & Đánh bóng 2 hàm",
        quantity: 1,
        unitPrice: 350000,
        discount: 50000,
        total: 300000
      }
    ],
    subtotal: 350000,
    discountAmount: 50000,
    totalAmount: 300000,
    paidAmount: 300000,
    remainingAmount: 0,
    paymentMethod: "cash",
    status: "paid"
  }
];

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(amount);
}

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form states for creating invoice
  const [patientName, setPatientName] = useState("");
  const [patientCode, setPatientCode] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "it-new-1",
      name: COMMON_SERVICES[0].name,
      quantity: 1,
      unitPrice: COMMON_SERVICES[0].defaultPrice,
      discount: 0,
      total: COMMON_SERVICES[0].defaultPrice
    }
  ]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paidNowAmount, setPaidNowAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qr_transfer" | "pos_card">("qr_transfer");

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountTotal = (subtotal * discountPercent) / 100;
  const finalTotal = Math.max(0, subtotal - discountTotal);

  const handleSelectPendingPatient = (patientId: string) => {
    if (!patientId) return;
    const patient = PENDING_BILLING_PATIENTS.find((p) => p.id === patientId);
    if (!patient) return;

    setPatientName(patient.name);
    setPatientCode(patient.code);

    const autoLoadedItems: InvoiceItem[] = [
      ...patient.pendingServices.map((srv, idx) => ({
        id: `srv-${Date.now()}-${idx}`,
        name: `[Điều trị] ${srv.name}`,
        quantity: srv.quantity,
        unitPrice: srv.price,
        discount: 0,
        total: srv.price * srv.quantity
      })),
      ...patient.pendingPrescriptions.map((pres, idx) => ({
        id: `pres-${Date.now()}-${idx}`,
        name: `[Đơn thuốc] ${pres.name}`,
        quantity: pres.quantity,
        unitPrice: pres.price,
        discount: 0,
        total: pres.price * pres.quantity
      }))
    ];

    setItems(autoLoadedItems);
    showToast(`Đã tự động nạp ${patient.pendingServices.length} dịch vụ điều trị và ${patient.pendingPrescriptions.length} đơn thuốc của ${patient.name}.`, "success");
  };

  const handleAddItem = (serviceName: string, price: number) => {
    const newItem: InvoiceItem = {
      id: `it-${Date.now()}`,
      name: serviceName,
      quantity: 1,
      unitPrice: price,
      discount: 0,
      total: price
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      showToast("Hóa đơn phải có ít nhất 1 mục dịch vụ/thuốc.", "warning");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      showToast("Vui lòng nhập tên bệnh nhân để lập hóa đơn.", "warning");
      return;
    }

    const paid = paidNowAmount > 0 ? Math.min(paidNowAmount, finalTotal) : finalTotal;
    const remaining = finalTotal - paid;

    let status: Invoice["status"] = "unpaid";
    if (paid >= finalTotal) {
      status = "paid";
    } else if (paid > 0) {
      status = "partially_paid";
    }

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      code: `HD-2026-0${invoices.length + 160}`,
      patientId: `pat-${Date.now()}`,
      patientName,
      patientCode: patientCode || `BN-2026-0${Math.floor(100 + Math.random() * 900)}`,
      createdDate: new Date().toLocaleString("vi-VN"),
      items,
      subtotal,
      discountAmount: discountTotal,
      totalAmount: finalTotal,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentMethod,
      status
    };

    setInvoices([newInvoice, ...invoices]);
    setIsCreateOpen(false);
    showToast(`Đã phát hành hóa đơn ${newInvoice.code} thành công.`, "success");

    // Reset form
    setPatientName("");
    setPatientCode("");
    setItems([
      {
        id: "it-new-1",
        name: COMMON_SERVICES[0].name,
        quantity: 1,
        unitPrice: COMMON_SERVICES[0].defaultPrice,
        discount: 0,
        total: COMMON_SERVICES[0].defaultPrice
      }
    ]);
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <h1 className="text-[var(--text-h1)] font-semibold text-[var(--color-text)] tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[var(--color-primary)]" />
            <span>Quản lý Hóa đơn & Thu ngân</span>
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-muted)] mt-1">
            Tổng hợp chi phí điều trị, đơn thuốc, thanh toán đa phương thức và theo dõi công nợ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPaidNowAmount(0);
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lập hóa đơn mới</span>
        </button>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="p-4 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã HĐ, tên bệnh nhân..."
            className="w-full pl-9 pr-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-[var(--text-sm)] border border-[var(--color-border)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="partially_paid">Thanh toán một phần</option>
            <option value="unpaid">Chưa thanh toán</option>
          </select>
        </div>
      </div>

      {/* 3. Invoices DataTable */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[var(--text-sm)]">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--text-xs)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider bg-[var(--color-bg)]">
                <th className="py-3 px-4">Mã hóa đơn</th>
                <th className="py-3 px-4">Bệnh nhân</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4 text-right">Tổng chi phí</th>
                <th className="py-3 px-4 text-right">Đã thu</th>
                <th className="py-3 px-4 text-right">Còn lại</th>
                <th className="py-3 px-4 text-center">Phương thức</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Không tìm thấy hóa đơn nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--color-primary)]">
                      {inv.code}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-[var(--color-text)]">{inv.patientName}</p>
                      <p className="text-[var(--text-xs)] text-[var(--color-text-muted)]">{inv.patientCode}</p>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                      {inv.createdDate}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-[var(--color-text)]">
                      {formatVND(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-emerald-800">
                      {formatVND(inv.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold text-red-600">
                      {inv.remainingAmount > 0 ? formatVND(inv.remainingAmount) : "0 ₫"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.paymentMethod === "qr_transfer" && (
                        <span className="inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-slate-700">
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                          <span>VietQR</span>
                        </span>
                      )}
                      {inv.paymentMethod === "pos_card" && (
                        <span className="inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-slate-700">
                          <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                          <span>Thẻ POS</span>
                        </span>
                      )}
                      {inv.paymentMethod === "cash" && (
                        <span className="inline-flex items-center gap-1 text-[var(--text-xs)] font-medium text-slate-700">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tiền mặt</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.status === "paid" && (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
                          Đã thanh toán
                        </span>
                      )}
                      {inv.status === "partially_paid" && (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-info-bg)] text-[var(--status-info-fg)]">
                          Một phần
                        </span>
                      )}
                      {inv.status === "unpaid" && (
                        <span className="px-2.5 py-0.5 rounded text-[var(--text-xs)] font-semibold bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]">
                          Chưa thanh toán
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsDetailOpen(true);
                        }}
                        className="px-3 py-1.5 rounded border border-[var(--color-border)] hover:bg-[var(--color-bg)] text-[var(--text-xs)] font-semibold text-[var(--color-text)] transition cursor-pointer"
                      >
                        Phiếu thu
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Drawer Lập hóa đơn mới */}
      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Lập Hóa Đơn & Thu Tiền Khám"
        width="wide"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-5">
          {/* Tự động nạp dịch vụ & đơn thuốc từ bệnh nhân chờ thanh toán */}
          <div className="p-4 rounded-[var(--radius)] bg-blue-50/70 border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-xs)] font-bold text-blue-900 uppercase tracking-wide">
                Tự động nạp dịch vụ & đơn thuốc chờ thanh toán
              </span>
              <span className="text-[11px] text-blue-700 font-medium">
                Liên thông Khám bệnh → Kê đơn → Thu ngân
              </span>
            </div>
            <select
              onChange={(e) => handleSelectPendingPatient(e.target.value)}
              defaultValue=""
              className="w-full px-3 py-2 text-[var(--text-sm)] border border-blue-300 rounded-[var(--radius)] bg-white text-[var(--color-text)] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" disabled>-- Chọn bệnh nhân để nạp tự động hạng mục thanh toán --</option>
              {PENDING_BILLING_PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — {p.pendingServices.length} dịch vụ điều trị + {p.pendingPrescriptions.length} đơn thuốc
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Họ tên bệnh nhân" required id="inv-pname">
              <input
                id="inv-pname"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>

            <FormField label="Mã hồ sơ bệnh nhân" id="inv-pcode">
              <input
                id="inv-pcode"
                type="text"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
                placeholder="BN-2026-..."
                className="w-full px-3 py-2 text-[var(--text-base)] border border-[var(--color-border-input)] rounded-[var(--radius)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
              />
            </FormField>
          </div>

          {/* Chọn dịch vụ nhanh */}
          <div className="p-3 rounded-[var(--radius)] bg-[var(--color-bg)] border border-[var(--color-border)]">
            <p className="text-[var(--text-xs)] font-bold text-slate-700 mb-2">Thêm nhanh dịch vụ nha khoa:</p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SERVICES.map((srv) => (
                <button
                  key={srv.name}
                  type="button"
                  onClick={() => handleAddItem(srv.name, srv.defaultPrice)}
                  className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 transition cursor-pointer"
                >
                  + {srv.name} ({formatVND(srv.defaultPrice)})
                </button>
              ))}
            </div>
          </div>

          {/* Bảng danh sách mục thanh toán */}
          <div>
            <h4 className="text-[var(--text-xs)] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
              Bảng chi tiết hạng mục thanh toán ({items.length})
            </h4>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <p className="text-[var(--text-sm)] font-bold text-[var(--color-text)]">
                      {idx + 1}. {item.name}
                    </p>
                    <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] tabular-nums">
                      Đơn giá: {formatVND(item.unitPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-bold text-[var(--text-base)] text-emerald-800 tabular-nums">
                      {formatVND(item.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                      title="Xóa mục này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tính tiền & Giảm giá */}
          <div className="p-4 rounded-[var(--radius)] bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between text-[var(--text-sm)]">
              <span>Tổng tiền dịch vụ & thuốc:</span>
              <span className="font-semibold tabular-nums">{formatVND(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between text-[var(--text-sm)]">
              <span>Chiết khấu / Giảm giá (%):</span>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-2 py-1 text-right text-[var(--text-sm)] border rounded bg-white tabular-nums"
                />
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
              <span>Số tiền thực thu:</span>
              <span className="text-emerald-700 text-lg tabular-nums">{formatVND(finalTotal)}</span>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <label className="block text-[var(--text-xs)] font-bold uppercase tracking-wider text-slate-600 mb-2">
              Hình thức thanh toán
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: "qr_transfer", label: "Chuyển khoản QR", icon: QrCode },
                { key: "cash", label: "Tiền mặt", icon: DollarSign },
                { key: "pos_card", label: "Quẹt thẻ POS", icon: CreditCard }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPaymentMethod(key as "cash" | "qr_transfer" | "pos_card")}
                  className={clsx(
                    "p-3 rounded border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer text-xs font-semibold",
                    paymentMethod === key
                      ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-[var(--color-primary-contrast)] text-[var(--text-sm)] font-bold hover:bg-[var(--color-primary-hover)] transition cursor-pointer"
            >
              Thu tiền & Xuất hóa đơn
            </button>
          </div>
        </form>
      </Drawer>

      {/* 5. Drawer Xem Phiếu Thu & In */}
      <Drawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedInvoice ? `Phiếu thu: ${selectedInvoice.code}` : "Chi tiết hóa đơn"}
        width="default"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="p-4 rounded border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-mono font-bold text-base text-blue-900">
                  {selectedInvoice.code}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {selectedInvoice.createdDate}
                </span>
              </div>
              <p className="text-[var(--text-sm)]">
                <strong>Khách hàng:</strong> {selectedInvoice.patientName} ({selectedInvoice.patientCode})
              </p>
              <p className="text-[var(--text-sm)]">
                <strong>Phương thức:</strong>{" "}
                {selectedInvoice.paymentMethod === "qr_transfer"
                  ? "Chuyển khoản VietQR"
                  : selectedInvoice.paymentMethod === "pos_card"
                  ? "Thẻ POS ngân hàng"
                  : "Tiền mặt"}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Chi tiết các khoản thu
              </h4>
              <div className="border rounded divide-y divide-slate-100">
                {selectedInvoice.items.map((it, idx) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {idx + 1}. {it.name}
                      </p>
                      <p className="text-xs text-slate-500">SL: {it.quantity}</p>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatVND(it.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded bg-emerald-50 border border-emerald-200 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Tổng chi phí:</span>
                <span className="font-semibold tabular-nums">{formatVND(selectedInvoice.subtotal)}</span>
              </div>
              {selectedInvoice.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Giảm giá / Ưu đãi:</span>
                  <span className="font-semibold tabular-nums">- {formatVND(selectedInvoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-emerald-950 pt-2 border-t border-emerald-200">
                <span>Đã thanh toán:</span>
                <span className="tabular-nums text-emerald-700">{formatVND(selectedInvoice.paidAmount)}</span>
              </div>
              {selectedInvoice.remainingAmount > 0 && (
                <div className="flex justify-between text-sm font-bold text-red-600">
                  <span>Còn nợ:</span>
                  <span className="tabular-nums">{formatVND(selectedInvoice.remainingAmount)}</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-slate-800 text-white text-[var(--text-sm)] font-medium hover:bg-slate-900 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>In phiếu thu</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--text-sm)] font-medium hover:bg-[var(--color-bg)] transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
