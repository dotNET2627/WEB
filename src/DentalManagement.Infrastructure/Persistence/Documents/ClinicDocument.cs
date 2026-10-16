using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

[BsonIgnoreExtraElements]
public sealed class ClinicDocument : MongoDocument
{
    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("address")]
    public string Address { get; init; } = string.Empty;

    [BsonElement("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [BsonElement("email")]
    public string? Email { get; init; }

    [BsonElement("description")]
    public string? Description { get; init; }

    [BsonElement("openingHours")]
    public Dictionary<string, string>? OpeningHours { get; init; }

    [BsonElement("logo")]
    public string? Logo { get; init; }

    [BsonElement("isActive")]
    public bool IsActive { get; init; } = true;
}
