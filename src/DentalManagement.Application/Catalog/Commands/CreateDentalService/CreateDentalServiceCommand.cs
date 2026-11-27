namespace DentalManagement.Application.Catalog.Commands.CreateDentalService;

public sealed record CreateDentalServiceCommand(
    string Code,
    string Name,
    decimal UnitPrice,
    Guid? CategoryId = null,
    string? Unit = null,
    int? EstimatedDurationMinutes = null,
    string? Description = null,
    bool IsActive = true);
