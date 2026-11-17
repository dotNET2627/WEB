namespace DentalManagement.Domain.Insurance;

public sealed record InsuranceClaimItem(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal? ApprovedAmount = null,
    string? ToothNumber = null,
    Guid? ServiceId = null)
{
    public decimal Amount => Quantity * UnitPrice;
}
