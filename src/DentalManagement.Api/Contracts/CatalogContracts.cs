namespace DentalManagement.Api.Contracts;

public sealed record CreateDentalServiceRequest(
    string Code,
    string Name,
    decimal UnitPrice,
    Guid? CategoryId = null,
    string? Unit = null,
    int? EstimatedDurationMinutes = null,
    string? Description = null,
    bool IsActive = true);

public sealed record UpdateDentalServiceRequest(
    string Name,
    decimal UnitPrice,
    Guid? CategoryId = null,
    string? Unit = null,
    int? EstimatedDurationMinutes = null,
    string? Description = null);

public sealed record ToggleDentalServiceStatusRequest(bool? IsActive = null);

public sealed record CreateServiceCategoryRequest(
    string Name,
    string? Description = null);
