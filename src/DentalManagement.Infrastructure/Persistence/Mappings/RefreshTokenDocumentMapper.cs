using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class RefreshTokenDocumentMapper
{
    public static RefreshTokenDocument ToDocument(RefreshToken token) => new()
    {
        Id = token.Id,
        TokenHash = token.TokenHash,
        UserId = token.UserId,
        ExpiresAt = token.ExpiresAt,
        CreatedAt = token.CreatedAt,
        RevokedAt = token.RevokedAt,
        ReplacedByTokenHash = token.ReplacedByTokenHash,
        CreatedByIp = token.CreatedByIp,
        UserAgent = token.UserAgent
    };

    public static RefreshToken ToDomain(RefreshTokenDocument document) =>
        RefreshToken.Rehydrate(
            document.Id,
            document.TokenHash,
            document.UserId,
            document.ExpiresAt,
            document.CreatedAt,
            document.RevokedAt,
            document.ReplacedByTokenHash,
            document.CreatedByIp,
            document.UserAgent);
}
