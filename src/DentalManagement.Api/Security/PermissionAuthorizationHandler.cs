using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace DentalManagement.Api.Security;

public sealed class PermissionAuthorizationHandler : AuthorizationHandler<PermissionRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        PermissionRequirement requirement)
    {
        // 1. SuperAdmin has unrestricted access to all endpoints
        var isSuperAdmin = context.User.IsInRole("SuperAdmin") ||
            context.User.Claims.Any(c => (c.Type == "roles" || c.Type == ClaimTypes.Role) &&
                string.Equals(c.Value, "SuperAdmin", StringComparison.OrdinalIgnoreCase));

        if (isSuperAdmin)
        {
            context.Succeed(requirement);
            return Task.CompletedTask;
        }

        // 2. Check granular permissions
        var hasPermission = context.User.Claims
            .Where(c => c.Type == "permissions" || c.Type == "permission")
            .Any(c => string.Equals(c.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

        if (hasPermission)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}

