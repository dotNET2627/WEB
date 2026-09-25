using DentalManagement.Domain.Common;

namespace DentalManagement.Domain.Identity;

public sealed class User : AuditableEntity
{
    private readonly List<RoleAssignment> _assignments = [];

    public User(Guid id, string email, string fullName, string passwordHash, Guid? defaultClinicId = null)
        : base(id)
    {
        Email = email.Trim().ToLowerInvariant();
        FullName = fullName.Trim();
        PasswordHash = passwordHash;
        DefaultClinicId = defaultClinicId;
        IsActive = true;
    }

    public string Email { get; private set; }
    public string FullName { get; private set; }
    public string PasswordHash { get; private set; }
    public bool IsActive { get; private set; }
    public int AccessFailedCount { get; private set; }
    public DateTimeOffset? LockoutEnd { get; private set; }
    public Guid? DefaultClinicId { get; private set; }

    public IReadOnlyCollection<RoleAssignment> Assignments => _assignments.AsReadOnly();

    public bool IsLockedOut(DateTimeOffset now) =>
        LockoutEnd.HasValue && LockoutEnd.Value > now;

    public void RecordFailedLogin(DateTimeOffset now, int maxFailedAttempts = 5, int lockoutMinutes = 15)
    {
        if (LockoutEnd.HasValue && LockoutEnd.Value <= now)
        {
            AccessFailedCount = 0;
            LockoutEnd = null;
        }

        AccessFailedCount++;

        if (AccessFailedCount >= maxFailedAttempts)
        {
            LockoutEnd = now.AddMinutes(lockoutMinutes);
        }

        Touch();
    }

    public void RecordSuccessfulLogin()
    {
        AccessFailedCount = 0;
        LockoutEnd = null;
        Touch();
    }

    public void ChangePassword(string newPasswordHash)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(newPasswordHash);
        PasswordHash = newPasswordHash;
        Touch();
    }

    public void SetDefaultClinic(Guid clinicId)
    {
        DefaultClinicId = clinicId;
        Touch();
    }

    public void Deactivate()
    {
        IsActive = false;
        Touch();
    }

    public void Activate()
    {
        IsActive = true;
        Touch();
    }

    public void AssignRole(Guid roleId, Guid? clinicId, Guid? assignedBy, DateTimeOffset now)
    {
        var existing = _assignments.Find(a => a.RoleId == roleId && a.ClinicId == clinicId);
        if (existing is null)
        {
            _assignments.Add(new RoleAssignment(roleId, clinicId, now, assignedBy));
            Touch();
        }
    }

    public void RevokeRole(Guid roleId, Guid? clinicId)
    {
        var count = _assignments.RemoveAll(a => a.RoleId == roleId && a.ClinicId == clinicId);
        if (count > 0)
        {
            Touch();
        }
    }

    public IReadOnlyList<Guid> GetRoleIdsForClinic(Guid clinicId) =>
        _assignments
            .Where(a => a.ClinicId == clinicId || a.ClinicId == null)
            .Select(a => a.RoleId)
            .Distinct()
            .ToList();

    public IReadOnlyList<Guid> GetAssignedClinicIds() =>
        _assignments
            .Where(a => a.ClinicId.HasValue)
            .Select(a => a.ClinicId!.Value)
            .Distinct()
            .ToList();

    public static User Rehydrate(
        Guid id,
        string email,
        string fullName,
        string passwordHash,
        bool isActive,
        int accessFailedCount,
        DateTimeOffset? lockoutEnd,
        Guid? defaultClinicId,
        DateTimeOffset createdAt,
        DateTimeOffset updatedAt,
        IEnumerable<RoleAssignment> assignments)
    {
        var user = new User(id, email, fullName, passwordHash, defaultClinicId)
        {
            IsActive = isActive,
            AccessFailedCount = accessFailedCount,
            LockoutEnd = lockoutEnd
        };
        user.SetAuditDates(createdAt, updatedAt);

        foreach (var assignment in assignments)
        {
            user._assignments.Add(assignment);
        }

        return user;
    }
}