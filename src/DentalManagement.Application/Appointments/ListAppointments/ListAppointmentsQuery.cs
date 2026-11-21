namespace DentalManagement.Application.Appointments.ListAppointments;

public sealed record ListAppointmentsQuery(
    DateTimeOffset From,
    DateTimeOffset To,
    Guid? DoctorId);

public sealed record AppointmentSummaryDto(
    Guid Id,
    Guid PatientId,
    string? PatientName,
    Guid DoctorId,
    string? DoctorName,
    Guid ClinicId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string Status,
    string? Reason);
