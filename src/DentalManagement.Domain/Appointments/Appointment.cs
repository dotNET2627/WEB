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

/// <summary>Snapshot of a service planned at the time of booking (denormalized for audit-safety).</summary>
public sealed record PlannedService(
    Guid ServiceId,
    string ServiceName,
    decimal UnitPrice,
    string? ToothNumber);

public sealed class Appointment : AuditableEntity
{
    private readonly List<PlannedService> _plannedServices = [];

    public Appointment(
        Guid id,
        Guid patientId,
        Guid doctorId,
        Guid clinicId,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt = null,
        string? reason = null,
        IEnumerable<PlannedService>? plannedServices = null)
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
        Reason = reason;

        if (plannedServices is not null)
        {
            _plannedServices.AddRange(plannedServices);
        }
    }

    public Guid PatientId { get; private set; }
    public Guid DoctorId { get; private set; }
    public Guid ClinicId { get; private set; }
    public DateTimeOffset StartsAt { get; private set; }
    public DateTimeOffset? EndsAt { get; private set; }
    public AppointmentStatus Status { get; private set; } = AppointmentStatus.Pending;
    public string? Reason { get; private set; }

    /// <summary>Immutable snapshot of planned services captured at booking time.</summary>
    public IReadOnlyList<PlannedService> PlannedServices => _plannedServices.AsReadOnly();

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

    /// <summary>Update reschedule times (only allowed when Pending or Confirmed).</summary>
    public Result Reschedule(DateTimeOffset startsAt, DateTimeOffset? endsAt)
    {
        if (Status is AppointmentStatus.Completed or AppointmentStatus.Cancelled)
        {
            return Result.Failure("appointment.invalid_state", "Cannot reschedule a completed or cancelled appointment.");
        }

        if (endsAt is not null && endsAt <= startsAt)
        {
            return Result.Failure("appointment.invalid_time", "End time must be after start time.");
        }

        StartsAt = startsAt;
        EndsAt = endsAt;
        Touch();
        return Result.Success();
    }

    public static Appointment Rehydrate(
        Guid id,
        Guid patientId,
        Guid doctorId,
        Guid clinicId,
        DateTimeOffset startsAt,
        DateTimeOffset? endsAt,
        AppointmentStatus status,
        string? reason,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        IEnumerable<PlannedService>? plannedServices = null)
    {
        var appt = new Appointment(id, patientId, doctorId, clinicId, startsAt, endsAt, reason, plannedServices)
        {
            Status = status
        };
        appt.SetAuditDates(createdAt, updatedAt);
        return appt;
    }
}
