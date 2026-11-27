namespace DentalManagement.Application.Treatments.DeleteTreatmentStep;

public sealed record DeleteTreatmentStepCommand(Guid ClinicId, Guid TreatmentPlanId, Guid StepId);
