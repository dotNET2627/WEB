"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { insuranceService } from "@/services/insurance-service";
import type {
  InsuranceClaimStatus,
  InsuranceClaimSummaryDto,
  InsuranceType,
} from "@/types/insurance";
import { InsuranceStatusBadge, InsuranceTypeBadge } from "./InsuranceStatusBadge";
import { CreateInsuranceClaimModal } from "./CreateInsuranceClaimModal";
import { InsuranceClaimDetailModal } from "./InsuranceClaimDetailModal";
import { formatDate, formatVND } from "@/lib/format";

interface InsuranceClaimListViewProps {
  clinicId: string;
}

export function InsuranceClaimListView({ clinicId }: InsuranceClaimListViewProps) {
  const [claims, setClaims] = useState<InsuranceClaimSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const fetchClaims = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await insuranceService.list({
        clinicId,
        from: fromDate || undefined,
        to: toDate || undefined,
        status: statusFilter !== "ALL" ? statusFilter : undefined,
        insuranceType: typeFilter !== "ALL" ? typeFilter : undefined,
      });
      setClaims(data);
    } catch (err) {
      console.error(err);
      setError("Không thể tải danh sách hồ sơ bảo hiểm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [clinicId, fromDate, toDate, statusFilter, typeFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Client search filter
  const filteredClaims = useMemo(() => {
    if (!searchTerm.trim()) return claims;
    const term = searchTerm.toLowerCase();
    return claims.filter(
      (c) =>
        c.claimNumber.toLowerCase().includes(term) ||
        c.patientName.toLowerCase().includes(term) ||
        c.cardNumber.toLowerCase().includes(term) ||
        c.providerName.toLowerCase().includes(term)
    );
  }, [claims, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const totalCount = filteredClaims.length;
    const processingCount = filteredClaims.filter((c) => c.status === "Processing").length;
    const approvedCount = filteredClaims.filter((c) => c.status === "Approved").length;
    const paidCount = filteredClaims.filter((c) => c.status === "Paid").length;
    const totalClaimAmount = filteredClaims.reduce((s, c) => s + c.claimAmount, 0);
    const totalApprovedAmount = filteredClaims.reduce((s, c) => s + c.approvedAmount, 0);

    return {
      totalCount,
      processingCount,
      approvedCount,
      paidCount,
      totalClaimAmount,
      totalApprovedAmount,
    };
  }, [filteredClaims]);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Bảo hiểm (BHYT & Bảo hiểm Tư nhân)
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Hồ sơ yêu cầu bồi thường, thẩm định quyền lợi, bảo lãnh viện phí và thanh toán
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <span>+</span> Tạo hồ sơ yêu cầu bồi thường
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tổng hồ sơ
          </p>
          <p className="mt-1 text-2xl font-black text-gray-900">{stats.totalCount}</p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
            Chờ thẩm định
          </p>
          <p className="mt-1 text-2xl font-black text-amber-800">{stats.processingCount}</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Đã duyệt chi trả
          </p>
          <p className="mt-1 text-2xl font-black text-blue-800">{stats.approvedCount}</p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
            Đã thanh toán
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{stats.paidCount}</p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 shadow-xs">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            BH chi trả (Đã duyệt)
          </p>
          <p className="mt-1 text-2xl font-black text-indigo-900">
            {formatVND(stats.totalApprovedAmount)}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Tìm theo mã HS, tên BN, số thẻ BH, đơn vị BH..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Insurance Type */}
          <div className="md:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Tất cả loại bảo hiểm</option>
              <option value="SocialHealth">Bảo hiểm Y tế (BHYT)</option>
              <option value="Private">Bảo hiểm tư nhân</option>
            </select>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="Processing">Chờ thẩm định</option>
              <option value="Approved">Đã duyệt chi trả</option>
              <option value="Paid">Đã thanh toán</option>
              <option value="Rejected">Từ chối bồi thường</option>
            </select>
          </div>

          {/* Date range */}
          <div className="md:col-span-3 flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="Từ ngày"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="Đến ngày"
              className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-4 py-3 text-left">Mã hồ sơ</th>
              <th className="px-4 py-3 text-left">Bệnh nhân</th>
              <th className="px-3 py-3 text-center">Loại BH</th>
              <th className="px-4 py-3 text-left">Đơn vị BH & Số thẻ</th>
              <th className="px-4 py-3 text-right">Tiền yêu cầu</th>
              <th className="px-4 py-3 text-right">BH duyệt chi</th>
              <th className="px-4 py-3 text-center">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  <p className="mt-2 text-sm">Đang tải danh sách hồ sơ bảo hiểm...</p>
                </td>
              </tr>
            ) : filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-400">
                  Không tìm thấy hồ sơ yêu cầu bồi thường bảo hiểm nào
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim) => (
                <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-blue-600">
                    <button
                      type="button"
                      onClick={() => setSelectedClaimId(claim.id)}
                      className="hover:underline text-left"
                    >
                      {claim.claimNumber}
                    </button>
                    <span className="block text-[11px] text-gray-400 font-normal">
                      {formatDate(claim.submittedAt)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-gray-900 block">{claim.patientName}</span>
                    {claim.patientCode && (
                      <span className="text-xs text-gray-400 font-mono">{claim.patientCode}</span>
                    )}
                  </td>

                  <td className="px-3 py-3.5 text-center">
                    <InsuranceTypeBadge type={claim.insuranceType} />
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-medium text-gray-800 block text-xs">{claim.providerName}</span>
                    <span className="font-mono text-xs text-gray-500">{claim.cardNumber}</span>
                  </td>

                  <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                    {formatVND(claim.claimAmount)}
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold text-blue-700">
                    {claim.approvedAmount > 0 ? (
                      formatVND(claim.approvedAmount)
                    ) : (
                      <span className="text-gray-400 font-normal">Chờ duyệt</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <InsuranceStatusBadge status={claim.status} />
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedClaimId(claim.id)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Claim Modal */}
      {showCreateModal && (
        <CreateInsuranceClaimModal
          clinicId={clinicId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newId) => {
            setShowCreateModal(false);
            fetchClaims();
            setSelectedClaimId(newId);
          }}
        />
      )}

      {/* Claim Detail Modal */}
      {selectedClaimId && (
        <InsuranceClaimDetailModal
          claimId={selectedClaimId}
          onClose={() => setSelectedClaimId(null)}
          onRefresh={fetchClaims}
        />
      )}
    </div>
  );
}
