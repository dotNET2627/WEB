using DentalManagement.Domain.Patients;
using DentalManagement.Application.Common;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IPatientRepository
{
    Task<Patient?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> PatientCodeExistsAsync(Guid clinicId, string patientCode, CancellationToken cancellationToken);
    Task AddAsync(Patient patient, CancellationToken cancellationToken);
    Task ReplaceAsync(Patient patient, CancellationToken cancellationToken);
    Task<Patient?> GetByIdAsync(Guid clinicId, Guid id, CancellationToken cancellationToken);
    Task<PagedResult<Patient>> GetPageAsync(Guid clinicId, PagedQuery paging, string? search, CancellationToken cancellationToken);
    Task<bool> UpdateProfileAsync(Patient patient, CancellationToken cancellationToken);
    Task<bool> SoftDeleteAsync(Guid clinicId, Guid id, CancellationToken cancellationToken);
}
