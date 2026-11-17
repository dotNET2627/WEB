using MongoDB.Bson.Serialization.Attributes;

namespace DentalManagement.Infrastructure.Persistence.Documents;

public sealed class CashierShiftDocument : MongoDocument
{
    [BsonElement("clinicId")]
    public Guid ClinicId { get; init; }

    [BsonElement("cashierId")]
    public Guid CashierId { get; init; }

    [BsonElement("cashierName")]
    public string CashierName { get; init; } = string.Empty;

    [BsonElement("shiftNumber")]
    public string ShiftNumber { get; init; } = string.Empty;

    [BsonElement("startedAt")]
    public DateTimeOffset StartedAt { get; init; }

    [BsonElement("closedAt")]
    public DateTimeOffset? ClosedAt { get; init; }

    [BsonElement("status")]
    public string Status { get; init; } = string.Empty;

    [BsonElement("openingCash")]
    public decimal OpeningCash { get; init; }

    [BsonElement("systemCashAmount")]
    public decimal SystemCashAmount { get; init; }

    [BsonElement("systemTransferAmount")]
    public decimal SystemTransferAmount { get; init; }

    [BsonElement("systemCardAmount")]
    public decimal SystemCardAmount { get; init; }

    [BsonElement("systemInsuranceAmount")]
    public decimal SystemInsuranceAmount { get; init; }

    [BsonElement("actualCashAmount")]
    public decimal? ActualCashAmount { get; init; }

    [BsonElement("actualTransferAmount")]
    public decimal? ActualTransferAmount { get; init; }

    [BsonElement("actualCardAmount")]
    public decimal? ActualCardAmount { get; init; }

    [BsonElement("notes")]
    public string? Notes { get; init; }
}
