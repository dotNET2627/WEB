namespace DentalManagement.Application.Treatments.UpdateTreatmentStep;

public sealed record UpdateTreatmentStepCommand(
    Guid ClinicId,
    Guid TreatmentPlanId,
    Guid StepId,
    string StepName,
    Guid? ServiceId,
    Guid? DoctorId,
    string? ToothNumber,
    decimal Cost,
    int OrderIndex,
    string? Notes);
