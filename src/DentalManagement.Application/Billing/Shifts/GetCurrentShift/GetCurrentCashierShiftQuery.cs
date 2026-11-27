namespace DentalManagement.Application.Billing.Shifts.GetCurrentShift;

public sealed record GetCurrentCashierShiftQuery(
    Guid ClinicId,
    Guid? CashierId = null);
