using DentalManagement.Domain.Insurance;

namespace DentalManagement.Application.Insurance.CreateClaim;

public sealed record CreateInsuranceClaimCommand(
    Guid PatientId,
    Guid ClinicId,
    InsuranceType InsuranceType,
    string ProviderName,
    string CardNumber,
    string? PolicyNumber,
    decimal? CoverageRate,
    Guid? InvoiceId,
    Guid? AppointmentId,
    string? Diagnosis,
    string? DoctorName,
    string? Notes,
    IReadOnlyList<CreateClaimItemRequest> Items);

public sealed record CreateClaimItemRequest(
    string Description,
    int Quantity,
    decimal UnitPrice,
    string? ToothNumber = null,
    Guid? ServiceId = null);
