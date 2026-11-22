using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface ITreatmentPlanRepository
{
    Task<TreatmentPlan?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<TreatmentPlan>> GetByPatientIdAsync(Guid patientId, CancellationToken cancellationToken);
    Task AddAsync(TreatmentPlan plan, CancellationToken cancellationToken);
    Task ReplaceAsync(TreatmentPlan plan, CancellationToken cancellationToken);
}
