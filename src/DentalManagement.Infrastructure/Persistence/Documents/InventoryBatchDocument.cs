using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class InventoryBatchDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("inventoryItemId")]
    public Guid InventoryItemId { get; init; }

    [BsonElement("batchNumber")]
    public string BatchNumber { get; init; } = string.Empty;

    [BsonElement("expirationDate")]
    public DateOnly ExpirationDate { get; init; }

    [BsonElement("quantityOnHand")]
    public int QuantityOnHand { get; init; }
}
