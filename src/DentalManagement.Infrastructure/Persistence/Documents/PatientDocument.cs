using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class PatientDocument : MongoDocument
{
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
}

public sealed record MedicalHistoryDocument(
    string Type,
    string Name,
    string? Severity,
    string? Note,
    DateTimeOffset UpdatedAt);
