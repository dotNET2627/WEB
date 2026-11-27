using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Billing.Shifts.ListShifts;

public sealed class ListCashierShiftsHandler
    : IQueryHandler<ListCashierShiftsQuery, Result<IReadOnlyList<CashierShiftSummaryDto>>>
{
    private readonly ICashierShiftRepository _shifts;

    public ListCashierShiftsHandler(ICashierShiftRepository shifts)
    {
        _shifts = shifts;
    }

    public async Task<Result<IReadOnlyList<CashierShiftSummaryDto>>> Handle(
        ListCashierShiftsQuery query,
        CancellationToken cancellationToken)
    {
        var shifts = await _shifts.GetShiftsAsync(
            query.ClinicId,
            query.From,
            query.To,
            query.CashierId,
            cancellationToken);

        var summaries = shifts.Select(s => new CashierShiftSummaryDto(
            s.Id,
            s.ShiftNumber,
            s.CashierId,
            s.CashierName,
            s.StartedAt,
            s.ClosedAt,
            s.Status.ToString(),
            s.OpeningCash,
            s.SystemTotalAmount,
            s.ActualCashAmount,
            s.CashDifference)).ToList();

        return Result<IReadOnlyList<CashierShiftSummaryDto>>.Success(summaries);
    }
}
