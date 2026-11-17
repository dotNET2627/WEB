using DentalManagement.Domain.Billing;

namespace DentalManagement.Application.Abstractions.Persistence;

public interface ICashierShiftRepository
{
    Task<CashierShift?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<CashierShift?> GetActiveShiftAsync(Guid clinicId, Guid? cashierId, CancellationToken cancellationToken);
    Task<IReadOnlyList<CashierShift>> GetShiftsAsync(
        Guid clinicId,
        DateTimeOffset? from,
        DateTimeOffset? to,
        Guid? cashierId,
        CancellationToken cancellationToken);
    Task<string> GenerateNextShiftNumberAsync(Guid clinicId, CancellationToken cancellationToken);
    Task AddAsync(CashierShift shift, CancellationToken cancellationToken);
    Task ReplaceAsync(CashierShift shift, CancellationToken cancellationToken);
}
