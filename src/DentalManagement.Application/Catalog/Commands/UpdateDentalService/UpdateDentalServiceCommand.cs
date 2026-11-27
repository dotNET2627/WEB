namespace DentalManagement.Application.Catalog.Commands.UpdateDentalService;

public sealed record UpdateDentalServiceCommand(
    Guid Id,
    string Name,
    decimal UnitPrice,
    Guid? CategoryId = null,
    string? Unit = null,
    int? EstimatedDurationMinutes = null,
    string? Description = null);
