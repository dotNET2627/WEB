using DentalManagement.Domain.Appointments;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class AppointmentDocumentMapper
{
    public static AppointmentDocument ToDocument(Appointment appointment) => new()
    {
        Id = appointment.Id,
        PatientId = appointment.PatientId,
        DoctorId = appointment.DoctorId,
        ClinicId = appointment.ClinicId,
        StartsAt = appointment.StartsAt,
        EndsAt = appointment.EndsAt,
        Status = appointment.Status.ToString(),
        Reason = appointment.Reason,
        PlannedServices = appointment.PlannedServices
            .Select(s => new PlannedServiceDocument(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber))
            .ToList(),
        CreatedAt = appointment.CreatedAt,
        UpdatedAt = appointment.UpdatedAt
    };

    public static Appointment ToDomain(AppointmentDocument doc)
    {
        var status = Enum.TryParse<AppointmentStatus>(doc.Status, out var parsedStatus)
            ? parsedStatus
            : AppointmentStatus.Pending;

        var services = doc.PlannedServices?
            .Select(s => new PlannedService(s.ServiceId, s.ServiceName, s.UnitPrice, s.ToothNumber));

        return Appointment.Rehydrate(
            doc.Id,
            doc.PatientId,
            doc.DoctorId,
            doc.ClinicId,
            doc.StartsAt,
            doc.EndsAt,
            status,
            doc.Reason,
            doc.CreatedAt,
            doc.UpdatedAt,
            services);
    }
}
