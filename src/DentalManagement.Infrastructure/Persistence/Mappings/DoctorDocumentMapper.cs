using DentalManagement.Domain.Doctors;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class DoctorDocumentMapper
{
    public static DoctorDocument ToDocument(Doctor doctor) => new()
    {
        Id = doctor.Id,
        UserId = doctor.UserId,
        ClinicId = doctor.ClinicId,
        MedicalLicenseNumber = doctor.MedicalLicenseNumber,
        YearsOfExperience = doctor.YearsOfExperience,
        Biography = doctor.Biography,
        Specialty = doctor.Specialty,
        WorkSchedules = doctor.WorkSchedules
            .Select(s => new WorkScheduleDocument(s.Id, s.ClinicId, s.DayOfWeek, s.StartTime, s.EndTime, s.IsActive))
            .ToArray(),
        CreatedAt = doctor.CreatedAt,
        UpdatedAt = doctor.UpdatedAt,
        NgayTao = doctor.CreatedAt,
        NgayCapNhat = doctor.UpdatedAt
    };

    public static Doctor ToDomain(DoctorDocument document)
    {
        var createdAt = document.NgayTao ?? (document.CreatedAt != default ? document.CreatedAt : DateTimeOffset.UtcNow);
        var updatedAt = document.NgayCapNhat ?? (document.UpdatedAt != default ? document.UpdatedAt : DateTimeOffset.UtcNow);

        var schedules = document.WorkSchedules
            .Select(s => WorkScheduleItem.Create(s.Id, s.ClinicId, s.DayOfWeek, s.StartTime, s.EndTime, s.IsActive))
            .ToList();

        return Doctor.Rehydrate(
            document.Id,
            document.UserId,
            document.ClinicId,
            document.MedicalLicenseNumber,
            document.YearsOfExperience,
            document.Specialty,
            document.Biography,
            schedules,
            createdAt,
            updatedAt);
    }
}
