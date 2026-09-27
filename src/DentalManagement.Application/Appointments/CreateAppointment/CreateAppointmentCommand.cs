namespace DentalManagement.Application.Appointments.CreateAppointment;

public sealed record CreateAppointmentCommand(
    Guid PatientId,
    Guid DoctorId,
    Guid ClinicId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? Reason,
    IReadOnlyList<PlannedServiceItem> PlannedServices);

/// <summary>
/// Snapshot of a planned dental service at the time of booking.
/// Prices are captured here to avoid coupling to a mutable catalog.
/// </summary>
public sealed record PlannedServiceItem(
    Guid ServiceId,
    string ServiceName,
    decimal UnitPrice,
    string? ToothNumber);
