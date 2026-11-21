namespace DentalManagement.Application.Clinics.Dtos;

public sealed record ClinicDto(
    Guid Id,
    string Name,
    string Address,
    string? PhoneNumber,
    string? Email,
    string? Description,
    IReadOnlyDictionary<string, string>? OpeningHours,
    string? Logo,
    bool IsActive,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
