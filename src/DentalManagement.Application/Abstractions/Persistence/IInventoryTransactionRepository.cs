using DentalManagement.Domain.Inventory;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInventoryTransactionRepository
{
    Task<IReadOnlyList<InventoryTransaction>> ListByClinicAsync(
        Guid clinicId,
        Guid? inventoryItemId,
        InventoryTransactionType? type,
        CancellationToken cancellationToken);

    Task AddAsync(InventoryTransaction transaction, CancellationToken cancellationToken);
}
