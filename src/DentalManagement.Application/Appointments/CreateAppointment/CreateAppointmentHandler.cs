using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Appointments;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.CreateAppointment;

public sealed class CreateAppointmentHandler
    : ICommandHandler<CreateAppointmentCommand, Result<Guid>>
{
    private readonly IAppointmentRepository _appointments;
    private readonly ITransactionRunner _transactionRunner;

    public CreateAppointmentHandler(
        IAppointmentRepository appointments,
        ITransactionRunner transactionRunner)
    {
        _appointments = appointments;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<Guid>> Handle(
        CreateAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        var domainServices = command.PlannedServices
            .Select(s => new PlannedService(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber))
            .ToList();

        var appointment = new Appointment(
            Guid.NewGuid(),
            command.PatientId,
            command.DoctorId,
            command.ClinicId,
            command.StartsAt,
            command.EndsAt,
            command.Reason,
            domainServices);

        Result<Guid>? failureResult = null;

        await _transactionRunner.ExecuteAsync(async ct =>
        {
            // Guard: check for scheduling conflicts within the transaction session to prevent race conditions
            bool conflict = await _appointments.HasDoctorConflictAsync(
                command.DoctorId,
                command.StartsAt,
                command.EndsAt,
                excludingAppointmentId: null,
                ct);

            if (conflict)
            {
                failureResult = Result<Guid>.Failure(
                    "appointment.conflict",
                    "Bác sĩ đã có lịch hẹn trong khoảng thời gian này.");
                return;
            }

            await _appointments.AddAsync(appointment, ct);
        }, cancellationToken);

        if (failureResult is not null)
        {
            return failureResult;
        }

        return Result<Guid>.Success(appointment.Id);
    }
}
