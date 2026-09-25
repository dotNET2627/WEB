namespace DentalManagement.Application.Identity.Queries.GetCurrentUser;

public sealed record CurrentUserDto(
    Guid Id,
    string Email,
    string FullName,
    Guid? ActiveClinicId,
    IReadOnlyList<string> Roles,
    IReadOnlyList<string> Permissions,
    IReadOnlyList<Guid> AssignedClinicIds);
