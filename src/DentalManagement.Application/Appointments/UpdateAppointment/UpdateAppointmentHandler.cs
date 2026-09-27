using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.UpdateAppointment;

public sealed class UpdateAppointmentHandler
    : ICommandHandler<UpdateAppointmentCommand, Result>
{
    private readonly IAppointmentRepository _appointments;
    private readonly ITransactionRunner _transactionRunner;

    public UpdateAppointmentHandler(
        IAppointmentRepository appointments,
        ITransactionRunner transactionRunner)
    {
        _appointments = appointments;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result> Handle(
        UpdateAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        var appointment = await _appointments.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null)
        {
            return Result.Failure("appointment.not_found",
                $"Không tìm thấy lịch hẹn với id '{command.AppointmentId}'.");
        }

        // Check for conflicts with the new time slot, excluding this appointment itself
        bool conflict = await _appointments.HasDoctorConflictAsync(
            appointment.DoctorId,
            command.StartsAt,
            command.EndsAt,
            excludingAppointmentId: appointment.Id,
            cancellationToken);

        if (conflict)
        {
            return Result.Failure("appointment.conflict",
                "Bác sĩ đã có lịch hẹn trong khoảng thời gian này.");
        }

        var rescheduleResult = appointment.Reschedule(command.StartsAt, command.EndsAt);
        if (rescheduleResult.IsFailure)
        {
            return rescheduleResult;
        }

        await _transactionRunner.RunAsync(
            async () => await _appointments.ReplaceAsync(appointment, cancellationToken),
            cancellationToken);

        return Result.Success();
    }
}
