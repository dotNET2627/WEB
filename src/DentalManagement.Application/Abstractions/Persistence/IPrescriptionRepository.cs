using DentalManagement.Domain.Prescriptions;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IPrescriptionRepository
{
    Task<Prescription?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Prescription>> ListByClinicAsync(
        Guid clinicId,
        Guid? patientId,
        PrescriptionStatus? status,
        CancellationToken cancellationToken);
    Task AddAsync(Prescription prescription, CancellationToken cancellationToken);
    Task ReplaceAsync(Prescription prescription, CancellationToken cancellationToken);
}
