using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class TreatmentStepDocument : MongoDocument
{
    [BsonElement("treatmentPlanId")]
    public Guid TreatmentPlanId { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("stepName")]
    public string StepName { get; init; } = string.Empty;

    [BsonElement("serviceId")]
    public Guid? ServiceId { get; init; }

    [BsonElement("doctorId")]
    public Guid? DoctorId { get; init; }

    [BsonElement("toothNumber")]
    public string? ToothNumber { get; init; }

    [BsonElement("cost")]
    public decimal Cost { get; init; }

    [BsonElement("orderIndex")]
    public int OrderIndex { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("startedAt")]
    public DateTimeOffset? StartedAt { get; init; }

    [BsonElement("completedAt")]
    public DateTimeOffset? CompletedAt { get; init; }

    [BsonElement("notes")]
    public string? Notes { get; init; }
}
