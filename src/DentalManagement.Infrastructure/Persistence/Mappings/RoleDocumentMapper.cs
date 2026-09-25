using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class RoleDocumentMapper
{
    public static RoleDocument ToDocument(Role role) => new()
    {
        Id = role.Id,
        Name = role.Name,
        Description = role.Description,
        IsSystem = role.IsSystem,
        Permissions = role.Permissions.ToArray(),
        CreatedAt = role.CreatedAt,
        UpdatedAt = role.UpdatedAt
    };

    public static Role ToDomain(RoleDocument document) =>
        Role.Rehydrate(
            document.Id,
            document.Name,
            document.Description,
            document.IsSystem,
            document.CreatedAt,
            document.UpdatedAt,
            document.Permissions);
}
