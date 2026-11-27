namespace DentalManagement.Api.Contracts;

public sealed record CreateTreatmentPlanRequest(
    string Name,
    decimal EstimatedCost,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    Guid? DoctorId,
    string? Notes);
