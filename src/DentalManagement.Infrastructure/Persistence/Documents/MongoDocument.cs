using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public abstract class MongoDocument
{
    [BsonId]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid Id { get; init; }

    [BsonElement("createdAt")]
    public DateTimeOffset CreatedAt { get; init; }

    [BsonElement("updatedAt")]
    public DateTimeOffset UpdatedAt { get; init; }
}
