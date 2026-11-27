using DentalManagement.Domain.Catalog;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class ServiceDocumentMapper
{
    public static ServiceDocument ToDocument(DentalService service) => new()
    {
        Id = service.Id,
        Code = service.Code,
        Name = service.Name,
        UnitPrice = service.UnitPrice,
        CategoryId = service.CategoryId,
        CategoryName = service.CategoryName,
        Unit = service.Unit,
        EstimatedDurationMinutes = service.EstimatedDurationMinutes,
        Description = service.Description,
        IsActive = service.IsActive,
        CreatedAt = service.CreatedAt,
        UpdatedAt = service.UpdatedAt
    };

    public static DentalService ToDomain(ServiceDocument document) =>
        DentalService.Rehydrate(
            document.Id,
            document.Code,
            document.Name,
            document.UnitPrice,
            document.CategoryId,
            document.CategoryName,
            document.Unit,
            document.EstimatedDurationMinutes,
            document.Description,
            document.IsActive,
            document.CreatedAt,
            document.UpdatedAt);
}
