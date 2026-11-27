using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class InventoryTransactionDocumentMapper
{
    public static InventoryTransactionDocument ToDocument(InventoryTransaction tx) => new()
    {
        Id = tx.Id,
        ClinicId = tx.ClinicId,
        InventoryItemId = tx.InventoryItemId,
        InventoryBatchId = tx.InventoryBatchId,
        BatchNumber = tx.BatchNumber,
        Type = tx.Type.ToString(),
        Quantity = tx.Quantity,
        UnitCost = tx.UnitCost,
        ReferenceCode = tx.ReferenceCode,
        Note = tx.Note,
        CreatedAt = tx.CreatedAt,
        UpdatedAt = tx.CreatedAt
    };

    public static InventoryTransaction ToDomain(InventoryTransactionDocument doc)
    {
        var type = Enum.TryParse<InventoryTransactionType>(doc.Type, out var parsed)
            ? parsed
            : InventoryTransactionType.Import;

        return InventoryTransaction.Rehydrate(
            doc.Id,
            doc.ClinicId,
            doc.InventoryItemId,
            doc.InventoryBatchId,
            doc.BatchNumber,
            type,
            doc.Quantity,
            doc.UnitCost,
            doc.ReferenceCode,
            doc.Note,
            doc.CreatedAt);
    }
}
