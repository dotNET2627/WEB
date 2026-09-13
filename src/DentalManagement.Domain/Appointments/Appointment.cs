using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Appointments;

public enum AppointmentStatus
{
    Pending,
    Confirmed,
    Completed,
    Cancelled,
    NoShow
}

public sealed class Appointment : AuditableEntity
{
    public Appointment(
        Guid id,
        Guid patientId,
        Guid doctorId,
        Guid clinicId,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt = null)
        : base(id)
    {
        if (endsAt is not null && endsAt <= startsAt)
        {
            throw new ArgumentException("Appointment end time must be after start time.", nameof(endsAt));
        }

        PatientId = patientId;
        DoctorId = doctorId;
        ClinicId = clinicId;
        StartsAt = startsAt;
        EndsAt = endsAt;
    }

    public Guid PatientId { get; private set; }
    public Guid DoctorId { get; private set; }
    public Guid ClinicId { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset? EndsAt { get; private set; }
    public AppointmentStatus Status { get; private set; } = AppointmentStatus.Pending;
    public string? Reason { get; private set; }

    public Result Confirm()
    {
        if (Status != AppointmentStatus.Pending)
        {
            return Result.Failure("appointment.invalid_state", "Only pending appointments can be confirmed.");
        }

        Status = AppointmentStatus.Confirmed;
        Touch();
        return Result.Success();
    }

    public Result Cancel()
    {
        if (Status is AppointmentStatus.Completed or AppointmentStatus.Cancelled)
        {
            return Result.Failure("appointment.invalid_state", "Completed or cancelled appointments cannot be cancelled.");
        }

        Status = AppointmentStatus.Cancelled;
        Touch();
        return Result.Success();
    }
}
