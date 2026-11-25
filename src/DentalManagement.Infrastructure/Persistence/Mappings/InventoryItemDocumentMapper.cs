using DentalManagement.Domain.Inventory;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class InventoryItemDocumentMapper
{
    public static InventoryItemDocument ToDocument(InventoryItem item) => new()
    {
        Id = item.Id,
        ClinicId = item.ClinicId,
        Code = item.Code,
        Name = item.Name,
        Category = item.Category,
        Unit = item.Unit,
        MinimumStock = item.MinimumStock,
        Description = item.Description,
        IsActive = item.IsActive,
        CreatedAt = item.CreatedAt,
        UpdatedAt = item.UpdatedAt
    };

    public static InventoryItem ToDomain(InventoryItemDocument doc) =>
        InventoryItem.Rehydrate(
            doc.Id,
            doc.ClinicId,
            doc.Code,
            doc.Name,
            doc.Category,
            doc.Unit,
            doc.MinimumStock,
            doc.Description,
            doc.IsActive,
            doc.CreatedAt,
            doc.UpdatedAt);
}
