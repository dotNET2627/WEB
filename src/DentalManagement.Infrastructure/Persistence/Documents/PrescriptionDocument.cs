using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class PrescriptionItemDocument
{
    [BsonElement("inventoryItemId")]
    [BsonGuidRepresentation(GuidRepresentation.Standard)]
    public Guid? InventoryItemId { get; init; }

    [BsonElement("medicationName")]
    public string MedicationName { get; init; } = string.Empty;

    [BsonElement("dosage")]
    public string Dosage { get; init; } = string.Empty;

    [BsonElement("quantity")]
    public int Quantity { get; init; }

    [BsonElement("unit")]
    public string Unit { get; init; } = string.Empty;

    [BsonElement("instructions")]
    public string Instructions { get; init; } = string.Empty;
}

public sealed class PrescriptionDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("code")]
    public string Code { get; init; } = string.Empty;

    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    [BsonElement("patientName")]
    public string PatientName { get; init; } = string.Empty;

    [BsonElement("patientCode")]
    public string? PatientCode { get; init; }

    [BsonElement("doctorId")]
    public Guid? DoctorId { get; init; }

    [BsonElement("doctorName")]
    public string DoctorName { get; init; } = string.Empty;

    [BsonElement("diagnosis")]
    public string Diagnosis { get; init; } = string.Empty;

    [BsonElement("medicalNotes")]
    public string? MedicalNotes { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("items")]
    public List<PrescriptionItemDocument> Items { get; init; } = [];

    [BsonElement("dispensedAt")]
    public DateTimeOffset? DispensedAt { get; init; }
}
