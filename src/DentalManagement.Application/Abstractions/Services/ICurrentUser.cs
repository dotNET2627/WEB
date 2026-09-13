namespace DentalManagement.Application.Abstractions.Services;

public interface ICurrentUser
{
    Guid? UserId { get; }
    Guid? ClinicId { get; }
    bool IsAuthenticated { get; }
}
