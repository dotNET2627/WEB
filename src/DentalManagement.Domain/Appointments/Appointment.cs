using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Appointments;

public enum AppointmentStatus
{
    Pending,       // Chờ xác nhận
    Confirmed,     // Đã xác nhận
    CheckedIn,     // Đã đến (check-in tại quầy)
    InProgress,    // Đang khám
    Completed,     // Hoàn thành
    Cancelled,     // Hủy
    NoShow         // Vắng mặt
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
    public DateTimeOffset? CheckedInAt { get; private set; }

    /// <summary>Immutable snapshot of planned services captured at booking time.</summary>
    public IReadOnlyList<PlannedService> PlannedServices => _plannedServices.AsReadOnly();

    // ── Transitions ────────────────────────────────────────────────────────────

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

    /// <summary>Patient has arrived at the clinic. Confirmed → CheckedIn.</summary>
    public Result CheckIn()
    {
        if (Status != AppointmentStatus.Confirmed)
        {
            return Result.Failure("appointment.invalid_state",
                "Chỉ có thể check-in lịch hẹn đã được xác nhận.");
        }

        Status = AppointmentStatus.CheckedIn;
        CheckedInAt = DateTimeOffset.UtcNow;
        Touch();
        return Result.Success();
    }

    /// <summary>Doctor starts the examination. CheckedIn → InProgress.</summary>
    public Result StartExam()
    {
        if (Status != AppointmentStatus.CheckedIn)
        {
            return Result.Failure("appointment.invalid_state",
                "Chỉ có thể bắt đầu khám khi bệnh nhân đã check-in.");
        }

        Status = AppointmentStatus.InProgress;
        Touch();
        return Result.Success();
    }

    /// <summary>Examination complete. InProgress → Completed.</summary>
    public Result Complete()
    {
        if (Status != AppointmentStatus.InProgress)
        {
            return Result.Failure("appointment.invalid_state",
                "Chỉ có thể hoàn thành khi đang trong trạng thái đang khám.");
        }

        Status = AppointmentStatus.Completed;
        Touch();
        return Result.Success();
    }

    /// <summary>Patient did not show up. Confirmed or CheckedIn → NoShow.</summary>
    public Result MarkNoShow()
    {
        if (Status is not (AppointmentStatus.Confirmed or AppointmentStatus.CheckedIn))
        {
            return Result.Failure("appointment.invalid_state",
                "Chỉ có thể đánh dấu vắng mặt khi lịch hẹn đã xác nhận hoặc đã check-in.");
        }

        Status = AppointmentStatus.NoShow;
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
        IEnumerable<PlannedService>? plannedServices = null,
        DateTimeOffset? checkedInAt = null)
    {
        var appt = new Appointment(id, patientId, doctorId, clinicId, startsAt, endsAt, reason, plannedServices)
        {
            Status = status,
            CheckedInAt = checkedInAt
        };
        appt.SetAuditDates(createdAt, updatedAt);
        return appt;
    }
}
