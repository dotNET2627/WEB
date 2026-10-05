using DentalManagement.Application.Common;
using DentalManagement.Domain.Doctors;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IDoctorRepository
{
    Task<Doctor?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<Doctor?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task<Doctor?> GetByLicenseNumberAsync(string licenseNumber, CancellationToken cancellationToken);
    Task<bool> LicenseNumberExistsAsync(string licenseNumber, Guid? excludeId, CancellationToken cancellationToken);
    Task<bool> UserIdExistsAsync(Guid userId, Guid? excludeId, CancellationToken cancellationToken);
    Task<PagedResult<Doctor>> GetPagedAsync(
        int page,
        int pageSize,
        Guid? clinicId,
        string? specialty,
        string? searchTerm,
        CancellationToken cancellationToken);
    Task AddAsync(Doctor doctor, CancellationToken cancellationToken);
    Task ReplaceAsync(Doctor doctor, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
