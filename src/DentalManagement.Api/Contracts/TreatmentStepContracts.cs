using DentalManagement.Domain.Treatments;

namespace DentalManagement.Api.Contracts;

public sealed record CreateTreatmentStepRequest(
    string StepName,
    Guid? ServiceId,
    Guid? DoctorId,
    string? ToothNumber,
    decimal Cost,
    int OrderIndex,
    string? Notes);

public sealed record UpdateTreatmentStepRequest(
    string StepName,
    Guid? ServiceId,
    Guid? DoctorId,
    string? ToothNumber,
    decimal Cost,
    int OrderIndex,
    string? Notes);

public sealed record ChangeTreatmentStepStatusRequest(
    TreatmentStepStatus Status);
