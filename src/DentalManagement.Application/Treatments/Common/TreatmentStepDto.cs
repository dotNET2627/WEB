using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.Common;

public sealed record TreatmentStepDto(
    Guid Id,
    Guid TreatmentPlanId,
    Guid ClinicId,
    string StepName,
    Guid? ServiceId,
    Guid? DoctorId,
    string? ToothNumber,
    decimal Cost,
    int OrderIndex,
    TreatmentStepStatus Status,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
