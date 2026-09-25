using DentalManagement.Domain.Identity;

namespace DentalManagement.Application.Abstractions.Services;

public interface ITokenService
{
    string GenerateAccessToken(
        User user,
        Guid activeClinicId,
        IEnumerable<string> roles,
        IEnumerable<string> permissions);

    (string RawToken, string TokenHash, DateTimeOffset ExpiresAt) GenerateRefreshToken(
        bool rememberMe,
        DateTimeOffset now);

    string HashRefreshToken(string rawToken);
}
