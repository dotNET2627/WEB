namespace DentalManagement.Application.Identity.Commands.SwitchClinic;

public sealed record SwitchClinicResponseDto(
    string AccessToken,
    int ExpiresIn,
    Guid ClinicId,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions);
