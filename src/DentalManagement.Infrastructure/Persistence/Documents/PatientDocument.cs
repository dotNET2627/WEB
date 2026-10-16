using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class PatientDocument : MongoDocument
{
    [BsonElement("isDeleted")]
    public bool IsDeleted { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("patientCode")]
    public string? PatientCode { get; init; }

    [BsonElement("fullName")]
    public string FullName { get; init; } = string.Empty;

    [BsonElement("phoneNumber")]
    public string? PhoneNumber { get; init; }

    [BsonElement("dateOfBirth")]
    public DateOnly? DateOfBirth { get; init; }

    [BsonElement("medicalHistory")]
    public IReadOnlyCollection<MedicalHistoryDocument> MedicalHistory { get; init; } = [];

    [BsonElement("teeth")]
    public IReadOnlyCollection<ToothConditionDocument> Teeth { get; init; } = [];
}

public sealed record MedicalHistoryDocument(
    string Type,
    string Name,
    string? Severity,
    string? Note,
    DateTimeOffset UpdatedAt);

/// <summary>Odontogram entry stored as a token string ("caries", "root_canal", ...).</summary>
public sealed record ToothConditionDocument(
    int ToothNumber,
    string Condition,
    IReadOnlyCollection<string> Surfaces,
    string? Note,
    DateTimeOffset UpdatedAt,
    string? UpdatedBy);
