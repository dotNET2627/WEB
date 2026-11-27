namespace DentalManagement.Application.Treatments.CreateTreatmentStep;

public sealed record CreateTreatmentStepCommand(
    Guid TreatmentPlanId,
    Guid ClinicId,
    string StepName,
    Guid? ServiceId,
    Guid? DoctorId,
    string? ToothNumber,
    decimal Cost,
    int OrderIndex,
    string? Notes);
