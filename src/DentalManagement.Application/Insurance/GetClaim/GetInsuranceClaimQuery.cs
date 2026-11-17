namespace DentalManagement.Application.Insurance.GetClaim;

public sealed record GetInsuranceClaimQuery(Guid ClaimId);

public sealed record InsuranceClaimDto(
    Guid Id,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    string? PatientPhone,
    Guid ClinicId,
    string ClaimNumber,
    string InsuranceType,
    string ProviderName,
    string CardNumber,
    string? PolicyNumber,
    decimal? CoverageRate,
    Guid? InvoiceId,
    string? InvoiceNumber,
    Guid? AppointmentId,
    decimal ClaimAmount,
    decimal ApprovedAmount,
    decimal PatientPayAmount,
    string Status,
    string? Diagnosis,
    string? DoctorName,
    string? Notes,
    string? RejectReason,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ProcessedAt,
    DateTimeOffset CreatedAt,
    IReadOnlyList<InsuranceClaimItemDto> Items);

public sealed record InsuranceClaimItemDto(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal Amount,
    decimal? ApprovedAmount,
    string? ToothNumber,
    Guid? ServiceId);
