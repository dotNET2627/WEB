namespace DentalManagement.Application.Identity.Commands.Login;

public sealed record LoginCommand(
    string Email,
    string Password,
    bool RememberMe = false,
    Guid? ClinicId = null,
    string? IpAddress = null,
    string? UserAgent = null);
