using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Billing;

public enum ShiftStatus
{
    Open,
    Closed
}

public sealed class CashierShift : AuditableEntity
{
    public CashierShift(
        Guid id,
        Guid clinicId,
        Guid cashierId,
        string cashierName,
        string shiftNumber,
        decimal openingCash,
        string? notes = null)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(shiftNumber))
            throw new ArgumentException("Shift number is required.", nameof(shiftNumber));
        if (string.IsNullOrWhiteSpace(cashierName))
            throw new ArgumentException("Cashier name is required.", nameof(cashierName));

        ClinicId = clinicId;
        CashierId = cashierId;
        CashierName = cashierName.Trim();
        ShiftNumber = shiftNumber.Trim();
        OpeningCash = Math.Max(0, openingCash);
        StartedAt = DateTimeOffset.UtcNow;
        Status = ShiftStatus.Open;
        Notes = notes?.Trim();

        SystemCashAmount = 0;
        SystemTransferAmount = 0;
        SystemCardAmount = 0;
        SystemInsuranceAmount = 0;
    }

    public Guid ClinicId { get; private set; }
    public Guid CashierId { get; private set; }
    public string CashierName { get; private set; }
    public string ShiftNumber { get; private set; }
    public DateTimeOffset StartedAt { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    public ShiftStatus Status { get; private set; }
    public decimal OpeningCash { get; private set; }

    // System recorded revenues during the shift
    public decimal SystemCashAmount { get; private set; }
    public decimal SystemTransferAmount { get; private set; }
    public decimal SystemCardAmount { get; private set; }
    public decimal SystemInsuranceAmount { get; private set; }
    public decimal SystemTotalAmount => SystemCashAmount + SystemTransferAmount + SystemCardAmount + SystemInsuranceAmount;

    // Actual counted amounts at shift close
    public decimal? ActualCashAmount { get; private set; }
    public decimal? ActualTransferAmount { get; private set; }
    public decimal? ActualCardAmount { get; private set; }

    // Cash difference = ActualCash - (OpeningCash + SystemCash)
    public decimal? CashDifference => ActualCashAmount.HasValue
        ? ActualCashAmount.Value - (OpeningCash + SystemCashAmount)
        : null;

    public string? Notes { get; private set; }

    public bool IsOpen => Status == ShiftStatus.Open;

    public Result CloseShift(
        decimal actualCash,
        decimal actualTransfer,
        decimal actualCard,
        decimal systemCash,
        decimal systemTransfer,
        decimal systemCard,
        decimal systemInsurance,
        string? notes = null)
    {
        if (Status == ShiftStatus.Closed)
            return Result.Failure("shift.already_closed", "Ca làm việc này đã được chốt trước đó.");

        if (actualCash < 0 || actualTransfer < 0 || actualCard < 0)
            return Result.Failure("shift.invalid_amount", "Số tiền thực kiểm không thể âm.");

        SystemCashAmount = Math.Max(0, systemCash);
        SystemTransferAmount = Math.Max(0, systemTransfer);
        SystemCardAmount = Math.Max(0, systemCard);
        SystemInsuranceAmount = Math.Max(0, systemInsurance);

        ActualCashAmount = actualCash;
        ActualTransferAmount = actualTransfer;
        ActualCardAmount = actualCard;

        ClosedAt = DateTimeOffset.UtcNow;
        Status = ShiftStatus.Closed;
        if (!string.IsNullOrWhiteSpace(notes))
            Notes = notes.Trim();

        Touch();
        return Result.Success();
    }

    public static CashierShift Rehydrate(
        Guid id,
        Guid clinicId,
        Guid cashierId,
        string cashierName,
        string shiftNumber,
        DateTimeOffset startedAt,
        DateTimeOffset? closedAt,
        ShiftStatus status,
        decimal openingCash,
        decimal systemCashAmount,
        decimal systemTransferAmount,
        decimal systemCardAmount,
        decimal systemInsuranceAmount,
        decimal? actualCashAmount,
        decimal? actualTransferAmount,
        decimal? actualCardAmount,
        string? notes,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var shift = new CashierShift(id, clinicId, cashierId, cashierName, shiftNumber, openingCash, notes)
        {
            StartedAt = startedAt,
            ClosedAt = closedAt,
            Status = status,
            SystemCashAmount = systemCashAmount,
            SystemTransferAmount = systemTransferAmount,
            SystemCardAmount = systemCardAmount,
            SystemInsuranceAmount = systemInsuranceAmount,
            ActualCashAmount = actualCashAmount,
            ActualTransferAmount = actualTransferAmount,
            ActualCardAmount = actualCardAmount,
        };
        shift.SetAuditDates(createdAt, updatedAt);
        return shift;
    }
}
