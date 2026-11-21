using DentalManagement.Application.Common;
using DentalManagement.Domain.Clinics;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IClinicRepository
{
    Task<Clinic?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Clinic>> GetAllAsync(bool activeOnly, CancellationToken cancellationToken);
    Task<PagedResult<Clinic>> GetPagedAsync(int page, int pageSize, string? searchTerm, bool? activeOnly, CancellationToken cancellationToken);
    Task<bool> NameExistsAsync(string name, Guid? excludeId, CancellationToken cancellationToken);
    Task AddAsync(Clinic clinic, CancellationToken cancellationToken);
    Task ReplaceAsync(Clinic clinic, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
