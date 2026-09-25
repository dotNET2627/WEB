using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Identity;

public sealed class RefreshToken : Entity
{
    public RefreshToken(
        Guid id,
        string tokenHash,
        Guid userId,
        DateTimeOffset expiresAt,
        DateTimeOffset createdAt,
        string? createdByIp = null,
        string? userAgent = null)
        : base(id)
    {
        TokenHash = tokenHash;
        UserId = userId;
        ExpiresAt = expiresAt;
        CreatedAt = createdAt;
        CreatedByIp = createdByIp;
        UserAgent = userAgent;
    }

    public string TokenHash { get; private set; }
    public Guid UserId { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public string? ReplacedByTokenHash { get; private set; }
    public string? CreatedByIp { get; private set; }
    public string? UserAgent { get; private set; }

    public bool IsExpired(DateTimeOffset now) => now >= ExpiresAt;
    public bool IsRevoked => RevokedAt.HasValue;
    public bool IsActive(DateTimeOffset now) => !IsRevoked && !IsExpired(now);

    public void Revoke(DateTimeOffset now, string? replacedByTokenHash = null)
    {
        RevokedAt = now;
        ReplacedByTokenHash = replacedByTokenHash;
    }

    public static RefreshToken Rehydrate(
        Guid id,
        string tokenHash,
        Guid userId,
        DateTimeOffset expiresAt,
        DateTimeOffset createdAt,
        DateTimeOffset? revokedAt,
        string? replacedByTokenHash,
        string? createdByIp,
        string? userAgent)
    {
        var token = new RefreshToken(id, tokenHash, userId, expiresAt, createdAt, createdByIp, userAgent);
        token.RevokedAt = revokedAt;
        token.ReplacedByTokenHash = replacedByTokenHash;
        return token;
    }
}