using DentalManagement.Domain.Inventory;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface ISupplierRepository
{
    Task<Supplier?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> ExistsByCodeAsync(Guid clinicId, string code, Guid? excludingId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Supplier>> ListByClinicAsync(Guid clinicId, CancellationToken cancellationToken);
    Task AddAsync(Supplier supplier, CancellationToken cancellationToken);
    Task ReplaceAsync(Supplier supplier, CancellationToken cancellationToken);
}
