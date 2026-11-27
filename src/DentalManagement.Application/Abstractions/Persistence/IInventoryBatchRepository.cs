using DentalManagement.Domain.Inventory;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInventoryBatchRepository
{
    Task<InventoryBatch?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryBatch>> ListByItemAsync(Guid clinicId, Guid inventoryItemId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryBatch>> ListByClinicAsync(Guid clinicId, CancellationToken cancellationToken);
    Task<IReadOnlyList<InventoryBatch>> ListAvailableFefoAsync(Guid clinicId, Guid inventoryItemId, DateOnly today, CancellationToken cancellationToken);
    Task AddAsync(InventoryBatch batch, CancellationToken cancellationToken);
    Task ReplaceAsync(InventoryBatch batch, CancellationToken cancellationToken);
}
