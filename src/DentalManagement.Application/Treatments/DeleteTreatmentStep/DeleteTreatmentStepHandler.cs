using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Treatments.DeleteTreatmentStep;

public sealed class DeleteTreatmentStepHandler : ICommandHandler<DeleteTreatmentStepCommand, Result<bool>>
{
    private readonly ITreatmentStepRepository _treatmentSteps;
    private readonly ITransactionRunner _transactionRunner;

    public DeleteTreatmentStepHandler(
        ITreatmentStepRepository treatmentSteps,
        ITransactionRunner transactionRunner)
    {
        _treatmentSteps = treatmentSteps;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<bool>> Handle(
        DeleteTreatmentStepCommand command,
        CancellationToken cancellationToken)
    {
        var step = await _treatmentSteps.GetByIdAsync(command.StepId, cancellationToken);
        if (step is null || step.ClinicId != command.ClinicId || step.TreatmentPlanId != command.TreatmentPlanId)
        {
            return Result<bool>.Failure(
                "treatment_step.not_found",
                "Không tìm thấy thông tin hạng mục điều trị.");
        }

        await _transactionRunner.RunAsync(
            async () => await _treatmentSteps.DeleteAsync(command.StepId, cancellationToken),
            cancellationToken);

        return Result<bool>.Success(true);
    }
}
