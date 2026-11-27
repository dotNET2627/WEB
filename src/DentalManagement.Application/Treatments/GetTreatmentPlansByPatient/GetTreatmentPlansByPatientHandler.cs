using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Treatments.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Treatments.GetTreatmentPlansByPatient;

public sealed class GetTreatmentPlansByPatientHandler
    : IQueryHandler<GetTreatmentPlansByPatientQuery, Result<IReadOnlyList<TreatmentPlanDto>>>
{
    private readonly ITreatmentPlanRepository _treatmentPlans;

    public GetTreatmentPlansByPatientHandler(ITreatmentPlanRepository treatmentPlans)
    {
        _treatmentPlans = treatmentPlans;
    }

    public async Task<Result<IReadOnlyList<TreatmentPlanDto>>> Handle(
        GetTreatmentPlansByPatientQuery query,
        CancellationToken cancellationToken)
    {
        var plans = await _treatmentPlans.GetByPatientIdAsync(query.ClinicId, query.PatientId, cancellationToken);

        var dtos = plans.Select(p => new TreatmentPlanDto(
            p.Id,
            p.PatientId,
            p.ClinicId,
            p.DoctorId,
            p.Name,
            p.EstimatedCost,
            p.StartDate,
            p.EndDate,
            p.Status,
            p.Notes,
            p.CreatedAt,
            p.UpdatedAt
        )).ToList();

        return Result<IReadOnlyList<TreatmentPlanDto>>.Success(dtos);
    }
}
