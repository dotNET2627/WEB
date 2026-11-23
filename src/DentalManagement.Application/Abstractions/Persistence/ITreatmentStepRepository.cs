using DentalManagement.Domain.Treatments;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface ITreatmentStepRepository
{
    Task<TreatmentStep?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<TreatmentStep>> GetByTreatmentPlanIdAsync(Guid treatmentPlanId, CancellationToken cancellationToken);
    Task AddAsync(TreatmentStep step, CancellationToken cancellationToken);
    Task UpdateAsync(TreatmentStep step, CancellationToken cancellationToken);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken);
    Task UpdateOrderBatchAsync(IReadOnlyList<(Guid Id, int OrderIndex)> stepOrders, CancellationToken cancellationToken);
}
