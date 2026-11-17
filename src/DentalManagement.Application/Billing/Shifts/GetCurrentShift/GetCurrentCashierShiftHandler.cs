using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Billing.Shifts.GetCurrentShift;

public sealed class GetCurrentCashierShiftHandler
    : IQueryHandler<GetCurrentCashierShiftQuery, Result<CashierShiftDto?>>
{
    private readonly ICashierShiftRepository _shifts;
    private readonly IInvoiceRepository _invoices;

    public GetCurrentCashierShiftHandler(
        ICashierShiftRepository shifts,
        IInvoiceRepository invoices)
    {
        _shifts = shifts;
        _invoices = invoices;
    }

    public async Task<Result<CashierShiftDto?>> Handle(GetCurrentCashierShiftQuery query, CancellationToken cancellationToken)
    {
        var shift = await _shifts.GetActiveShiftAsync(query.ClinicId, query.CashierId, cancellationToken);
        if (shift is null)
            return Result<CashierShiftDto?>.Success(null);

        var now = DateTimeOffset.UtcNow;
        var invoicesInShift = await _invoices.GetForFinancialReportAsync(
            query.ClinicId,
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

        var dto = new CashierShiftDto(
            shift.Id,
            shift.ClinicId,
            shift.CashierId,
            shift.CashierName,
            shift.ShiftNumber,
            shift.StartedAt,
            shift.ClosedAt,
            shift.Status.ToString(),
            shift.OpeningCash,
            systemCash,
            systemTransfer,
            systemCard,
            systemInsurance,
            systemCash + systemTransfer + systemCard + systemInsurance,
            shift.ActualCashAmount,
            shift.ActualTransferAmount,
            shift.ActualCardAmount,
            shift.CashDifference,
            shift.OpeningCash + systemCash,
            shift.Notes);

        return Result<CashierShiftDto?>.Success(dto);
    }
}
