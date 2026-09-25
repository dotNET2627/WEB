namespace DentalManagement.Application.Identity.Commands.Login;

public sealed record LoginResponseDto(
    string AccessToken,
    int ExpiresIn,
    string RawRefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    bool RememberMe,
    UserSummaryDto User);

public sealed record UserSummaryDto(
    Guid Id,
    string Email,
    string FullName,
    Guid ActiveClinicId,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<Guid> AssignedClinicIds);
