namespace DentalManagement.Application.Identity.Commands.RefreshToken;

public sealed record RefreshTokenResponseDto(
    string AccessToken,
    int ExpiresIn,
    string NewRawRefreshToken,
    DateTimeOffset RefreshTokenExpiresAt);
