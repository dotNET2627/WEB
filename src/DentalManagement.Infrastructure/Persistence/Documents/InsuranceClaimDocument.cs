using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class InsuranceClaimDocument : MongoDocument
{
    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("claimNumber")]
    public string ClaimNumber { get; init; } = string.Empty;

    [BsonElement("insuranceType")]
    public string InsuranceType { get; init; } = string.Empty;

    [BsonElement("providerName")]
    public string ProviderName { get; init; } = string.Empty;

    [BsonElement("cardNumber")]
    public string CardNumber { get; init; } = string.Empty;

    [BsonElement("policyNumber")]
    public string? PolicyNumber { get; init; }

    [BsonElement("coverageRate")]
    public decimal? CoverageRate { get; init; }

    [BsonElement("invoiceId")]
    public Guid? InvoiceId { get; init; }

    [BsonElement("appointmentId")]
    public Guid? AppointmentId { get; init; }

    [BsonElement("claimAmount")]
    public decimal ClaimAmount { get; init; }

    [BsonElement("approvedAmount")]
    public decimal ApprovedAmount { get; init; }

    [BsonElement("patientPayAmount")]
    public decimal PatientPayAmount { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("diagnosis")]
    public string? Diagnosis { get; init; }

    [BsonElement("doctorName")]
    public string? DoctorName { get; init; }

    [BsonElement("notes")]
    public string? Notes { get; init; }

    [BsonElement("rejectReason")]
    public string? RejectReason { get; init; }

    [BsonElement("submittedAt")]
    public DateTimeOffset SubmittedAt { get; init; }

    [BsonElement("processedAt")]
    public DateTimeOffset? ProcessedAt { get; init; }

    [BsonElement("items")]
    public IReadOnlyCollection<InsuranceClaimItemDocument> Items { get; init; } = [];
}

public sealed record InsuranceClaimItemDocument(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal? ApprovedAmount = null,
    string? ToothNumber = null,
    Guid? ServiceId = null);
