using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class SupplierDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("code")]
    public string Code { get; init; } = string.Empty;

    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("phone")]
    public string? Phone { get; init; }

    [BsonElement("email")]
    public string? Email { get; init; }

    [BsonElement("address")]
    public string? Address { get; init; }

    [BsonElement("contactPerson")]
    public string? ContactPerson { get; init; }

    [BsonElement("isActive")]
    public bool IsActive { get; init; }
}
