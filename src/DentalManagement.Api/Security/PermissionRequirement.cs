using Microsoft.AspNetCore.Authorization;

namespace DentalManagement.Api.Security;

public sealed class PermissionRequirement : IAuthorizationRequirement
{
    public string Permission { get; }

    public PermissionRequirement(string permission)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(permission);
        Permission = permission.Trim().ToLowerInvariant();
    }
}
