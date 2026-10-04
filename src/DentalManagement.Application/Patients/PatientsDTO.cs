using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.Patients;

public sealed record PatientDto(
    Guid Id, Guid ClinicId, string FullName, string? PatientCode,
    string? PhoneNumber, DateOnly? DateOfBirth,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt)
{
    public static PatientDto FromDomain(Patient patient) => new(
        patient.Id,
        patient.ClinicId, 
        patient.FullName, 
        patient.PatientCode,
        patient.PhoneNumber, 
        patient.DateOfBirth, 
        patient.CreatedAt, 
        patient.UpdatedAt);
}
