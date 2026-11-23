using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.ChangeTreatmentStepStatus;

public sealed record ChangeTreatmentStepStatusCommand(
    Guid StepId,
    TreatmentStepStatus Status);
