using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;
using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.CreateTreatmentPlan;

public sealed class CreateTreatmentPlanHandler : ICommandHandler<CreateTreatmentPlanCommand, Result<Guid>>
{
    private readonly ITreatmentPlanRepository _treatmentPlans;
    private readonly IPatientRepository _patients;
    private readonly ITransactionRunner _transactionRunner;

    public CreateTreatmentPlanHandler(
        ITreatmentPlanRepository treatmentPlans,
        IPatientRepository patients,
        ITransactionRunner transactionRunner)
    {
        _treatmentPlans = treatmentPlans;
        _patients = patients;
        _transactionRunner = transactionRunner;
    }

    public async Task<Result<Guid>> Handle(
        CreateTreatmentPlanCommand command,
        CancellationToken cancellationToken)
    {
        var patient = await _patients.GetByIdAsync(command.ClinicId, command.PatientId, cancellationToken);
        if (patient is null)
        {
            return Result<Guid>.Failure(
                "patient.not_found",
                "Không tìm thấy thông tin bệnh nhân.");
        }

        var plan = new TreatmentPlan(
            Guid.NewGuid(),
            command.PatientId,
            command.ClinicId,
            command.Name,
            command.EstimatedCost,
            command.StartDate,
            command.EndDate,
            command.DoctorId,
            command.Notes);

        await _transactionRunner.RunAsync(
            async () => await _treatmentPlans.AddAsync(plan, cancellationToken),
            cancellationToken);

        return Result<Guid>.Success(plan.Id);
    }
}
