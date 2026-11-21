namespace DentalManagement.Application.Doctors.Dtos;

public sealed record WorkScheduleDto(
    Guid? Id,
    Guid? ClinicId,
    string? ClinicName,
    int DayOfWeek,
    string? DayOfWeekName,
    string StartTime,
    string EndTime,
    bool IsActive = true)
{
    public WorkScheduleDto(Guid? clinicId, int dayOfWeek, string startTime, string endTime, bool isActive = true)
        : this(null, clinicId, null, dayOfWeek, null, startTime, endTime, isActive)
    {
    }
}

public sealed record DoctorDto(
    Guid Id,
    Guid UserId,
    Guid? ClinicId,
    string? ClinicName,
    string MedicalLicenseNumber,
    int YearsOfExperience,
    string? Specialty,
    string? Biography,
    string? DoctorName,
    string? Email,
    string? PhoneNumber,
    string? AvatarUrl,
    IReadOnlyCollection<WorkScheduleDto> WorkSchedules,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
