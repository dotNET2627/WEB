using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Inventory;

public sealed class InventoryItem : Entity
{
    private InventoryItem(
        Guid id,
        Guid clinicId,
        string code,
        string name,
        string category,
        string unit,
        int minimumStock,
        string? description,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt)
        : base(id)
    {
        ClinicId = clinicId;
        Code = code;
        Name = name;
        Category = category;
        Unit = unit;
        MinimumStock = minimumStock;
        Description = description;
        IsActive = isActive;
        CreatedAt = createdAt;
        UpdatedAt = updatedAt;
    }

    public Guid ClinicId { get; }
    public string Code { get; private set; }
    public string Name { get; private set; }
    public string Category { get; private set; }
    public string Unit { get; private set; }
    public int MinimumStock { get; private set; }
    public string? Description { get; private set; }
    public bool IsActive { get; private set; }
    public DateTimeOffset CreatedAt { get; }
    public DateTimeOffset UpdatedAt { get; private set; }

    public static Result<InventoryItem> Create(
        Guid clinicId,
        string code,
        string name,
        string category,
        string unit,
        int minimumStock,
        string? description,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty)
        {
            return Result<InventoryItem>.Failure("inventory.invalid_clinic", "ClinicId is required.");
        }

        if (string.IsNullOrWhiteSpace(code))
        {
            return Result<InventoryItem>.Failure("inventory.invalid_code", "Mã vật tư không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            return Result<InventoryItem>.Failure("inventory.invalid_name", "Tên vật tư không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(unit))
        {
            return Result<InventoryItem>.Failure("inventory.invalid_unit", "Đơn vị tính không được để trống.");
        }

        if (minimumStock < 0)
        {
            return Result<InventoryItem>.Failure("inventory.invalid_min_stock", "Ngưỡng tồn tối thiểu phải >= 0.");
        }

        var item = new InventoryItem(
            Guid.NewGuid(),
            clinicId,
            code.Trim().ToUpperInvariant(),
            name.Trim(),
            string.IsNullOrWhiteSpace(category) ? "Vật tư y tế" : category.Trim(),
            unit.Trim(),
            minimumStock,
            description?.Trim(),
            true,
            now,
            now);

        return Result<InventoryItem>.Success(item);
    }

    public Result Update(
        string name,
        string category,
        string unit,
        int minimumStock,
        string? description,
        bool isActive,
        DateTimeOffset now)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return Result.Failure("inventory.invalid_name", "Tên vật tư không được để trống.");
        }

        if (string.IsNullOrWhiteSpace(unit))
        {
            return Result.Failure("inventory.invalid_unit", "Đơn vị tính không được để trống.");
        }

        if (minimumStock < 0)
        {
            return Result.Failure("inventory.invalid_min_stock", "Ngưỡng tồn tối thiểu phải >= 0.");
        }

        Name = name.Trim();
        Category = string.IsNullOrWhiteSpace(category) ? Category : category.Trim();
        Unit = unit.Trim();
        MinimumStock = minimumStock;
        Description = description?.Trim();
        IsActive = isActive;
        UpdatedAt = now;

        return Result.Success();
    }

    public static InventoryItem Rehydrate(
        Guid id,
        Guid clinicId,
        string code,
        string name,
        string category,
        string unit,
        int minimumStock,
        string? description,
        bool isActive,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt) =>
        new(id, clinicId, code, name, category, unit, minimumStock, description, isActive, createdAt, updatedAt);
}
