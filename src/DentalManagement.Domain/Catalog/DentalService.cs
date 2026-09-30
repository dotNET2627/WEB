using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Catalog;

public sealed class DentalService : AuditableEntity
{
    public DentalService(
        Guid id,
        string code,
        string name,
        decimal unitPrice,
        Guid? categoryId = null,
        string? categoryName = null,
        string? unit = null,
        int? estimatedDurationMinutes = null,
        string? description = null,
        bool isActive = true)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Service code is required.", nameof(code));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Service name is required.", nameof(name));
        }

        if (unitPrice < 0)
        {
            throw new ArgumentException("Unit price cannot be negative.", nameof(unitPrice));
        }

        if (estimatedDurationMinutes is <= 0)
        {
            throw new ArgumentException("Estimated duration must be positive.", nameof(estimatedDurationMinutes));
        }

        Code = code.Trim().ToUpperInvariant();
        Name = name.Trim();
        UnitPrice = unitPrice;
        CategoryId = categoryId;
        CategoryName = categoryName?.Trim();
        Unit = unit?.Trim();
        EstimatedDurationMinutes = estimatedDurationMinutes;
        Description = description?.Trim();
        IsActive = isActive;
    }

    public string Code { get; private set; }
    public string Name { get; private set; }
    public decimal UnitPrice { get; private set; }
    public Guid? CategoryId { get; private set; }
    public string? CategoryName { get; private set; }
    public string? Unit { get; private set; }
    public int? EstimatedDurationMinutes { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }

    public Result UpdateDetails(
        string name,
        Guid? categoryId,
        string? categoryName,
        string? unit,
        int? estimatedDurationMinutes,
        string? description)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure("service.invalid_name", "Service name is required.");
        }

        if (estimatedDurationMinutes is <= 0)
        {
            return Result.Failure("service.invalid_duration", "Estimated duration must be positive.");
        }

        Name = name.Trim();
        CategoryId = categoryId;
        CategoryName = categoryName?.Trim();
        Unit = unit?.Trim();
        EstimatedDurationMinutes = estimatedDurationMinutes;
        Description = description?.Trim();
        Touch();

        return Result.Success();
    }

    public Result UpdatePrice(decimal newUnitPrice)
    {
        if (newUnitPrice < 0)
        {
            return Result.Failure("service.invalid_price", "Unit price cannot be negative.");
        }

        UnitPrice = newUnitPrice;
        Touch();
        return Result.Success();
    }

    public Result Activate()
    {
        if (IsActive)
        {
            return Result.Failure("service.already_active", "Service is already active.");
        }

        IsActive = true;
        Touch();
        return Result.Success();
    }

    public Result Deactivate()
    {
        if (!IsActive)
        {
            return Result.Failure("service.already_inactive", "Service is already inactive.");
        }

        IsActive = false;
        Touch();
        return Result.Success();
    }

    public static DentalService Rehydrate(
        Guid id,
        string code,
        string name,
        decimal unitPrice,
        Guid? categoryId,
        string? categoryName,
        string? unit,
        int? estimatedDurationMinutes,
        string? description,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
    {
        var service = new DentalService(
            id,
            code,
            name,
            unitPrice,
            categoryId,
            categoryName,
            unit,
            estimatedDurationMinutes,
            description,
            isActive);

        service.SetAuditDates(createdAt, updatedAt);
        return service;
    }
}
