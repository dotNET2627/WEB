using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class ServiceDocument : MongoDocument
{
    [BsonElement("code")]
    public string Code { get; init; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("unitPrice")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal UnitPrice { get; init; }

    [BsonElement("categoryId")]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid? CategoryId { get; init; }

    [BsonElement("categoryName")]
    public string? CategoryName { get; init; }

    [BsonElement("unit")]
    public string? Unit { get; init; }

    [BsonElement("estimatedDurationMinutes")]
    public int? EstimatedDurationMinutes { get; init; }

    [BsonElement("description")]
    public string? Description { get; init; }

    [BsonElement("isActive")]
    public bool IsActive { get; init; }
}
