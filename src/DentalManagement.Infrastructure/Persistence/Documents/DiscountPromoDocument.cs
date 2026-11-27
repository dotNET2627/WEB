using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class DiscountPromoDocument : MongoDocument
{
    [BsonElement("code")]
    public string Code { get; init; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; init; } = string.Empty;

    [BsonElement("description")]
    public string? Description { get; init; }

    [BsonElement("discountType")]
    public int DiscountType { get; init; }

    [BsonElement("discountValue")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal DiscountValue { get; init; }

    [BsonElement("maxDiscountAmount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? MaxDiscountAmount { get; init; }

    [BsonElement("minOrderAmount")]
    [BsonRepresentation(BsonType.Decimal128)]
    public decimal? MinOrderAmount { get; init; }

    [BsonElement("startDate")]
    public DateTimeOffset StartDate { get; init; }

    [BsonElement("endDate")]
    public DateTimeOffset? EndDate { get; init; }

    [BsonElement("usageLimit")]
    public int? UsageLimit { get; init; }

    [BsonElement("usedCount")]
    public int UsedCount { get; init; }

    [BsonElement("scope")]
    public int Scope { get; init; }

    [BsonElement("applicableServiceIds")]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public List<Guid> ApplicableServiceIds { get; init; } = [];

    [BsonElement("applicableCategoryIds")]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public List<Guid> ApplicableCategoryIds { get; init; } = [];

    [BsonElement("isActive")]
    public bool IsActive { get; init; }
}
