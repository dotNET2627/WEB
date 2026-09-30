using DentalManagement.Domain.Catalog;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class ServiceCategoryDocumentMapper
{
    public static ServiceCategoryDocument ToDocument(ServiceCategory category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        Description = category.Description,
        CreatedAt = category.CreatedAt,
        UpdatedAt = category.UpdatedAt
    };

    public static ServiceCategory ToDomain(ServiceCategoryDocument document) =>
        ServiceCategory.Rehydrate(
            document.Id,
            document.Name,
            document.Description,
            document.CreatedAt,
            document.UpdatedAt);
}
