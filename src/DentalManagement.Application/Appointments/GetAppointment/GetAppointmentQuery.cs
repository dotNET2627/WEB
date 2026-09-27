using DentalManagement.Application.Appointments.CreateAppointment;
using DentalManagement.Domain.Appointments;

namespace DentalManagement.Application.Appointments.GetAppointment;

public sealed record GetAppointmentQuery(Guid AppointmentId);

public sealed record AppointmentDto(
    Guid Id,
    Guid PatientId,
    Guid DoctorId,
    Guid ClinicId,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string Status,
    string? Reason,
    IReadOnlyList<PlannedServiceDto> PlannedServices,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record PlannedServiceDto(
    Guid ServiceId,
    string ServiceName,
    decimal UnitPrice,
    string? ToothNumber);

internal static class AppointmentDtoMapper
{
    public static AppointmentDto ToDto(Appointment appointment) => new(
        appointment.Id,
        appointment.PatientId,
        appointment.DoctorId,
        appointment.ClinicId,
        appointment.StartsAt,
        appointment.EndsAt,
        appointment.Status.ToString(),
        appointment.Reason,
        appointment.PlannedServices
            .Select(s => new PlannedServiceDto(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber))
            .ToList(),
        appointment.CreatedAt,
        appointment.UpdatedAt);
}
