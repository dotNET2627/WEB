using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Treatments.Common;

public sealed record TreatmentPlanDto(
    Guid Id,
    Guid PatientId,
    Guid ClinicId,
    Guid? DoctorId,
    string Name,
    decimal EstimatedCost,
    DateTimeOffset StartDate,
    DateTimeOffset? EndDate,
    TreatmentPlanStatus Status,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
