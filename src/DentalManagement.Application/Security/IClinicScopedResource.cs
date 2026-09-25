namespace DentalManagement.Application.Security;

/// <summary>
/// Marks an entity or resource as belonging to a specific clinic for tenant isolation.
/// </summary>
public interface IClinicScopedResource
{
    Guid ClinicId { get; }
}
