using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class InventoryItemDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("code")]
    public string Code { get; init; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("category")]
    public string Category { get; init; } = string.Empty;

    [BsonElement("unit")]
    public string Unit { get; init; } = string.Empty;

    [BsonElement("minimumStock")]
    public int MinimumStock { get; init; }

    [BsonElement("description")]
    public string? Description { get; init; }

    [BsonElement("isActive")]
    public bool IsActive { get; init; }
}
