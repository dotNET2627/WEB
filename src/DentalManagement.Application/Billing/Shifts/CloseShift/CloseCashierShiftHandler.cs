using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Billing.Shifts.CloseShift;

public sealed class CloseCashierShiftHandler
    : ICommandHandler<CloseCashierShiftCommand, Result>
{
    private readonly ICashierShiftRepository _shifts;
    private readonly IInvoiceRepository _invoices;
    private readonly ITransactionRunner _tx;

    public CloseCashierShiftHandler(
        ICashierShiftRepository shifts,
        IInvoiceRepository invoices,
        ITransactionRunner tx)
    {
        _shifts = shifts;
        _invoices = invoices;
        _tx = tx;
    }

    public async Task<Result> Handle(CloseCashierShiftCommand command, CancellationToken cancellationToken)
    {
        var shift = await _shifts.GetByIdAsync(command.ShiftId, cancellationToken);
        if (shift is null || shift.ClinicId != command.ClinicId)
            return Result.Failure("shift.not_found", $"Không tìm thấy ca làm việc '{command.ShiftId}'.");

        if (!shift.IsOpen)
            return Result.Failure("shift.already_closed", "Ca làm việc này đã được chốt trước đó.");

        var now = DateTimeOffset.UtcNow;
        var invoicesInShift = await _invoices.GetForFinancialReportAsync(
            shift.ClinicId,
            shift.StartedAt,
            now,
            cancellationToken);

        decimal systemCash = 0;
        decimal systemTransfer = 0;
        decimal systemCard = 0;
        decimal systemInsurance = 0;

        foreach (var inv in invoicesInShift)
        {
            foreach (var p in inv.Payments)
            {
                if (p.PaidAt >= shift.StartedAt && p.PaidAt <= now)
                {
                    if (p.Method.Equals("Cash", StringComparison.OrdinalIgnoreCase))
                        systemCash += p.Amount;
                    else if (p.Method.Equals("Transfer", StringComparison.OrdinalIgnoreCase))
                        systemTransfer += p.Amount;
                    else if (p.Method.Equals("Card", StringComparison.OrdinalIgnoreCase))
                        systemCard += p.Amount;
                    else if (p.Method.Equals("Insurance", StringComparison.OrdinalIgnoreCase))
                        systemInsurance += p.Amount;
                }
            }
        }

        var closeResult = shift.CloseShift(
            command.ActualCash,
            command.ActualTransfer,
            command.ActualCard,
            systemCash,
            systemTransfer,
            systemCard,
            systemInsurance,
            command.Notes);

        if (closeResult.IsFailure)
            return closeResult;

        await _tx.RunAsync(async () => await _shifts.ReplaceAsync(shift, cancellationToken), cancellationToken);

        return Result.Success();
    }
}
