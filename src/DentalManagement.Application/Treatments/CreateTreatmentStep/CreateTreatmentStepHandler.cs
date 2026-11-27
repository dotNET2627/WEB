using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.CreateTreatmentStep;

public sealed class CreateTreatmentStepHandler : ICommandHandler<CreateTreatmentStepCommand, Result<Guid>>
{
    private readonly ITreatmentStepRepository _treatmentSteps;
    private readonly ITreatmentPlanRepository _treatmentPlans;
    private readonly ITransactionRunner _transactionRunner;

    public CreateTreatmentStepHandler(
        ITreatmentStepRepository treatmentSteps,
        ITreatmentPlanRepository treatmentPlans,
        ITransactionRunner transactionRunner)
    {
        _treatmentSteps = treatmentSteps;
        _treatmentPlans = treatmentPlans;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<Guid>> Handle(
        CreateTreatmentStepCommand command,
        CancellationToken cancellationToken)
    {
        var plan = await _treatmentPlans.GetByIdAsync(command.TreatmentPlanId, cancellationToken);
        if (plan is null || plan.ClinicId != command.ClinicId)
        {
            return Result<Guid>.Failure(
                "treatment_plan.not_found",
                "Không tìm thấy thông tin phác đồ điều trị.");
        }

        var step = new TreatmentStep(
            Guid.NewGuid(),
            command.TreatmentPlanId,
            command.ClinicId,
            command.StepName,
            command.ServiceId,
            command.DoctorId,
            command.ToothNumber,
            command.Cost,
            command.OrderIndex,
            command.Notes);

        await _transactionRunner.RunAsync(
            async () => await _treatmentSteps.AddAsync(step, cancellationToken),
            cancellationToken);

        return Result<Guid>.Success(step.Id);
    }
}
