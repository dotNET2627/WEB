using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Billing;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Billing.Shifts.OpenShift;

public sealed class OpenCashierShiftHandler
    : ICommandHandler<OpenCashierShiftCommand, Result<Guid>>
{
    private readonly ICashierShiftRepository _shifts;
    private readonly ITransactionRunner _tx;

    public OpenCashierShiftHandler(ICashierShiftRepository shifts, ITransactionRunner tx)
    {
        _shifts = shifts;
        _tx = tx;
    }

    public async Task<Result<Guid>> Handle(OpenCashierShiftCommand command, CancellationToken cancellationToken)
    {
        var existingActive = await _shifts.GetActiveShiftAsync(command.ClinicId, command.CashierId, cancellationToken);
        if (existingActive is not null)
        {
            return Result<Guid>.Failure(
                "shift.already_open",
                $"Thu ngân đang có ca làm việc '{existingActive.ShiftNumber}' đang mở. Vui lòng chốt ca trước khi mở ca mới.");
        }

        var shiftNumber = await _shifts.GenerateNextShiftNumberAsync(command.ClinicId, cancellationToken);

        var shift = new CashierShift(
            Guid.NewGuid(),
            command.ClinicId,
            command.CashierId,
            command.CashierName,
            shiftNumber,
            command.OpeningCash,
            command.Notes);

        await _tx.RunAsync(async () => await _shifts.AddAsync(shift, cancellationToken), cancellationToken);

        return Result<Guid>.Success(shift.Id);
    }
}
