using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class InventoryTransactionDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("inventoryItemId")]
    public Guid InventoryItemId { get; init; }

    [BsonElement("inventoryBatchId")]
    public Guid InventoryBatchId { get; init; }

    [BsonElement("batchNumber")]
    public string BatchNumber { get; init; } = string.Empty;

    [BsonElement("type")]
    public string Type { get; init; } = string.Empty;

    [BsonElement("quantity")]
    public int Quantity { get; init; }

    [BsonElement("unitCost")]
    public decimal UnitCost { get; init; }

    [BsonElement("referenceCode")]
    public string? ReferenceCode { get; init; }

    [BsonElement("note")]
    public string? Note { get; init; }
}
