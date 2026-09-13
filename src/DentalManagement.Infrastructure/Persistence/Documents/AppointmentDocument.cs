using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class AppointmentDocument : MongoDocument
{
    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    [BsonElement("doctorId")]
    public Guid DoctorId { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("startsAt")]
    public DateTimeOffset StartsAt { get; init; }

    [BsonElement("endsAt")]
    public DateTimeOffset? EndsAt { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("reason")]
    public string? Reason { get; init; }

    [BsonElement("plannedServices")]
    public IReadOnlyCollection<PlannedServiceDocument> PlannedServices { get; init; } = [];
}

public sealed record PlannedServiceDocument(Guid ServiceId, string ServiceName, decimal UnitPrice, string? ToothNumber);
