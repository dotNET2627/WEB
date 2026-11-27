using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Treatments.ChangeTreatmentStepStatus;

public sealed class ChangeTreatmentStepStatusHandler : ICommandHandler<ChangeTreatmentStepStatusCommand, Result<bool>>
{
    private readonly ITreatmentStepRepository _treatmentSteps;
    private readonly ITransactionRunner _transactionRunner;

    public ChangeTreatmentStepStatusHandler(
        ITreatmentStepRepository treatmentSteps,
        ITransactionRunner transactionRunner)
    {
        _treatmentSteps = treatmentSteps;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<bool>> Handle(
        ChangeTreatmentStepStatusCommand command,
        CancellationToken cancellationToken)
    {
        var step = await _treatmentSteps.GetByIdAsync(command.StepId, cancellationToken);
        if (step is null || step.ClinicId != command.ClinicId || step.TreatmentPlanId != command.TreatmentPlanId)
        {
            return Result<bool>.Failure(
                "treatment_step.not_found",
                "Không tìm thấy thông tin hạng mục điều trị.");
        }

        step.ChangeStatus(command.Status);

        await _transactionRunner.RunAsync(
            async () => await _treatmentSteps.UpdateAsync(step, cancellationToken),
            cancellationToken);

        return Result<bool>.Success(true);
    }
}
