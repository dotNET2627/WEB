using DentalManagement.Domain.Catalog;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IServiceCategoryRepository
{
    Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken);
    Task<bool> CategoryNameExistsAsync(string name, Guid? excludingId, CancellationToken cancellationToken);
    Task AddAsync(ServiceCategory category, CancellationToken cancellationToken);
    Task ReplaceAsync(ServiceCategory category, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
