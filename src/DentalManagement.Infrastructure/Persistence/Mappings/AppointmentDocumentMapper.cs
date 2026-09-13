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
        CreatedAt = appointment.CreatedAt,
        UpdatedAt = appointment.UpdatedAt
    };
}
