namespace DentalManagement.Domain.Catalog;

public sealed record ServiceCatalogItem(Guid Id, string Code, string Name, decimal UnitPrice, bool IsActive);
