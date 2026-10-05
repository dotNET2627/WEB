using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

[BsonIgnoreExtraElements]
public sealed class ClinicDocument : MongoDocument
{
    [BsonElement("tenphongkham")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("diachi")]
    public string Address { get; init; } = string.Empty;

    [BsonElement("sodienthoai")]
    public string? PhoneNumber { get; init; }

    [BsonElement("email")]
    public string? Email { get; init; }

    [BsonElement("mota")]
    public string? Description { get; init; }

    [BsonElement("giomocua")]
    public Dictionary<string, string>? OpeningHours { get; init; }

    [BsonElement("logo")]
    public string? Logo { get; init; }

    [BsonElement("isActive")]
    public bool IsActive { get; init; } = true;

    [BsonElement("ngaytao")]
    public DateTimeOffset? NgayTao { get; init; }

    [BsonElement("ngaycapnhat")]
    public DateTimeOffset? NgayCapNhat { get; init; }
}
