using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using DentalManagement.Application.Abstractions.Services;

namespace DentalManagement.Api.Services;

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUser(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

    public Guid? UserId
    {
        get
        {
            var raw = User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                      ?? User?.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User?.FindFirstValue("sub");

            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public string? Email =>
        User?.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? User?.FindFirstValue(ClaimTypes.Email)
        ?? User?.FindFirstValue("email");

    public Guid? ClinicId
    {
        get
        {
            var raw = User?.FindFirstValue("clinicId");
            return Guid.TryParse(raw, out var id) ? id : null;
        }
    }

    public IReadOnlyList<string> Roles =>
        User?.FindAll(c => c.Type == "roles" || c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct()
            .ToList() ?? [];

    public IReadOnlyList<string> Permissions =>
        User?.FindAll(c => c.Type == "permissions" || c.Type == "permission")
            .Select(c => c.Value)
            .Distinct()
            .ToList() ?? [];

    public bool HasPermission(string permission) =>
        Permissions.Any(p => string.Equals(p, permission, StringComparison.OrdinalIgnoreCase));
}
