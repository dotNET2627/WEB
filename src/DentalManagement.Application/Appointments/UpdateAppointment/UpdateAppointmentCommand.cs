using DentalManagement.Application.Appointments.CreateAppointment;

namespace DentalManagement.Application.Appointments.UpdateAppointment;

/// <summary>
/// Reschedules an existing appointment (time slot change + optional reason update).
/// PlannedServices are intentionally immutable after booking — create a new appointment to change services.
/// </summary>
public sealed record UpdateAppointmentCommand(
    Guid AppointmentId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string? Reason);
