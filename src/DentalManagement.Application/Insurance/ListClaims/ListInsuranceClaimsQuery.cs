using DentalManagement.Domain.Insurance;

namespace DentalManagement.Application.Insurance.ListClaims;

public sealed record ListInsuranceClaimsQuery(
    Guid ClinicId,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    InsuranceClaimStatus? Status = null,
    InsuranceType? InsuranceType = null,
    Guid? PatientId = null);

public sealed record InsuranceClaimSummaryDto(
    Guid Id,
    string ClaimNumber,
    Guid PatientId,
    string PatientName,
    string? PatientCode,
    string InsuranceType,
    string ProviderName,
    string CardNumber,
    decimal ClaimAmount,
    decimal ApprovedAmount,
    decimal PatientPayAmount,
    string Status,
    DateTimeOffset SubmittedAt,
    DateTimeOffset? ProcessedAt);
