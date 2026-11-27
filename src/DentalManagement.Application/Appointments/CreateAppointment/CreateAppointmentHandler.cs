using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Appointments;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Appointments.CreateAppointment;

public sealed class CreateAppointmentHandler
    : ICommandHandler<CreateAppointmentCommand, Result<Guid>>
{
    private readonly IAppointmentRepository _appointments;
    private readonly IPatientRepository _patients;
    private readonly ITransactionRunner _transactionRunner;

    public CreateAppointmentHandler(
        IAppointmentRepository appointments,
        IPatientRepository patients,
        ITransactionRunner transactionRunner)
    {
        _appointments = appointments;
        _patients = patients;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<Guid>> Handle(
        CreateAppointmentCommand command,
        CancellationToken cancellationToken)
    {
        if (await _patients.GetByIdAsync(command.ClinicId, command.PatientId, cancellationToken) is null)
            return Result<Guid>.Failure("patient.not_found", "Không tìm thấy bệnh nhân trong phòng khám.");

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

        return await _transactionRunner.ExecuteAsync(async ct =>
        {
            if (!await _appointments.LockDoctorScheduleAsync(command.DoctorId, command.ClinicId, ct))
                return Result<Guid>.Failure("doctor.not_found", "Không tìm thấy bác sĩ trong phòng khám.");

            bool conflict = await _appointments.HasDoctorConflictAsync(
                command.DoctorId,
                command.StartsAt,
                command.EndsAt,
                excludingAppointmentId: null,
                ct);

            if (conflict)
            {
                return Result<Guid>.Failure(
                    "appointment.conflict",
                    "Bác sĩ đã có lịch hẹn trong khoảng thời gian này.");
            }

            await _appointments.AddAsync(appointment, ct);
            return Result<Guid>.Success(appointment.Id);
        }, cancellationToken);
    }
}
