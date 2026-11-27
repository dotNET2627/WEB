using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.ChangeTreatmentStepStatus;

public sealed record ChangeTreatmentStepStatusCommand(
    Guid ClinicId,
    Guid TreatmentPlanId,
    Guid StepId,
    TreatmentStepStatus Status);
