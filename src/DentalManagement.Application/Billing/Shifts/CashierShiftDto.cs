namespace DentalManagement.Application.Billing.Shifts;

public sealed record CashierShiftDto(
    Guid Id,
    Guid ClinicId,
    Guid CashierId,
    string CashierName,
    string ShiftNumber,
    DateTimeOffset StartedAt,
    DateTimeOffset? ClosedAt,
    string Status,
    decimal OpeningCash,
    decimal SystemCashAmount,
    decimal SystemTransferAmount,
    decimal SystemCardAmount,
    decimal SystemInsuranceAmount,
    decimal SystemTotalAmount,
    decimal? ActualCashAmount,
    decimal? ActualTransferAmount,
    decimal? ActualCardAmount,
    decimal? CashDifference,
    decimal ExpectedTotalCash, // OpeningCash + SystemCashAmount
    string? Notes);

public sealed record CashierShiftSummaryDto(
    Guid Id,
    string ShiftNumber,
    Guid CashierId,
    string CashierName,
    DateTimeOffset StartedAt,
    DateTimeOffset? ClosedAt,
    string Status,
    decimal OpeningCash,
    decimal SystemTotalAmount,
    decimal? ActualCashAmount,
    decimal? CashDifference);
