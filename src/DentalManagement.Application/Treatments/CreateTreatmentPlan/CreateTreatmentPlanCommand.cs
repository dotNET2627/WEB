namespace DentalManagement.Application.Treatments.CreateTreatmentPlan;

public sealed record CreateTreatmentPlanCommand(
    Guid PatientId,
    Guid ClinicId,
    string Name,
    decimal EstimatedCost,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    Guid? DoctorId,
    string? Notes);
