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
        int quantityOnHand)
        : base(id)
    {
        ClinicId = clinicId;
        InventoryItemId = inventoryItemId;
        BatchNumber = batchNumber;
        ExpirationDate = expirationDate;
        QuantityOnHand = quantityOnHand;
    }

    public Guid ClinicId { get; }
    public Guid InventoryItemId { get; }
    public string BatchNumber { get; }
    public DateOnly ExpirationDate { get; }
    public int QuantityOnHand { get; private set; }

    public Result Consume(int quantity)
    {
        if (quantity <= 0 || quantity > QuantityOnHand)
        {
            return Result.Failure("inventory.insufficient_stock", "Inventory batch does not have enough stock.");
        }

        QuantityOnHand -= quantity;
        return Result.Success();
    }
}
