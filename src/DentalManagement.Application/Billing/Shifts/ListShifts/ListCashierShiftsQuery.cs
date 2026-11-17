namespace DentalManagement.Application.Billing.Shifts.ListShifts;

public sealed record ListCashierShiftsQuery(
    Guid ClinicId,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    Guid? CashierId = null);
