using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class RefreshTokenDocument : MongoDocument
{
    [BsonElement("tokenHash")]
    public string TokenHash { get; init; } = string.Empty;

    [BsonElement("userId")]
    public Guid UserId { get; init; }

    [BsonElement("expiresAt")]
    public DateTimeOffset ExpiresAt { get; init; }

    [BsonElement("revokedAt")]
    public DateTimeOffset? RevokedAt { get; init; }

    [BsonElement("replacedByTokenHash")]
    public string? ReplacedByTokenHash { get; init; }

    [BsonElement("createdByIp")]
    public string? CreatedByIp { get; init; }

    [BsonElement("userAgent")]
    public string? UserAgent { get; init; }
}