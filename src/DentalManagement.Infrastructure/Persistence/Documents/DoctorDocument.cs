using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

[BsonIgnoreExtraElements]
public sealed class DoctorDocument : MongoDocument
{
    [BsonElement("nguoidungid")]
    public Guid UserId { get; init; }

    [BsonElement("phongkhamid")]
    public Guid? ClinicId { get; init; }

    [BsonElement("sochungchihanhnghe")]
    public string MedicalLicenseNumber { get; init; } = string.Empty;

    [BsonElement("sonamkinhnghiem")]
    public int YearsOfExperience { get; init; }

    [BsonElement("gioithieu")]
    public string? Biography { get; init; }

    [BsonElement("chuyenkhoa")]
    public string? Specialty { get; init; }

    [BsonElement("calamviec")]
    public IReadOnlyCollection<WorkScheduleDocument> WorkSchedules { get; init; } = [];

    [BsonElement("ngaytao")]
    public DateTimeOffset? NgayTao { get; init; }

    [BsonElement("ngaycapnhat")]
    public DateTimeOffset? NgayCapNhat { get; init; }
}

[BsonIgnoreExtraElements]
public sealed record WorkScheduleDocument(
    [property: BsonElement("id")] Guid Id,
    [property: BsonElement("phongkhamid")] Guid? ClinicId,
    [property: BsonElement("thutrongtuan")] int DayOfWeek,
    [property: BsonElement("giobatdau")] string StartTime,
    [property: BsonElement("gioketthuc")] string EndTime,
    [property: BsonElement("dangapdung")] bool IsActive = true);
