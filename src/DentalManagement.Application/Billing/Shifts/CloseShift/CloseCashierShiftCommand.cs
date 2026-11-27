namespace DentalManagement.Application.Billing.Shifts.CloseShift;

public sealed record CloseCashierShiftCommand(
    Guid ClinicId,
    Guid ShiftId,
    decimal ActualCash,
    decimal ActualTransfer,
    decimal ActualCard,
    string? Notes = null);
