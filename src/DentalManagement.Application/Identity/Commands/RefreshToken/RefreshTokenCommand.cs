namespace DentalManagement.Application.Identity.Commands.RefreshToken;

public sealed record RefreshTokenCommand(
    string RawRefreshToken,
    string? IpAddress = null,
    string? UserAgent = null);
