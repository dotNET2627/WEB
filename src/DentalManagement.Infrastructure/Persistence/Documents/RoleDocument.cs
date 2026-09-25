using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class RoleDocument : MongoDocument
{
    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; init; }

    [BsonElement("isSystem")]
    public bool IsSystem { get; init; }

    [BsonElement("permissions")]
    public IReadOnlyCollection<string> Permissions { get; init; } = [];
}