using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Application.Treatments.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Treatments.GetTreatmentStepsByPlan;

public sealed class GetTreatmentStepsByPlanHandler
    : IQueryHandler<GetTreatmentStepsByPlanQuery, Result<IReadOnlyList<TreatmentStepDto>>>
{
    private readonly ITreatmentStepRepository _treatmentSteps;

    public GetTreatmentStepsByPlanHandler(ITreatmentStepRepository treatmentSteps)
    {
        _treatmentSteps = treatmentSteps;
    }

    public async Task<Result<IReadOnlyList<TreatmentStepDto>>> Handle(
        GetTreatmentStepsByPlanQuery query,
        CancellationToken cancellationToken)
    {
        var steps = await _treatmentSteps.GetByTreatmentPlanIdAsync(query.TreatmentPlanId, cancellationToken);

        var dtos = steps
            .OrderBy(s => s.OrderIndex)
            .ThenBy(s => s.CreatedAt)
            .Select(s => new TreatmentStepDto(
                s.Id,
                s.TreatmentPlanId,
                s.ClinicId,
                s.StepName,
                s.ServiceId,
                s.DoctorId,
                s.ToothNumber,
                s.Cost,
                s.OrderIndex,
                s.Status,
                s.StartedAt,
                s.CompletedAt,
                s.Notes,
                s.CreatedAt,
                s.UpdatedAt))
            .ToList();

        return Result<IReadOnlyList<TreatmentStepDto>>.Success(dtos);
    }
}
