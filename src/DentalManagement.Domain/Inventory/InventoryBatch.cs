using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Inventory;

public sealed class InventoryBatch : Entity
{
    public InventoryBatch(
        Guid id,
        Guid clinicId,
        Guid inventoryItemId,
        string batchNumber,
        DateOnly expirationDate,
        int quantityOnHand,
        decimal unitCost = 0m,
        DateTimeOffset? createdAt = null)
        : base(id)
    {
        ClinicId = clinicId;
        InventoryItemId = inventoryItemId;
        BatchNumber = batchNumber;
        ExpirationDate = expirationDate;
        QuantityOnHand = quantityOnHand;
        UnitCost = unitCost;
        CreatedAt = createdAt ?? DateTimeOffset.UtcNow;
    }

    public Guid ClinicId { get; }
    public Guid InventoryItemId { get; }
    public string BatchNumber { get; }
    public DateOnly ExpirationDate { get; }
    public int QuantityOnHand { get; private set; }
    public decimal UnitCost { get; }
    public DateTimeOffset CreatedAt { get; }

    public static Result<InventoryBatch> Create(
        Guid clinicId,
        Guid inventoryItemId,
        string batchNumber,
        DateOnly expirationDate,
        int quantity,
        decimal unitCost,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty || inventoryItemId == Guid.Empty)
        {
            return Result<InventoryBatch>.Failure("inventory.invalid_reference", "ClinicId và InventoryItemId là bắt buộc.");
        }

        if (string.IsNullOrWhiteSpace(batchNumber))
        {
            return Result<InventoryBatch>.Failure("inventory.invalid_batch_number", "Số lô không được để trống.");
        }

        if (quantity <= 0)
        {
            return Result<InventoryBatch>.Failure("inventory.invalid_quantity", "Số lượng nhập lô phải lớn hơn 0.");
        }

        if (unitCost < 0)
        {
            return Result<InventoryBatch>.Failure("inventory.invalid_unit_cost", "Giá nhập không được âm.");
        }

        var batch = new InventoryBatch(
            Guid.NewGuid(),
            clinicId,
            inventoryItemId,
            batchNumber.Trim().ToUpperInvariant(),
            expirationDate,
            quantity,
            unitCost,
            now);

        return Result<InventoryBatch>.Success(batch);
    }

    public Result Consume(int quantity)
    {
        if (quantity <= 0 || quantity > QuantityOnHand)
        {
            return Result.Failure("inventory.insufficient_stock", "Inventory batch does not have enough stock.");
        }

        QuantityOnHand -= quantity;
        return Result.Success();
    }

    public Result<int> AdjustQuantity(int actualQuantity)
    {
        if (actualQuantity < 0)
        {
            return Result<int>.Failure("inventory.invalid_quantity", "Số lượng kiểm kê thực tế phải >= 0.");
        }

        var delta = actualQuantity - QuantityOnHand;
        QuantityOnHand = actualQuantity;
        return Result<int>.Success(delta);
    }
}
