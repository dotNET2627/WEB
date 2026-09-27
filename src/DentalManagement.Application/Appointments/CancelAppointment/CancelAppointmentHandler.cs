using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.CancelAppointment;

public sealed class CancelAppointmentHandler
    : ICommandHandler<CancelAppointmentCommand, Result>
{
    private readonly IAppointmentRepository _appointments;
    private readonly ITransactionRunner _transactionRunner;

    public CancelAppointmentHandler(
        IAppointmentRepository appointments,
        ITransactionRunner transactionRunner)
    {
        _appointments = appointments;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result> Handle(
        CancelAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        var appointment = await _appointments.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure("appointment.not_found",
                $"Không tìm thấy lịch hẹn với id '{command.AppointmentId}'.");
        }

        var result = appointment.Cancel();
        if (result.IsFailure)
        {
            return result;
        }

        await _transactionRunner.RunAsync(
            async () => await _appointments.ReplaceAsync(appointment, cancellationToken),
            cancellationToken);

        return Result.Success();
    }
}
