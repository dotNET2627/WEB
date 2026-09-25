using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Identity;

public sealed class Role : AuditableEntity
{
    private readonly List<string> _permissions = [];

    public Role(Guid id, string name, string? description = null, bool isSystem = false)
        : base(id)
    {
        Name = name.Trim();
        Description = description?.Trim();
        IsSystem = isSystem;
    }

    public string Name { get; private set; }
    public string? Description { get; private set; }
    public bool IsSystem { get; private set; }

    public IReadOnlyCollection<string> Permissions => _permissions.AsReadOnly();

    public void AddPermission(string permission)
    {
        var normalized = permission.Trim().ToLowerInvariant();
        if (!_permissions.Contains(normalized))
        {
            _permissions.Add(normalized);
            Touch();
        }
    }

    public void RemovePermission(string permission)
    {
        var normalized = permission.Trim().ToLowerInvariant();
        if (_permissions.Remove(normalized))
        {
            Touch();
        }
    }

    public void SetPermissions(IEnumerable<string> permissions)
    {
        _permissions.Clear();
        foreach (var p in permissions)
        {
            var normalized = p.Trim().ToLowerInvariant();
            if (!_permissions.Contains(normalized))
            {
                _permissions.Add(normalized);
            }
        }
        Touch();
    }

    public static Role Rehydrate(
        Guid id,
        string name,
        string? description,
        bool isSystem,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        IEnumerable<string> permissions)
    {
        var role = new Role(id, name, description, isSystem);
        role.SetAuditDates(createdAt, updatedAt);

        foreach (var p in permissions)
        {
            role._permissions.Add(p);
        }

        return role;
    }
}
