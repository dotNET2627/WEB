namespace DentalManagement.Application.Patients.CreatePatient;

public sealed record CreatePatientCommand(
    Guid ClinicId,
    string FullName,
    string? PatientCode,
    string? PhoneNumber,
    DateOnly? DateOfBirth);
