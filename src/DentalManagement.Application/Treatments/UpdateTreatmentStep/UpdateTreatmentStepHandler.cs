using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Treatments.UpdateTreatmentStep;

public sealed class UpdateTreatmentStepHandler : ICommandHandler<UpdateTreatmentStepCommand, Result<bool>>
{
    private readonly ITreatmentStepRepository _treatmentSteps;
    private readonly ITransactionRunner _transactionRunner;

    public UpdateTreatmentStepHandler(
        ITreatmentStepRepository treatmentSteps,
        ITransactionRunner transactionRunner)
    {
        _treatmentSteps = treatmentSteps;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<bool>> Handle(
        UpdateTreatmentStepCommand command,
        CancellationToken cancellationToken)
    {
        var step = await _treatmentSteps.GetByIdAsync(command.StepId, cancellationToken);
        if (step is null)
        {
            return Result<bool>.Failure(
                "treatment_step.not_found",
                "Không tìm thấy thông tin hạng mục điều trị.");
        }

        step.UpdateDetails(
            command.StepName,
            command.ServiceId,
            command.DoctorId,
            command.ToothNumber,
            command.Cost,
            command.OrderIndex,
            command.Notes);

        await _transactionRunner.RunAsync(
            async () => await _treatmentSteps.UpdateAsync(step, cancellationToken),
            cancellationToken);

        return Result<bool>.Success(true);
    }
}
