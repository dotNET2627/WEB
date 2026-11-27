using DentalManagement.Domain.Insurance;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface IInsuranceClaimRepository
{
    Task<InsuranceClaim?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<InsuranceClaim>> GetByClinicAsync(
        Guid clinicId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        InsuranceClaimStatus? status,
        InsuranceType? insuranceType,
        Guid? patientId,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<InsuranceClaim>> GetByPatientAsync(Guid patientId, CancellationToken cancellationToken);
    Task<string> GenerateNextClaimNumberAsync(Guid clinicId, CancellationToken cancellationToken);
    Task AddAsync(InsuranceClaim claim, CancellationToken cancellationToken);
    Task ReplaceAsync(InsuranceClaim claim, CancellationToken cancellationToken);
}
