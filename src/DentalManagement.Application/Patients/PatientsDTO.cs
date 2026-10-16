using DentalManagement.Domain.Patients;

namespace DentalManagement.Application.Patients;

public sealed record PatientDto(
    Guid Id, Guid ClinicId, string FullName, string? PatientCode,
    string? PhoneNumber, DateOnly? DateOfBirth,
    DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt,
    IReadOnlyList<MedicalHistoryItemDto> MedicalHistory,
    IReadOnlyList<ToothConditionDto> Odontogram)
{
    public static PatientDto FromDomain(Patient patient) => new(
        patient.Id,
        patient.ClinicId,
        patient.FullName,
        patient.PatientCode,
        patient.PhoneNumber,
        patient.DateOfBirth,
        patient.CreatedAt,
        patient.UpdatedAt,
        patient.MedicalHistory
            .Select((item, index) => MedicalHistoryItemDto.FromDomain(index, item))
            .ToArray(),
        patient.Teeth
            .Select(ToothConditionDto.FromDomain)
            .OrderBy(tooth => tooth.ToothNumber)
            .ToArray());
}

/// <summary>
/// One medical history entry. <see cref="Id"/> mirrors the positional index so clients can
/// call the index-based DELETE endpoint with <c>/medical-history/{id}</c>.
/// </summary>
public sealed record MedicalHistoryItemDto(
    string Id,
    string Type,
    string Name,
    string? Severity,
    string? Notes,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt)
{
    public static MedicalHistoryItemDto FromDomain(int index, MedicalHistoryItem item) => new(
        index.ToString(),
        item.Type,
        item.Name,
        item.Severity,
        item.Note,
        item.UpdatedAt,
        item.UpdatedAt);
}

/// <summary>Odontogram entry exposed by the API (snake_case condition/surface tokens).</summary>
public sealed record ToothConditionDto(
    int ToothNumber,
    string Condition,
    IReadOnlyList<string> Surfaces,
    string Notes,
    DateTimeOffset UpdatedAt,
    string? UpdatedBy)
{
    public static ToothConditionDto FromDomain(ToothCondition tooth) => new(
        tooth.ToothNumber,
        tooth.Condition.ToToken(),
        tooth.Surfaces.Select(surface => surface.ToToken()).ToArray(),
        tooth.Note ?? string.Empty,
        tooth.UpdatedAt,
        tooth.UpdatedBy);
}
