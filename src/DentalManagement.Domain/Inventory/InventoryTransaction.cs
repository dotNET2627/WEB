using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Inventory;

public enum InventoryTransactionType
{
    Import = 1,
    ProcedureExport = 2,
    Disposal = 3,
    PrescriptionDispense = 4,
    Adjustment = 5
}

public sealed class InventoryTransaction : Entity
{
    private InventoryTransaction(
        Guid id,
        Guid clinicId,
        Guid inventoryItemId,
        Guid inventoryBatchId,
        string batchNumber,
        InventoryTransactionType type,
        int quantity,
        decimal unitCost,
        string? referenceCode,
        string? note,
        DateTimeOffset createdAt)
        : base(id)
    {
        ClinicId = clinicId;
        InventoryItemId = inventoryItemId;
        InventoryBatchId = inventoryBatchId;
        BatchNumber = batchNumber;
        Type = type;
        Quantity = quantity;
        UnitCost = unitCost;
        ReferenceCode = referenceCode;
        Note = note;
        CreatedAt = createdAt;
    }

    public Guid ClinicId { get; }
    public Guid InventoryItemId { get; }
    public Guid InventoryBatchId { get; }
    public string BatchNumber { get; }
    public InventoryTransactionType Type { get; }
    public int Quantity { get; }
    public decimal UnitCost { get; }
    public string? ReferenceCode { get; }
    public string? Note { get; }
    public DateTimeOffset CreatedAt { get; }

    public static Result<InventoryTransaction> Create(
        Guid clinicId,
        Guid inventoryItemId,
        Guid inventoryBatchId,
        string batchNumber,
        InventoryTransactionType type,
        int quantity,
        decimal unitCost,
        string? referenceCode,
        string? note,
        DateTimeOffset now)
    {
        if (clinicId == Guid.Empty || inventoryItemId == Guid.Empty || inventoryBatchId == Guid.Empty)
        {
            return Result<InventoryTransaction>.Failure(
                "inventory.invalid_transaction_reference",
                "ClinicId, InventoryItemId và InventoryBatchId là bắt buộc.");
        }

        if (quantity <= 0)
        {
            return Result<InventoryTransaction>.Failure(
                "inventory.invalid_transaction_quantity",
                "Số lượng giao dịch phải lớn hơn 0.");
        }

        var transaction = new InventoryTransaction(
            Guid.NewGuid(),
            clinicId,
            inventoryItemId,
            inventoryBatchId,
            batchNumber.Trim().ToUpperInvariant(),
            type,
            quantity,
            unitCost,
            referenceCode?.Trim(),
            note?.Trim(),
            now);

        return Result<InventoryTransaction>.Success(transaction);
    }

    public static InventoryTransaction Rehydrate(
        Guid id,
        Guid clinicId,
        Guid inventoryItemId,
        Guid inventoryBatchId,
        string batchNumber,
        InventoryTransactionType type,
        int quantity,
        decimal unitCost,
        string? referenceCode,
        string? note,
        DateTimeOffset createdAt) =>
        new(id, clinicId, inventoryItemId, inventoryBatchId, batchNumber, type, quantity, unitCost, referenceCode, note, createdAt);
}
