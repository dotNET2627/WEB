using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class MedicalImageDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    /// <summary>Token form of the image type: "xray", "intraoral", "extraoral".</summary>
    [BsonElement("type")]
    public string Type { get; init; } = string.Empty;

    [BsonElement("title")]
    public string Title { get; init; } = string.Empty;

    /// <summary>Key of the binary file inside the file storage.</summary>
    [BsonElement("storageKey")]
    public string StorageKey { get; init; } = string.Empty;

    [BsonElement("fileName")]
    public string FileName { get; init; } = string.Empty;

    [BsonElement("contentType")]
    public string ContentType { get; init; } = string.Empty;

    [BsonElement("fileSizeBytes")]
    public long FileSizeBytes { get; init; }

    [BsonElement("toothNumber")]
    public int? ToothNumber { get; init; }

    [BsonElement("notes")]
    public string? Notes { get; init; }

    [BsonElement("capturedAt")]
    public DateTimeOffset? CapturedAt { get; init; }

    [BsonElement("uploadedBy")]
    public string? UploadedBy { get; init; }
}
