namespace DentalManagement.Infrastructure.Security;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "DentalManagement.Api";
    public string Audience { get; set; } = "DentalManagement.Client";
    public int ExpiryMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
