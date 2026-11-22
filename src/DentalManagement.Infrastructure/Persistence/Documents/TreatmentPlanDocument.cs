using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class TreatmentPlanDocument : MongoDocument
{
    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("doctorId")]
    public Guid? DoctorId { get; init; }

    [BsonElement("name")]
    public string Name { get; init; } = string.Empty;

    [BsonElement("estimatedCost")]
    public decimal EstimatedCost { get; init; }

    [BsonElement("startDate")]
    public DateTimeOffset StartDate { get; init; }

    [BsonElement("endDate")]
    public DateTimeOffset? EndDate { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("notes")]
    public string? Notes { get; init; }
}
