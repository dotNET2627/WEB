using DentalManagement.Application.Common;
using DentalManagement.Domain.Catalog;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IServiceRepository
{
    Task<DentalService?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<DentalService?> GetByCodeAsync(string code, CancellationToken cancellationToken);
    Task<bool> ServiceCodeExistsAsync(string code, Guid? excludingId, CancellationToken cancellationToken);
    Task<PagedResult<DentalService>> SearchAsync(
        string? searchTerm,
        Guid? categoryId,
        bool? isActive,
        PagedQuery pagedQuery,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<DentalService>> GetAllActiveAsync(CancellationToken cancellationToken);
    Task AddAsync(DentalService service, CancellationToken cancellationToken);
    Task ReplaceAsync(DentalService service, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
}
