using System.Security.Cryptography;
using System.Text;
using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Infrastructure.Security;

public sealed class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    // Pre-computed valid BCrypt hash for dummy verification to prevent timing attacks
    private static readonly string DummyHash = BCrypt.Net.BCrypt.EnhancedHashPassword(PreHash("dummy-timing-safe-password"), WorkFactor);

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);
        var preHashed = PreHash(password);
        return BCrypt.Net.BCrypt.EnhancedHashPassword(preHashed, WorkFactor);
    }

    public bool Verify(string password, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        var preHashed = PreHash(password);
        return BCrypt.Net.BCrypt.EnhancedVerify(preHashed, passwordHash);
    }

    public void PerformDummyVerification()
    {
        var preHashed = PreHash("invalid-dummy-password");
        _ = BCrypt.Net.BCrypt.EnhancedVerify(preHashed, DummyHash);
    }

    private static string PreHash(string password)
    {
        var bytes = Encoding.UTF8.GetBytes(password);
        var sha256Bytes = SHA256.HashData(bytes);
        return Convert.ToBase64String(sha256Bytes);
    }
}
