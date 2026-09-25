namespace DentalManagement.Application.Abstractions.Services;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
    Guid? ClinicId { get; }
    bool IsAuthenticated { get; }
    IReadOnlyList<string> Roles { get; }
    IReadOnlyList<string> Permissions { get; }
    bool HasPermission(string permission);
}
