using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class InvoiceDocument : MongoDocument
{
    [BsonElement("patientId")]
    public Guid PatientId { get; init; }

    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("invoiceNumber")]
    public string InvoiceNumber { get; init; } = string.Empty;

    [BsonElement("appointmentId")]
    public Guid? AppointmentId { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("discountAmount")]
    public decimal DiscountAmount { get; init; }

    [BsonElement("discountPercent")]
    public decimal DiscountPercent { get; init; }

    [BsonElement("notes")]
    public string? Notes { get; init; }

    [BsonElement("issuedAt")]
    public DateTimeOffset IssuedAt { get; init; }

    [BsonElement("lines")]
    public IReadOnlyCollection<InvoiceLineDocument> Lines { get; init; } = [];

    [BsonElement("payments")]
    public IReadOnlyCollection<PaymentDocument> Payments { get; init; } = [];
}

public sealed record InvoiceLineDocument(
    string Description,
    int Quantity,
    decimal UnitPrice,
    Guid? ServiceId,
    string? ToothNumber);

public sealed record PaymentDocument(
    decimal Amount,
    string Method,
    DateTimeOffset PaidAt,
    string? Reference,
    string? Note = null,
    Guid? Id = null);
