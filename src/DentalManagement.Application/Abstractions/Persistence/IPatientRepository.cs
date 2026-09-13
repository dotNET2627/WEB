using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> PatientCodeExistsAsync(Guid clinicId, string patientCode, CancellationToken cancellationToken);
    Task AddAsync(Patient patient, CancellationToken cancellationToken);
    Task ReplaceAsync(Patient patient, CancellationToken cancellationToken);
}
