namespace DentalManagement.Domain.Identity;

public sealed record RoleAssignment(Guid RoleId, Guid? ClinicId, DateTimeOffset AssignedAt, Guid? AssignedBy);
