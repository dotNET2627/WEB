namespace DentalManagement.Application.Billing.Shifts.OpenShift;

public sealed record OpenCashierShiftCommand(
    Guid ClinicId,
    Guid CashierId,
    string CashierName,
    decimal OpeningCash,
    string? Notes = null);
