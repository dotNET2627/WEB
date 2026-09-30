using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Catalog;

public sealed class ServiceCategory : AuditableEntity
{
    public ServiceCategory(Guid id, string name, string? description = null)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Category name is required.", nameof(name));
        }

        Name = name.Trim();
        Description = description?.Trim();
    }

    public string Name { get; private set; }
    public string? Description { get; private set; }

    public Result Update(string name, string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure("category.invalid_name", "Category name is required.");
        }

        Name = name.Trim();
        Description = description?.Trim();
        Touch();
        return Result.Success();
    }

    public static ServiceCategory Rehydrate(
        Guid id,
        string name,
        string? description,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var category = new ServiceCategory(id, name, description);
        category.SetAuditDates(createdAt, updatedAt);
        return category;
    }
}
