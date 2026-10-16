using DentalManagement.Domain.MedicalImages;

namespace DentalManagement.Application.Abstractions.Persistence;

/// <summary>Metadata repository for uploaded medical images.</summary>
public interface IMedicalImageRepository
{
    Task<MedicalImage?> GetByIdAsync(Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<MedicalImage>> ListByPatientAsync(Guid clinicId, Guid patientId, CancellationToken cancellationToken);
    Task AddAsync(MedicalImage image, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(Guid clinicId, Guid patientId, Guid id, CancellationToken cancellationToken);
}
