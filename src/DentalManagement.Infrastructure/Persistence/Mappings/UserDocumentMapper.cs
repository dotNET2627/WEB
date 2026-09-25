using DentalManagement.Domain.Identity;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class UserDocumentMapper
{
    public static UserDocument ToDocument(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        PasswordHash = user.PasswordHash,
        IsActive = user.IsActive,
        AccessFailedCount = user.AccessFailedCount,
        LockoutEnd = user.LockoutEnd,
        DefaultClinicId = user.DefaultClinicId,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt,
        Assignments = user.Assignments
            .Select(a => new RoleAssignmentDocument(a.RoleId, a.ClinicId, a.AssignedAt, a.AssignedBy))
            .ToArray()
    };

    public static User ToDomain(UserDocument document) =>
        User.Rehydrate(
            document.Id,
            document.Email,
            document.FullName,
            document.PasswordHash,
            document.IsActive,
            document.AccessFailedCount,
            document.LockoutEnd,
            document.DefaultClinicId,
            document.CreatedAt,
            document.UpdatedAt,
            document.Assignments.Select(a => new RoleAssignment(a.RoleId, a.ClinicId, a.AssignedAt, a.AssignedBy)));
}
