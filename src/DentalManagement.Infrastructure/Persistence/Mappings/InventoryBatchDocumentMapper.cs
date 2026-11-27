using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class InventoryBatchDocumentMapper
{
    public static InventoryBatchDocument ToDocument(InventoryBatch batch) => new()
    {
        Id = batch.Id,
        ClinicId = batch.ClinicId,
        InventoryItemId = batch.InventoryItemId,
        BatchNumber = batch.BatchNumber,
        ExpirationDate = batch.ExpirationDate,
        QuantityOnHand = batch.QuantityOnHand,
        UnitCost = batch.UnitCost,
        CreatedAt = batch.CreatedAt
    };

    public static InventoryBatch ToDomain(InventoryBatchDocument doc) =>
        new(
            doc.Id,
            doc.ClinicId,
            doc.InventoryItemId,
            doc.BatchNumber,
            doc.ExpirationDate,
            doc.QuantityOnHand,
            doc.UnitCost,
            doc.CreatedAt);
}
