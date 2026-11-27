using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Insurance.ListClaims;

public sealed class ListInsuranceClaimsHandler
    : IQueryHandler<ListInsuranceClaimsQuery, Result<IReadOnlyList<InsuranceClaimSummaryDto>>>
{
    private readonly IInsuranceClaimRepository _claims;
    private readonly IPatientRepository _patients;

    public ListInsuranceClaimsHandler(
        IInsuranceClaimRepository claims,
        IPatientRepository patients)
    {
        _claims = claims;
        _patients = patients;
    }

    public async Task<Result<IReadOnlyList<InsuranceClaimSummaryDto>>> Handle(
        ListInsuranceClaimsQuery query,
        CancellationToken cancellationToken)
    {
        var claims = await _claims.GetByClinicAsync(
            query.ClinicId,
            query.From,
            query.To,
            query.Status,
            query.InsuranceType,
            query.PatientId,
            cancellationToken);

        if (claims.Count == 0)
            return Result<IReadOnlyList<InsuranceClaimSummaryDto>>.Success([]);

        var patientIds = claims.Select(c => c.PatientId).Distinct().ToList();
        var patients = await _patients.GetByIdsAsync(query.ClinicId, patientIds, cancellationToken);
        var patientMap = patients.ToDictionary(p => p.Id);

        var summaries = claims.Select(c =>
        {
            patientMap.TryGetValue(c.PatientId, out var patient);
            return new InsuranceClaimSummaryDto(
                c.Id,
                c.ClaimNumber,
                c.PatientId,
                patient?.FullName ?? "–",
                patient?.PatientCode,
                c.InsuranceType.ToString(),
                c.ProviderName,
                c.CardNumber,
                c.ClaimAmount,
                c.ApprovedAmount,
                c.PatientPayAmount,
                c.Status.ToString(),
                c.SubmittedAt,
                c.ProcessedAt);
        }).ToList();

        return Result<IReadOnlyList<InsuranceClaimSummaryDto>>.Success(summaries);
    }
}
