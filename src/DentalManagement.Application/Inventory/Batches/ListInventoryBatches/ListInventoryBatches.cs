using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Inventory.Batches.ListInventoryBatches;

public sealed record ListInventoryBatchesQuery(Guid ClinicId, Guid InventoryItemId);

public sealed record InventoryBatchDto(
    Guid Id,
    Guid ClinicId,
    Guid InventoryItemId,
    string BatchNumber,
    DateOnly ExpirationDate,
    int QuantityOnHand,
    decimal UnitCost,
    bool IsExpired,
    bool IsExpiringSoon,
    DateTimeOffset CreatedAt);

public sealed class ListInventoryBatchesHandler : IQueryHandler<ListInventoryBatchesQuery, Result<IReadOnlyList<InventoryBatchDto>>>
{
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IClock _clock;

    public ListInventoryBatchesHandler(IInventoryBatchRepository batchRepository, IClock clock)
    {
        _batchRepository = batchRepository;
        _clock = clock;
    }

    public async Task<Result<IReadOnlyList<InventoryBatchDto>>> Handle(
        ListInventoryBatchesQuery query,
        CancellationToken cancellationToken)
    {
        var batches = await _batchRepository.ListByItemAsync(query.ClinicId, query.InventoryItemId, cancellationToken);
        var today = DateOnly.FromDateTime(_clock.UtcNow.UtcDateTime);
        var warningThreshold = today.AddDays(30);

        var result = batches
            .Select(b => new InventoryBatchDto(
                b.Id,
                b.ClinicId,
                b.InventoryItemId,
                b.BatchNumber,
                b.ExpirationDate,
                b.QuantityOnHand,
                b.UnitCost,
                b.ExpirationDate < today,
                b.ExpirationDate >= today && b.ExpirationDate <= warningThreshold,
                b.CreatedAt))
            .ToList();

        return Result<IReadOnlyList<InventoryBatchDto>>.Success(result);
    }
}
