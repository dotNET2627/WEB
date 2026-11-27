namespace DentalManagement.Application.Appointments.GetTodayAppointments;

/// <summary>
/// Query to get all appointments for a specific clinic on a given date (defaults to today).
/// Used by the receptionist's daily check-in screen.
/// </summary>
public sealed record GetTodayAppointmentsQuery(
    Guid ClinicId,
    DateOnly? Date = null);

public sealed record TodayAppointmentDto(
    Guid Id,
    Guid PatientId,
    string PatientName,
    Guid DoctorId,
    string DoctorName,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    DateTimeOffset? CheckedInAt,
    string Status,
    string? Reason,
    IReadOnlyList<PlannedServiceItemDto> PlannedServices);

public sealed record PlannedServiceItemDto(
    Guid ServiceId,
    string ServiceName,
    decimal UnitPrice,
    string? ToothNumber);
