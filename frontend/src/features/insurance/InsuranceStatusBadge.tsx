import type { InsuranceClaimStatus, InsuranceType } from "@/types/insurance";
import { INSURANCE_STATUS_LABELS, INSURANCE_TYPE_LABELS } from "@/types/insurance";

interface InsuranceStatusBadgeProps {
  status: InsuranceClaimStatus;
}

export function InsuranceStatusBadge({ status }: InsuranceStatusBadgeProps) {
  const config = INSURANCE_STATUS_LABELS[status] ?? {
    label: status,
    badge: "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

interface InsuranceTypeBadgeProps {
  type: InsuranceType;
}

export function InsuranceTypeBadge({ type }: InsuranceTypeBadgeProps) {
  const isSocial = type === "SocialHealth";

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
        isSocial
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-blue-50 text-blue-700 border border-blue-200"
      }`}
    >
      {isSocial ? "🏥 BHYT" : "🛡️ Tư nhân"}
    </span>
  );
}
