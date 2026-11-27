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

    public Task<Result> Handle(UpdateAppointmentCommand command, CancellationToken cancellationToken) =>
        _transactionRunner.ExecuteAsync(ct => RescheduleAsync(command, ct), cancellationToken);

    private async Task<Result> RescheduleAsync(
        UpdateAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        var appointment = await _appointments.GetByIdAsync(command.AppointmentId, cancellationToken);
        if (appointment is null || appointment.ClinicId != command.ClinicId)
        {
            return Result.Failure("appointment.not_found",
                $"Không tìm thấy lịch hẹn với id '{command.AppointmentId}'.");
        }

        if (!await _appointments.LockDoctorScheduleAsync(appointment.DoctorId, command.ClinicId, cancellationToken))
            return Result.Failure("doctor.not_found", "Không tìm thấy bác sĩ trong phòng khám.");

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

        await _appointments.ReplaceAsync(appointment, cancellationToken);
        return Result.Success();
    }
}
