using DentalManagement.Domain.Inventory;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInventoryItemRepository
{
    Task<InventoryItem?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> ExistsByCodeAsync(Guid clinicId, string code, Guid? excludingId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryItem>> ListByClinicAsync(Guid clinicId, string? search, CancellationToken cancellationToken);
    Task AddAsync(InventoryItem item, CancellationToken cancellationToken);
    Task ReplaceAsync(InventoryItem item, CancellationToken cancellationToken);
}
