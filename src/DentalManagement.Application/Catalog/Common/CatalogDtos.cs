using DentalManagement.Domain.Catalog;

namespace DentalManagement.Application.Catalog.Common;

public sealed record DentalServiceDto(
    Guid Id,
    string Code,
    string Name,
    decimal UnitPrice,
    Guid? CategoryId,
    string? CategoryName,
    string? Unit,
    int? EstimatedDurationMinutes,
    string? Description,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record ServiceCategoryDto(
    Guid Id,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public static class CatalogDtoMapper
{
    public static DentalServiceDto ToDto(DentalService service) => new(
        service.Id,
        service.Code,
        service.Name,
        service.UnitPrice,
        service.CategoryId,
        service.CategoryName,
        service.Unit,
        service.EstimatedDurationMinutes,
        service.Description,
        service.IsActive,
        service.CreatedAt,
        service.UpdatedAt);

    public static ServiceCategoryDto ToDto(ServiceCategory category) => new(
        category.Id,
        category.Name,
        category.Description,
        category.CreatedAt,
        category.UpdatedAt);
}
