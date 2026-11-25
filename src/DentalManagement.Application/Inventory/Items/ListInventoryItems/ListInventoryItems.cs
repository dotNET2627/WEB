using DentalManagement.Application.Abstractions.Persistence;
using DentalManagement.Application.Abstractions.Services;
using DentalManagement.Application.Common;
using DentalManagement.Domain.Common;

namespace DentalManagement.Application.Inventory.Items.ListInventoryItems;

public sealed record ListInventoryItemsQuery(Guid ClinicId, string? Search = null);

public sealed record InventoryItemDto(
    Guid Id,
    Guid ClinicId,
    string Code,
    string Name,
    string Category,
    string Unit,
    int MinimumStock,
    int TotalQuantityOnHand,
    bool IsLowStock,
    string? Description,
    bool IsActive,
    DateTimeOffset UpdatedAt);

public sealed class ListInventoryItemsHandler : IQueryHandler<ListInventoryItemsQuery, Result<IReadOnlyList<InventoryItemDto>>>
{
    private readonly IInventoryItemRepository _itemRepository;
    private readonly IInventoryBatchRepository _batchRepository;
    private readonly IClock _clock;

    public ListInventoryItemsHandler(
        IInventoryItemRepository itemRepository,
        IInventoryBatchRepository batchRepository,
        IClock clock)
    {
        _itemRepository = itemRepository;
        _batchRepository = batchRepository;
        _clock = clock;
    }

    public async Task<Result<IReadOnlyList<InventoryItemDto>>> Handle(
        ListInventoryItemsQuery query,
        CancellationToken cancellationToken)
    {
        var items = await _itemRepository.ListByClinicAsync(query.ClinicId, query.Search, cancellationToken);
        var batches = await _batchRepository.ListByClinicAsync(query.ClinicId, cancellationToken);
        var today = DateOnly.FromDateTime(_clock.UtcNow.UtcDateTime);

        var stockByItem = batches
            .Where(b => b.QuantityOnHand > 0 && b.ExpirationDate >= today)
            .GroupBy(b => b.InventoryItemId)
            .ToDictionary(g => g.Key, g => g.Sum(b => b.QuantityOnHand));

        var result = items
            .Select(item =>
            {
                var totalStock = stockByItem.GetValueOrDefault(item.Id, 0);
                return new InventoryItemDto(
                    item.Id,
                    item.ClinicId,
                    item.Code,
                    item.Name,
                    item.Category,
                    item.Unit,
                    item.MinimumStock,
                    totalStock,
                    totalStock <= item.MinimumStock,
                    item.Description,
                    item.IsActive,
                    item.UpdatedAt);
            })
            .ToList();

        return Result<IReadOnlyList<InventoryItemDto>>.Success(result);
    }
}
