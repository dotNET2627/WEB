using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

[BsonIgnoreExtraElements]
public sealed class DoctorDocument : MongoDocument
{
    [BsonElement("userId")]
    public Guid UserId { get; init; }

    [BsonElement("clinicId")]
    public Guid? ClinicId { get; init; }

    [BsonElement("medicalLicenseNumber")]
    public string MedicalLicenseNumber { get; init; } = string.Empty;

    [BsonElement("yearsOfExperience")]
    public int YearsOfExperience { get; init; }

    [BsonElement("biography")]
    public string? Biography { get; init; }

    [BsonElement("specialty")]
    public string? Specialty { get; init; }

    [BsonElement("workSchedules")]
    public IReadOnlyCollection<WorkScheduleDocument> WorkSchedules { get; init; } = [];
}

[BsonIgnoreExtraElements]
public sealed record WorkScheduleDocument(
    [property: BsonElement("id")] Guid Id,
    [property: BsonElement("clinicId")] Guid? ClinicId,
    [property: BsonElement("dayOfWeek")] int DayOfWeek,
    [property: BsonElement("startTime")] string StartTime,
    [property: BsonElement("endTime")] string EndTime,
    [property: BsonElement("isActive")] bool IsActive = true);
