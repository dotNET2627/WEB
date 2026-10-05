using DentalManagement.Domain.Clinics;
using DentalManagement.Infrastructure.Persistence.Documents;

namespace DentalManagement.Infrastructure.Persistence.Mappings;

internal static class ClinicDocumentMapper
{
    public static ClinicDocument ToDocument(Clinic clinic) => new()
    {
        Id = clinic.Id,
        Name = clinic.Name,
        Address = clinic.Address,
        PhoneNumber = clinic.PhoneNumber,
        Email = clinic.Email,
        Description = clinic.Description,
        OpeningHours = clinic.OpeningHours is not null
            ? new Dictionary<string, string>(clinic.OpeningHours)
            : null,
        Logo = clinic.Logo,
        IsActive = clinic.IsActive,
        CreatedAt = clinic.CreatedAt,
        UpdatedAt = clinic.UpdatedAt,
        NgayTao = clinic.CreatedAt,
        NgayCapNhat = clinic.UpdatedAt
    };

    public static Clinic ToDomain(ClinicDocument document)
    {
        var createdAt = document.NgayTao ?? (document.CreatedAt != default ? document.CreatedAt : DateTimeOffset.UtcNow);
        var updatedAt = document.NgayCapNhat ?? (document.UpdatedAt != default ? document.UpdatedAt : DateTimeOffset.UtcNow);

        return Clinic.Rehydrate(
            document.Id,
            document.Name,
            document.Address,
            document.PhoneNumber,
            document.Email,
            document.Description,
            document.OpeningHours,
            document.Logo,
            document.IsActive,
            createdAt,
            updatedAt);
    }
}
